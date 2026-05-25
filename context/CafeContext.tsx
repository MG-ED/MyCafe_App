import { auth, db, uploadImageAsync } from "@/constants/firebase";
import * as Network from "expo-network";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

// ── FIX: Cross-platform storage shim ─────────────────────────────────────────
// Importing AsyncStorage unconditionally at the top level crashes expo-router's
// SSR bundler (node/render.js) because the native module cannot be resolved in
// Node.js. Use dynamic require() gated on Platform.OS so the native path is
// never evaluated during web/SSR bundling.
const storage = {
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web") {
      try {
        localStorage.setItem(key, value);
      } catch {
        /* private-mode */
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const AS = require("@react-native-async-storage/async-storage").default;
      await AS.setItem(key, value);
    }
  },
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === "web") {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AS = require("@react-native-async-storage/async-storage").default;
    return AS.getItem(key);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === "web") {
      try {
        localStorage.removeItem(key);
      } catch {
        /* private-mode */
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const AS = require("@react-native-async-storage/async-storage").default;
      await AS.removeItem(key);
    }
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProductCategory = "drinks" | "snacks";

export interface Product {
  id: string;
  name: string;
  price: number;
  category: ProductCategory;
  emoji: string;
  imageUri?: string;
  bg: string;
  tag: string;
  isFavorite?: boolean;
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  fullName?: string;
  email?: string;
  gmail?: string;
  cafeName?: string;
  profilePic?: string;
  photoURL?: string;
  createdAt?: number;
}

// CartItem is a wrapper — product is nested, not spread
export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
}

export type OrderStatus = "Pending" | "Preparing" | "Ready" | "Done";

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  customerName: string;
  orderNumber?: number;
  time?: string;
  status: OrderStatus;
  createdAt: number;
}

interface AddProductPayload extends Omit<
  Product,
  "id" | "createdAt" | "isFavorite"
> {
  imageUri?: string;
}

type OfflineAction =
  | { type: "addProduct"; payload: AddProductPayload }
  | { type: "toggleFavorite"; payload: { id: string } }
  | { type: "deleteProduct"; payload: { id: string } }
  | {
      type: "placeOrder";
      payload: { customerName: string; cart: CartItem[]; total: number };
    }
  | { type: "updateOrderStatus"; payload: { id: string; status: OrderStatus } }
  | { type: "uploadProfileImage"; payload: { uri: string } };

// ── Context shape ─────────────────────────────────────────────────────────────

interface CafeContextValue {
  cafeName: string;

  products: Product[];
  favorites: Set<string>;
  addProduct: (data: AddProductPayload) => void;
  toggleFavorite: (id: string) => void;
  deleteProduct: (id: string) => void;

  // Helper: returns true if the product was created within the last 24 hours
  isNewProduct: (product: Product) => boolean;

  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: Product, size?: string) => void;
  updateCartQuantity: (id: string, size: string, delta: number) => void;
  removeFromCart: (id: string, size: string) => void;
  clearCart: () => void;

  orders: Order[];
  placeOrder: (customerName: string) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  // ADDED: deletes all orders from Firestore — products are untouched
  endShift: () => Promise<void>;

  userProfile: UserProfile | null;
  uploadProfilePhoto: (uri: string) => Promise<void>;
  isOffline: boolean;
  syncPending: boolean;
  queueLength: number;
}

const CafeContext = createContext<CafeContextValue | null>(null);

