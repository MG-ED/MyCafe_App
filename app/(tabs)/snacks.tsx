import AddProductModal from "@/components/AddProductModal";
import ProductCard from "@/components/ProductCard";
import { useCafe } from "@/context/CafeContext";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const CATEGORIES = ["All", "Cake", "Sandwich", "Cookies"];

export default function SnacksScreen() {
  const { products } = useCafe();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("All");

  const snacks = products
    .filter((p) => p.category === "snacks")
    .sort((a, b) => b.createdAt - a.createdAt);

  const filtered =
    filter === "All"
      ? snacks
      : snacks.filter(
          (s) =>
            (s.tag ?? "").toLowerCase().includes(filter.toLowerCase()) ||
            s.name.toLowerCase().includes(filter.toLowerCase()),
        );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageEmoji}>🍪</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Snacks Menu</Text>
            <Text style={styles.pageSubtitle}>
              {snacks.length} items available
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAdd(true)}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={16} color="#FFF5E4" />
            <Text style={styles.addBtnText}>Add Snack</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chips}
        >
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, filter === c && styles.chipActive]}
              onPress={() => setFilter(c)}
            >
              <Text
                style={[styles.chipText, filter === c && styles.chipTextActive]}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyCard}
            onPress={() => setShowAdd(true)}
          >
            <View style={styles.emptyIcon}>
              <Feather name="plus" size={28} color="#C4A882" />
            </View>
            <Text style={styles.emptyTitle}>No snacks yet</Text>
            <Text style={styles.emptyText}>Tap to add your first snack</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.grid}>
            <TouchableOpacity
              style={styles.addCard}
              onPress={() => setShowAdd(true)}
              activeOpacity={0.8}
            >
              <View style={styles.addCardPlus}>
                <Feather name="plus" size={26} color="#C4A882" />
              </View>
              <Text style={styles.addCardText}>New{"\n"}Snack</Text>
            </TouchableOpacity>
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <AddProductModal
        visible={showAdd}
        defaultCategory="snacks"
        onClose={() => setShowAdd(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDF6EC" },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  pageEmoji: { fontSize: 40 },
  pageTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#3E1F0D",
    letterSpacing: -0.5,
  },
  pageSubtitle: { fontSize: 13, color: "#8B6355", marginTop: 2 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#3E1F0D",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addBtnText: { fontSize: 13, fontWeight: "700", color: "#FFF5E4" },
  chips: { marginBottom: 20 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 100,
    backgroundColor: "#F5E6D3",
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#3E1F0D" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#8B6355" },
  chipTextActive: { color: "#FFF5E4" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  addCard: {
    width: "47.5%",
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#D2B48C",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 160,
    padding: 14,
  },
  addCardPlus: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F5E6D3",
    alignItems: "center",
    justifyContent: "center",
  },
  addCardText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#C4A882",
    textAlign: "center",
  },
  emptyCard: {
    borderWidth: 2,
    borderColor: "#D2B48C",
    borderStyle: "dashed",
    borderRadius: 22,
    padding: 48,
    alignItems: "center",
    gap: 12,
  },
  emptyIcon: {
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
