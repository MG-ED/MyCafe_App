import { auth, db, uploadImageAsync } from "@/constants/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  const [syncPending, setSyncPending] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>([]);
  const offlineQueueRef = useRef<OfflineAction[]>([]);
  offlineQueueRef.current = offlineQueue;

  const [cafeName, setCafeName] = useState("My Cafe");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const cacheKey = (key: string) => `mycafe:${uid ?? "anon"}:${key}`;
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
    getDoc(doc(db, "users", uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCafeName(data.cafeName || data.username || "My Cafe");
      }
    });
  }, [uid]);

  // ── Offline queue & cache helpers ────────────────────────────────────────────
  const persistQueue = async (queue: OfflineAction[]) => {
    if (!uid) return;
    await AsyncStorage.setItem(cacheKey("queue"), JSON.stringify(queue));
  };

  const persistCache = async (key: string, value: unknown) => {
    if (!uid) return;
    await AsyncStorage.setItem(cacheKey(key), JSON.stringify(value));
  };

  const loadCachedData = async () => {
    if (!uid) return;

    const keys = ["queue", "products", "orders", "cart", "profile"];
    const values = await Promise.all(
      keys.map((key) => AsyncStorage.getItem(cacheKey(key))),
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
  };

  useEffect(() => {
    if (!uid) return;
    loadCachedData();
  }, [uid]);

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

  const runQueuedAction = async (action: OfflineAction) => {
    if (!uid) return;
    switch (action.type) {
      case "addProduct": {
        const payload = action.payload;
        const productData = { ...payload, isFavorite: false };
        if (payload.imageUri && !isRemoteUrl(payload.imageUri)) {
          productData.imageUri = await uploadImageAsync(
            payload.imageUri,
            `productImages/${uid}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
          );
        }
        await addDoc(collection(db, "users", uid, "products"), {
          ...productData,
          createdAt: Date.now(),
        });
        break;
      }
      case "toggleFavorite": {
        const { id } = action.payload;
        const current = productsRef.current.find((p) => p.id === id);
        if (!current) return;
        await updateDoc(doc(db, "users", uid, "products", id), {
          isFavorite: !current.isFavorite,
        });
        break;
      }
      case "deleteProduct": {
        await deleteDoc(doc(db, "users", uid, "products", action.payload.id));
        break;
      }
      case "placeOrder": {
        await addDoc(collection(db, "users", uid, "orders"), {
          items: action.payload.cart,
          total: action.payload.total,
          customerName: action.payload.customerName,
          status: "Pending",
          createdAt: serverTimestamp(),
        });
        break;
      }
      case "updateOrderStatus": {
        await updateDoc(doc(db, "users", uid, "orders", action.payload.id), {
          status: action.payload.status,
        });
        break;
      }
      case "uploadProfileImage": {
        const downloadUrl = await uploadImageAsync(
          action.payload.uri,
          `profilePics/${uid}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
        );
        await updateDoc(doc(db, "users", uid), {
          profilePic: downloadUrl,
        });
        // Note: updateProfile(photoURL) is skipped — Firebase Auth has a URL
        // length limit that a Base64 string would exceed. The profile pic is
        // read from Firestore (userProfile.profilePic) instead.
        break;
      }
    }
  };

  const flushQueue = async () => {
    if (!uid || offlineQueueRef.current.length === 0 || isOffline) return;
    setSyncPending(true);
    const queue = [...offlineQueueRef.current];
    setOfflineQueue([]);
    await AsyncStorage.removeItem(cacheKey("queue"));

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
  };

  useEffect(() => {
    const subscribe = async () => {
      const state = await Network.getNetworkStateAsync();
      setIsOffline(!state.isConnected);
      if (state.isConnected) {
        flushQueue();
      }
      const listener = Network.addNetworkStateListener((next) => {
        const offline = !next.isConnected;
        setIsOffline(offline);
        if (!offline) flushQueue();
      });
      return () => listener.remove?.();
    };
    subscribe();
  }, [uid]);

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
  }, [uid]);

  const addProduct = async (data: AddProductPayload) => {
    if (!uid) return;
    const action: OfflineAction = { type: "addProduct", payload: data };
    if (isOffline) {
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
        `productImages/${uid}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
      );
    }
    await addDoc(collection(db, "users", uid, "products"), {
      ...payload,
      isFavorite: false,
      createdAt: Date.now(),
    });
  };

  const toggleFavorite = async (id: string) => {
    if (!uid) return;
    const action: OfflineAction = { type: "toggleFavorite", payload: { id } };
    if (isOffline) {
      setOfflineQueue((prev) => {
        const next = [...prev, action];
        persistQueue(next);
        return next;
      });
      return;
    }

    const product = productsRef.current.find((p) => p.id === id);
    if (!product) return;
    await updateDoc(doc(db, "users", uid, "products", id), {
      isFavorite: !product.isFavorite,
    });
  };

  const deleteProduct = async (id: string) => {
    if (!uid) return;
    const action: OfflineAction = { type: "deleteProduct", payload: { id } };
    if (isOffline) {
      setOfflineQueue((prev) => {
        const next = [...prev, action];
        persistQueue(next);
        return next;
      });
      return;
    }
    await deleteDoc(doc(db, "users", uid, "products", id));
  };

  // ADDED: returns true if product was created less than 24 hours ago
  const isNewProduct = (product: Product): boolean => {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    return Date.now() - product.createdAt < ONE_DAY_MS;
  };

  // ── Cart ──────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    if (!uid) return;
    persistCache("cart", cart);
  }, [cart, uid]);

  const cartCount = useMemo(
    () => cart.reduce((s, i) => s + i.quantity, 0),
    [cart],
  );
  const cartTotal = useMemo(
    () => cart.reduce((s, i) => s + i.product.price * i.quantity, 0),
    [cart],
  );

  const addToCart = (product: Product, size: string = "Regular") => {
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
  };

  const updateCartQuantity = (id: string, size: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === id && i.size === size
            ? { ...i, quantity: i.quantity + delta }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const removeFromCart = (id: string, size: string) => {
    setCart((prev) =>
      prev.filter((i) => !(i.product.id === id && i.size === size)),
    );
  };

  const clearCart = () => setCart([]);

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
  }, [uid]);

  const placeOrder = async (customerName: string) => {
    if (!uid || cart.length === 0) return;
    const action: OfflineAction = {
      type: "placeOrder",
      payload: { customerName, cart, total: cartTotal },
    };
    if (isOffline) {
      setOfflineQueue((prev) => {
        const next = [...prev, action];
        persistQueue(next);
        return next;
      });
      clearCart();
      return;
    }

    await addDoc(collection(db, "users", uid, "orders"), {
      items: cart,
      total: cartTotal,
      customerName,
      status: "Pending" as OrderStatus,
      createdAt: serverTimestamp(),
    });
    clearCart();
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    if (!uid) return;
    const action: OfflineAction = {
      type: "updateOrderStatus",
      payload: { id, status },
    };
    if (isOffline) {
      setOfflineQueue((prev) => {
        const next = [...prev, action];
        persistQueue(next);
        return next;
      });
      return;
    }
    await updateDoc(doc(db, "users", uid, "orders", id), { status });
  };

  // ADDED: End Shift — deletes every order document. Products are NOT touched.
  const endShift = async () => {
    if (!uid) return;
    const snap = await getDocs(collection(db, "users", uid, "orders"));
    const deletions = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletions);
    setOrders([]);
  };

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
  }, [uid]);

  const uploadProfilePhoto = async (uri: string) => {
    if (!uid) return;
    const action: OfflineAction = {
      type: "uploadProfileImage",
      payload: { uri },
    };
    if (isOffline) {
      setOfflineQueue((prev) => {
        const next = [...prev, action];
        persistQueue(next);
        return next;
      });
      return;
    }

    const downloadUrl = await uploadImageAsync(
      uri,
      `profilePics/${uid}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
    );
    await updateDoc(doc(db, "users", uid), { profilePic: downloadUrl });
    // Note: updateProfile(photoURL) skipped — Base64 strings exceed Firebase
    // Auth's photoURL length limit. Profile pic is read from Firestore instead.
  };

  const favorites = useMemo(
    () => new Set(products.filter((p) => p.isFavorite).map((p) => p.id)),
    [products],
  );

  const value: CafeContextValue = {
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
  };

  return <CafeContext.Provider value={value}>{children}</CafeContext.Provider>;
}