export function useCafe() {
  const ctx = useContext(CafeContext);
  if (!ctx) throw new Error("useCafe must be used inside <CafeProvider>");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function CafeProvider({ children }: { children: React.ReactNode }) {
  const [uid, setUid] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  // BUG FIX: flushQueue was reading `isOffline` from a stale closure captured
  // when the network listener callback was created. Use a ref so the callback
  // always reads the latest value without needing to be re-registered.
  const isOfflineRef = useRef(false);
  const [syncPending, setSyncPending] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>([]);
  const offlineQueueRef = useRef<OfflineAction[]>([]);
  offlineQueueRef.current = offlineQueue;
  // Keep the ref in sync with state so flushQueue never reads a stale value
  isOfflineRef.current = isOffline;

  // BUG FIX: uid ref prevents stale uid in flushQueue / runQueuedAction which
  // are called from async network callbacks that may outlive the render cycle
  // in which they were created.
  const uidRef = useRef<string | null>(null);
  uidRef.current = uid;

  const [cafeName, setCafeName] = useState("My Cafe");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const cacheKey = useCallback(
    (key: string) => `mycafe:${uid ?? "anon"}:${key}`,
    [uid],
  );

  // Returns true for URIs that are already stored (remote URL or Base64 data URI)
  // so we don't re-encode them on every save.
  const isRemoteUrl = (uri: string) =>
    uri.startsWith("http://") ||
    uri.startsWith("https://") ||
    uri.startsWith("data:");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!uid) {
      setCafeName("My Cafe");
      return;
    }
    // BUG FIX: Added .catch() so a Firestore network error (e.g. offline on
    // first launch before cache is populated) doesn't cause an unhandled
    // promise rejection that crashes the JS thread.
    getDoc(doc(db, "users", uid))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setCafeName(data.cafeName || data.username || "My Cafe");
        }
      })
      .catch(() => {
        // Keep the default "My Cafe" name; Firestore offline cache will
        // serve stale data on the next attempt.
      });
  }, [uid]);

  // ── Offline queue & cache helpers ────────────────────────────────────────────
  const persistQueue = useCallback(async (queue: OfflineAction[]) => {
    if (!uidRef.current) return;
    await storage.setItem(
      `mycafe:${uidRef.current}:queue`,
      JSON.stringify(queue),
    );
  }, []);

  const persistCache = useCallback(async (key: string, value: unknown) => {
    if (!uidRef.current) return;
    await storage.setItem(
      `mycafe:${uidRef.current}:${key}`,
      JSON.stringify(value),
    );
  }, []);

  const loadCachedData = useCallback(async (currentUid: string) => {
    const makeKey = (k: string) => `mycafe:${currentUid}:${k}`;
    const keys = ["queue", "products", "orders", "cart", "profile"];
    const values = await Promise.all(
      keys.map((key) => storage.getItem(makeKey(key))),
    );

    if (values[0]) {
      try {
        setOfflineQueue(JSON.parse(values[0]));
      } catch {
        setOfflineQueue([]);
      }
    }
    if (values[1]) {
      try {
        setProducts(JSON.parse(values[1]));
      } catch {
        setProducts([]);
      }
    }
    if (values[2]) {
      try {
        setOrders(JSON.parse(values[2]));
      } catch {
        setOrders([]);
      }
    }
    if (values[3]) {
      try {
        setCart(JSON.parse(values[3]));
      } catch {
        setCart([]);
      }
    }
    if (values[4]) {
      try {
        setUserProfile(JSON.parse(values[4]));
      } catch {
        setUserProfile(null);
      }
    }
  }, []);

  useEffect(() => {
    if (!uid) return;
    loadCachedData(uid);
  }, [uid, loadCachedData]);

  useEffect(() => {
    if (!uid) {
      setProducts([]);
      setOrders([]);
      setCart([]);
      setUserProfile(null);
      setOfflineQueue([]);
      setIsOffline(false);
      return;
    }
  }, [uid]);

  const runQueuedAction = useCallback(
    async (action: OfflineAction) => {
      const currentUid = uidRef.current;
      if (!currentUid) return;
      switch (action.type) {
        case "addProduct": {
          const payload = action.payload;
          const productData = { ...payload, isFavorite: false };
          if (payload.imageUri && !isRemoteUrl(payload.imageUri)) {
            productData.imageUri = await uploadImageAsync(
              payload.imageUri,
              `productImages/${currentUid}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
            );
          }
          await addDoc(collection(db, "users", currentUid, "products"), {
            ...productData,
            createdAt: Date.now(),
          });
          break;
        }
        case "toggleFavorite": {
          const { id } = action.payload;
          const current = productsRef.current.find((p) => p.id === id);
          if (!current) return;
          await updateDoc(doc(db, "users", currentUid, "products", id), {
            isFavorite: !current.isFavorite,
          });
          break;
        }
        case "deleteProduct": {
          await deleteDoc(
            doc(db, "users", currentUid, "products", action.payload.id),
          );
          break;
        }
        case "placeOrder": {
          await addDoc(collection(db, "users", currentUid, "orders"), {
            items: action.payload.cart,
            total: action.payload.total,
            customerName: action.payload.customerName,
            status: "Pending",
            createdAt: serverTimestamp(),
          });
          break;
        }
        case "updateOrderStatus": {
          await updateDoc(
            doc(db, "users", currentUid, "orders", action.payload.id),
            { status: action.payload.status },
          );
          break;
        }
        case "uploadProfileImage": {
          const currentUidForUpload = uidRef.current;
          if (!currentUidForUpload) return;
          const downloadUrl = await uploadImageAsync(
            action.payload.uri,
            `profilePics/${currentUidForUpload}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
          );
          await updateDoc(doc(db, "users", currentUidForUpload), {
            profilePic: downloadUrl,
          });
          break;
        }
      }
    },
    // productsRef is a ref — safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const flushQueue = useCallback(async () => {
    // BUG FIX: Read from refs — not stale closure variables — so we get the
    // current network/auth state at flush time regardless of when this was
    // captured.
    if (
      !uidRef.current ||
      offlineQueueRef.current.length === 0 ||
      isOfflineRef.current
    )
      return;
    setSyncPending(true);
    const queue = [...offlineQueueRef.current];
    setOfflineQueue([]);
    await storage.removeItem(`mycafe:${uidRef.current}:queue`);

    const failed: OfflineAction[] = [];
    for (const action of queue) {
      try {
        await runQueuedAction(action);
      } catch {
        failed.push(action);
      }
    }

    if (failed.length > 0) {
      setOfflineQueue(failed);
      await persistQueue(failed);
    }

    setSyncPending(false);
  }, [runQueuedAction, persistQueue]);

  useEffect(() => {
    // BUG FIX (original): The previous code used an async subscribe() and the
    // cleanup was a Promise, so React never called listener.remove().
    //
    // BUG FIX (race): Even with a local listenerSub variable, a race exists:
    // if uid changes before getNetworkStateAsync() resolves, React runs the
    // cleanup (listenerSub is still null → no-op), then the .then() fires and
    // assigns the listener AFTER cleanup — it is never removed.
    //
    // Fix: introduce an `active` flag. If the effect is torn down before the
    // async work finishes, we skip adding the listener entirely.
    let active = true;
    let listenerSub: { remove?: () => void } | null = null;

    Network.getNetworkStateAsync().then((state) => {
      if (!active) return; // effect was cleaned up before we resolved — abort
      setIsOffline(!state.isConnected);
      if (state.isConnected) {
        flushQueue();
      }
      listenerSub = Network.addNetworkStateListener((next) => {
        const offline = !next.isConnected;
        setIsOffline(offline);
        if (!offline) flushQueue();
      });
    });

    return () => {
      active = false; // cancel pending async work
      listenerSub?.remove?.(); // remove listener if already registered
    };
  }, [uid, flushQueue]);

  // ── Products ──────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const productsRef = useRef<Product[]>([]);
  productsRef.current = products;

  useEffect(() => {
    if (!uid) {
      setProducts([]);
      return;
    }
    const q = query(
      collection(db, "users", uid, "products"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      const freshProducts = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Product,
      );
      setProducts(freshProducts);
      persistCache("products", freshProducts);
    });
    return unsub;
  }, [uid, persistCache]);

  const addProduct = useCallback(
    async (data: AddProductPayload) => {
      if (!uidRef.current) return;
      const currentUid = uidRef.current;
      const action: OfflineAction = { type: "addProduct", payload: data };
      if (isOfflineRef.current) {
        setOfflineQueue((prev) => {
          const next = [...prev, action];
          persistQueue(next);
          return next;
        });
        return;
      }

      const payload = { ...data };
      if (payload.imageUri && !isRemoteUrl(payload.imageUri)) {
        payload.imageUri = await uploadImageAsync(
          payload.imageUri,
          `productImages/${currentUid}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
        );
      }
      await addDoc(collection(db, "users", currentUid, "products"), {
        ...payload,
        isFavorite: false,
        createdAt: Date.now(),
      });
    },
    [persistQueue],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      if (!uidRef.current) return;
      const currentUid = uidRef.current;
      const action: OfflineAction = {
        type: "toggleFavorite",
        payload: { id },
      };
      if (isOfflineRef.current) {
        setOfflineQueue((prev) => {
          const next = [...prev, action];
          persistQueue(next);
          return next;
        });
        return;
      }

      const product = productsRef.current.find((p) => p.id === id);
      if (!product) return;
      await updateDoc(doc(db, "users", currentUid, "products", id), {
        isFavorite: !product.isFavorite,
      });
    },
    [persistQueue],
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      if (!uidRef.current) return;
      const currentUid = uidRef.current;
      const action: OfflineAction = {
        type: "deleteProduct",
        payload: { id },
      };
      if (isOfflineRef.current) {
        setOfflineQueue((prev) => {
          const next = [...prev, action];
          persistQueue(next);
          return next;
        });
        return;
      }
      await deleteDoc(doc(db, "users", currentUid, "products", id));
    },
    [persistQueue],
  );

  // ADDED: returns true if product was created less than 24 hours ago
  const isNewProduct = useCallback((product: Product): boolean => {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    return Date.now() - product.createdAt < ONE_DAY_MS;
  }, []);

  // ── Cart ──────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    if (!uid) return;
    persistCache("cart", cart);
  }, [cart, uid, persistCache]);

  const cartCount = useMemo(
    () => cart.reduce((s, i) => s + i.quantity, 0),
    [cart],
  );

  // BUG FIX: Floating-point arithmetic (price * quantity across multiple items)
  // can produce results like 99.99999999. Round to 2 decimal places so the
  // displayed total and the value stored in Firestore are always clean.
  const cartTotal = useMemo(
    () =>
      Math.round(
        cart.reduce((s, i) => s + i.product.price * i.quantity, 0) * 100,
      ) / 100,
    [cart],
  );

  const addToCart = useCallback(
    (product: Product, size: string = "Regular") => {
      setCart((prev) => {
        const existing = prev.find(
          (i) => i.product.id === product.id && i.size === size,
        );
        if (existing) {
          return prev.map((i) =>
            i.product.id === product.id && i.size === size
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          );
        }
        return [...prev, { product, quantity: 1, size }];
      });
    },
    [],
  );

  const updateCartQuantity = useCallback(
    (id: string, size: string, delta: number) => {
      setCart((prev) =>
        prev
          .map((i) =>
            i.product.id === id && i.size === size
              ? { ...i, quantity: i.quantity + delta }
              : i,
          )
          .filter((i) => i.quantity > 0),
      );
    },
    [],
  );

  const removeFromCart = useCallback((id: string, size: string) => {
    setCart((prev) =>
      prev.filter((i) => !(i.product.id === id && i.size === size)),
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  // ── Orders ────────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!uid) {
      setOrders([]);
      return;
    }
    const q = query(
      collection(db, "users", uid, "orders"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      const freshOrders = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Order,
      );
      setOrders(freshOrders);
      persistCache("orders", freshOrders);
    });
    return unsub;
  }, [uid, persistCache]);

  const placeOrder = useCallback(
    async (customerName: string) => {
      if (!uidRef.current || cart.length === 0) return;
      const currentUid = uidRef.current;
      const action: OfflineAction = {
        type: "placeOrder",
        payload: { customerName, cart, total: cartTotal },
      };
      if (isOfflineRef.current) {
        setOfflineQueue((prev) => {
          const next = [...prev, action];
          persistQueue(next);
          return next;
        });
        clearCart();
        return;
      }

      await addDoc(collection(db, "users", currentUid, "orders"), {
        items: cart,
        total: cartTotal,
        customerName,
        status: "Pending" as OrderStatus,
        createdAt: serverTimestamp(),
      });
      clearCart();
    },
    [cart, cartTotal, clearCart, persistQueue],
  );

  const updateOrderStatus = useCallback(
    async (id: string, status: OrderStatus) => {
      if (!uidRef.current) return;
      const currentUid = uidRef.current;
      const action: OfflineAction = {
        type: "updateOrderStatus",
        payload: { id, status },
      };
      if (isOfflineRef.current) {
        setOfflineQueue((prev) => {
          const next = [...prev, action];
          persistQueue(next);
          return next;
        });
        return;
      }
      await updateDoc(doc(db, "users", currentUid, "orders", id), { status });
    },
    [persistQueue],
  );

  // ADDED: End Shift — deletes every order document. Products are NOT touched.
  // BUG FIX: Added offline guard and try/catch — the original silently threw
  // an unhandled error when called with no network connection.
  const endShift = useCallback(async () => {
    if (!uidRef.current) return;
    if (isOfflineRef.current) {
      throw new Error(
        "Cannot end shift while offline. Please reconnect and try again.",
      );
    }
    const currentUid = uidRef.current;
    const snap = await getDocs(collection(db, "users", currentUid, "orders"));
    const deletions = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletions);
    setOrders([]);
  }, []);

  // ── User profile ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) {
      setUserProfile(null);
      return;
    }
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      const currentUser = auth.currentUser;
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        const profileData: UserProfile = {
          ...data,
          uid: data.uid || uid,
          fullName: data.fullName || currentUser?.displayName || undefined,
          gmail: data.gmail || data.email || currentUser?.email || undefined,
          email: data.gmail || data.email || currentUser?.email || undefined,
          // Fall back to Firebase Auth's Google photo if Firestore doesn't have one
          profilePic: data.profilePic || currentUser?.photoURL || undefined,
          photoURL: data.photoURL || currentUser?.photoURL || undefined,
        };
        setUserProfile(profileData);
        persistCache("profile", profileData);
      } else if (currentUser) {
        const profileData: UserProfile = {
          uid,
          fullName: currentUser.displayName || undefined,
          gmail: currentUser.email || undefined,
          email: currentUser.email || undefined,
          photoURL: currentUser.photoURL || undefined,
        };
        setUserProfile(profileData);
        persistCache("profile", profileData);
      }
    });
    return unsub;
  }, [uid, persistCache]);

  const uploadProfilePhoto = useCallback(
    async (uri: string) => {
      if (!uidRef.current) return;
      const currentUid = uidRef.current;
      const action: OfflineAction = {
        type: "uploadProfileImage",
        payload: { uri },
      };
      if (isOfflineRef.current) {
        setOfflineQueue((prev) => {
          const next = [...prev, action];
          persistQueue(next);
          return next;
        });
        return;
      }

      const downloadUrl = await uploadImageAsync(
        uri,
        `profilePics/${currentUid}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
      );
      await updateDoc(doc(db, "users", currentUid), {
        profilePic: downloadUrl,
      });
      // Note: updateProfile(photoURL) skipped — Base64 strings exceed Firebase
      // Auth's photoURL length limit. Profile pic is read from Firestore instead.
    },
    [persistQueue],
  );

  const favorites = useMemo(
    () => new Set(products.filter((p) => p.isFavorite).map((p) => p.id)),
    [products],
  );

  // BUG FIX: The context value was recreated as a plain object literal on every
  // render, causing ALL useCafe() consumers (all 7 tab screens, every ProductCard)
  // to re-render even when the data they use hasn't changed — for example, a
  // syncPending toggle would re-render the entire product grid. Wrapping in
  // useMemo means consumers only re-render when a value they subscribe to
  // actually changes.
  const value = useMemo<CafeContextValue>(
    () => ({
      cafeName,
      products,
      favorites,
      addProduct,
      toggleFavorite,
      deleteProduct,
      isNewProduct,
      cart,
      cartCount,
      cartTotal,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      orders,
      placeOrder,
      updateOrderStatus,
      endShift,
      userProfile,
      uploadProfilePhoto,
      isOffline,
      syncPending,
      queueLength: offlineQueue.length,
    }),
    [
      cafeName,
      products,
      favorites,
      addProduct,
      toggleFavorite,
      deleteProduct,
      isNewProduct,
      cart,
      cartCount,
      cartTotal,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      orders,
      placeOrder,
      updateOrderStatus,
      endShift,
      userProfile,
      uploadProfilePhoto,
      isOffline,
      syncPending,
      offlineQueue.length,
    ],
  );

  return <CafeContext.Provider value={value}>{children}</CafeContext.Provider>;
}
