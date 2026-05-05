// ─── context/CafeContext.tsx ──────────────────────────────────────────────────
// FIXED:
//  • CartItem now has { product: Product; quantity: number; size: string }
//  • updateCartQuantity / removeFromCart accept (id, size, delta)
//  • placeOrder accepts customerName param
//  • ADDED endShift() — deletes all orders from Firestore for the current user
//  • Product.createdAt used to determine "New" tag expiry (24 hours)
// ─────────────────────────────────────────────────────────────────────────────

import { auth, db } from "@/constants/firebase";
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

// ── Context shape ─────────────────────────────────────────────────────────────

interface CafeContextValue {
  cafeName: string;

  products: Product[];
  favorites: Set<string>;
  addProduct: (data: Omit<Product, "id" | "createdAt" | "isFavorite">) => void;
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
    });
    return unsub;
  }, []);

  const [cafeName, setCafeName] = useState("My Cafe");

  useEffect(() => {
    if (!uid) { setCafeName("My Cafe"); return; }
    getDoc(doc(db, "users", uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCafeName(data.cafeName || data.username || "My Cafe");
      }
    });
  }, [uid]);

  // ── Products ──────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const productsRef = useRef<Product[]>([]);
  productsRef.current = products;

  useEffect(() => {
    if (!uid) { setProducts([]); return; }
    const q = query(
      collection(db, "users", uid, "products"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product));
    });
    return unsub;
  }, [uid]);

  const addProduct = async (
    data: Omit<Product, "id" | "createdAt" | "isFavorite">,
  ) => {
    if (!uid) return;
    await addDoc(collection(db, "users", uid, "products"), {
      ...data,
      isFavorite: false,
      createdAt: Date.now(),
    });
  };

  const toggleFavorite = async (id: string) => {
    if (!uid) return;
    const product = productsRef.current.find((p) => p.id === id);
    if (!product) return;
    await updateDoc(doc(db, "users", uid, "products", id), {
      isFavorite: !product.isFavorite,
    });
  };

  const deleteProduct = async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "products", id));
  };

  // ADDED: returns true if product was created less than 24 hours ago
  const isNewProduct = (product: Product): boolean => {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    return Date.now() - product.createdAt < ONE_DAY_MS;
  };

  // ── Cart ──────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);

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
    if (!uid) { setOrders([]); return; }
    const q = query(
      collection(db, "users", uid, "orders"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order));
    });
    return unsub;
  }, [uid]);

  const placeOrder = async (customerName: string) => {
    if (!uid || cart.length === 0) return;
    const now = new Date();
    const time = now.toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const orderNumber = orders.length + 1;
    await addDoc(collection(db, "users", uid, "orders"), {
      items: cart,
      total: cartTotal,
      customerName,
      orderNumber,
      time,
      status: "Pending" as OrderStatus,
      createdAt: serverTimestamp(),
    });
    clearCart();
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid, "orders", id), { status });
  };

  // ADDED: End Shift — deletes every order document. Products are NOT touched.
  const endShift = async () => {
    if (!uid) return;
    const snap = await getDocs(collection(db, "users", uid, "orders"));
    const deletions = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletions);
    // local state is cleared immediately via the onSnapshot listener,
    // but also clear it here so the UI responds instantly
    setOrders([]);
  };

  // ── Favorites ─────────────────────────────────────────────────────────────
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
  };

  return <CafeContext.Provider value={value}>{children}</CafeContext.Provider>;
}
