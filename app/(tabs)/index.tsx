// ─── app/(tabs)/index.tsx ────────────────────────────────────────────────────
// CHANGES:
//  • ADDED Logout button in the header (top-right, next to cart icon)
//  • Logout calls Firebase signOut, clears auth, redirects to /(auth)/welcome
//  • FIXED unused `activeOrders` variable (was computed but never displayed)
// ─────────────────────────────────────────────────────────────────────────────

import AddProductModal from "@/components/AddProductModal";
import ProductCard from "@/components/ProductCard";
import { auth } from "@/constants/firebase";
import { useCafe } from "@/context/CafeContext";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { products, cartCount, orders, cafeName } = useCafe();
  const insets = useSafeAreaInsets();
  const [showAddModal, setShowAddModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  const allProducts = [...products].sort((a, b) => b.createdAt - a.createdAt);
  const drinks = allProducts.filter((p) => p.category === "drinks");
  const snacks = allProducts.filter((p) => p.category === "snacks");

  const todayIncome = orders
    .filter((o) => o.status === "Done")
    .reduce((sum, o) => sum + o.total, 0);

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Good morning ☀️"
      : hour < 18
        ? "Good afternoon 🌤️"
        : "Good evening 🌙";

  // ── Logout handler ────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try {
            await signOut(auth);
            // Auth state change in _layout.tsx will redirect to /(auth)/welcome
            router.replace("/(auth)/welcome");
          } catch {
            Alert.alert("Error", "Could not log out. Please try again.");
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetSmall}>{greeting}</Text>
            <Text
              style={styles.greetBig}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {cafeName}
            </Text>
          </View>

          <View style={styles.headerRight}>
            {/* Cart icon with badge */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push("/(tabs)/cart")}
              activeOpacity={0.85}
            >
              <Feather name="shopping-cart" size={20} color="#FFF5E4" />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Logout button */}
            <TouchableOpacity
              style={[styles.iconBtn, styles.logoutBtn]}
              onPress={handleLogout}
              activeOpacity={0.85}
              disabled={loggingOut}
            >
              <Feather name="log-out" size={18} color="#C0392B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{orders.length}</Text>
            <Text style={styles.statLbl}>ORDERS</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#E8F5E9" }]}>
            <Text style={[styles.statVal, { color: "#2E7D32" }]}>
              ₱{todayIncome.toLocaleString()}
            </Text>
            <Text style={styles.statLbl}>INCOME</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#E3F2FD" }]}>
            <Text style={[styles.statVal, { color: "#1565C0" }]}>
              {cartCount}
            </Text>
            <Text style={styles.statLbl}>IN CART</Text>
          </View>
        </View>

        {/* ── All Products ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>All Products</Text>
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              style={styles.addProductBtn}
            >
              <Feather name="plus" size={14} color="#FFF5E4" />
              <Text style={styles.addProductText}>Add</Text>
            </TouchableOpacity>
          </View>

          {allProducts.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyCard}
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.emptyIconWrap}>
                <Feather name="plus" size={28} color="#C4A882" />
              </View>
              <Text style={styles.emptyTitle}>No products yet</Text>
              <Text style={styles.emptyText}>
                Tap to add your first product
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.grid}>
              {/* Dashed add card */}
              <TouchableOpacity
                style={styles.addCard}
                onPress={() => setShowAddModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.addCardPlus}>
                  <Feather name="plus" size={28} color="#C4A882" />
                </View>
                <Text style={styles.addCardText}>New{"\n"}Product</Text>
              </TouchableOpacity>

              {allProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </View>
          )}
        </View>

        {/* ── Drinks Section ── */}
        {drinks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>☕ Drinks</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/drinks")}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.hGrid}>
                {drinks.map((p) => (
                  <ProductCard key={p.id} product={p} compact />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ── Snacks Section ── */}
        {snacks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>🍪 Snacks</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/snacks")}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.hGrid}>
                {snacks.map((p) => (
                  <ProductCard key={p.id} product={p} compact />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <AddProductModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDF6EC" },
  content: { paddingHorizontal: 20, paddingTop: 20 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  greetSmall: { fontSize: 13, color: "#8B6355", fontWeight: "500" },
  greetBig: {
    fontSize: 26,
    fontWeight: "800",
    color: "#3E1F0D",
    letterSpacing: -0.5,
    flexShrink: 1,
  },

  headerRight: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    flexShrink: 0,
  },

  // Shared icon button style (cart + logout)
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#3E1F0D",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  // Logout uses a lighter background to distinguish it from cart
  logoutBtn: {
    backgroundColor: "#FDECEA",
    borderWidth: 1.5,
    borderColor: "#F5C6C6",
    shadowColor: "#C0392B",
    shadowOpacity: 0.15,
  },

  cartBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#E74C3C",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#FDF6EC",
  },
  cartBadgeText: { fontSize: 10, fontWeight: "800", color: "#fff" },

  stats: { flexDirection: "row", gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF0E0",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
  },
  statVal: { fontSize: 18, fontWeight: "800", color: "#3E1F0D" },
  statLbl: {
    fontSize: 9,
    color: "#8B6355",
    fontWeight: "700",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  section: { marginBottom: 28 },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#3E1F0D" },
  seeAll: { fontSize: 13, color: "#8B4513", fontWeight: "600" },
  addProductBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#3E1F0D",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addProductText: { fontSize: 12, fontWeight: "700", color: "#FFF5E4" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  hGrid: { flexDirection: "row", gap: 12, paddingBottom: 4 },

  addCard: {
    width: "47.5%",
    borderRadius: 22,
    padding: 14,
    borderWidth: 2,
    borderColor: "#D2B48C",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 160,
  },
  addCardPlus: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#F5E6D3",
    alignItems: "center",
    justifyContent: "center",
  },
  addCardText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#C4A882",
    textAlign: "center",
  },

  emptyCard: {
    borderWidth: 2,
    borderColor: "#D2B48C",
    borderStyle: "dashed",
    borderRadius: 22,
    padding: 36,
    alignItems: "center",
    gap: 10,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#F5E6D3",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#8B6355" },
  emptyText: { fontSize: 13, color: "#C4A882" },
});
