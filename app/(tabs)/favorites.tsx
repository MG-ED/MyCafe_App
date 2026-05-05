import ProductCard from "@/components/ProductCard";
import { useCafe } from "@/context/CafeContext";
import { Feather } from "@expo/vector-icons";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function FavoritesScreen() {
  const { products, favorites, toggleFavorite } = useCafe();

  const favProducts = products.filter((p) => favorites.has(p.id));
  const drinks = favProducts.filter((p) => p.category === "drinks");
  const snacks = favProducts.filter((p) => p.category === "snacks");

  const clearAll = () => {
    Alert.alert("Clear Favorites", "Remove all favorites?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => favProducts.forEach((p) => toggleFavorite(p.id)),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.pageEmoji}>❤️</Text>
            <View>
              <Text style={styles.pageTitle}>Favorites</Text>
              <Text style={styles.pageSubtitle}>
                {favProducts.length} item{favProducts.length !== 1 ? "s" : ""}{" "}
                saved
              </Text>
            </View>
          </View>
          {favProducts.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
              <Feather name="trash-2" size={14} color="#C0392B" />
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hint */}
        <View style={styles.hint}>
          <Text style={styles.hintEmoji}>💡</Text>
          <Text style={styles.hintText}>
            Tap ❤️ on any product card to save it here
          </Text>
        </View>

        {favProducts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🤍</Text>
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubtitle}>
              Browse drinks and snacks and heart your favorites
            </Text>
          </View>
        ) : (
          <>
            {drinks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>☕ Drinks</Text>
                <View style={styles.grid}>
                  {drinks.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </View>
              </View>
            )}
            {snacks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🍪 Snacks</Text>
                <View style={styles.grid}>
                  {snacks.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDF6EC" },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  pageEmoji: { fontSize: 36 },
  pageTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#3E1F0D",
    letterSpacing: -0.5,
  },
  pageSubtitle: { fontSize: 13, color: "#8B6355", marginTop: 2 },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FDECEA",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearText: { fontSize: 13, fontWeight: "700", color: "#C0392B" },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF8F0",
    borderRadius: 16,
    padding: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#F0DEC8",
  },
  hintEmoji: { fontSize: 18 },
  hintText: { flex: 1, fontSize: 13, color: "#8B6355", lineHeight: 18 },
  empty: { alignItems: "center", gap: 12, paddingVertical: 60 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#8B6355" },
  emptySubtitle: { fontSize: 14, color: "#C4A882", textAlign: "center" },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#3E1F0D",
    marginBottom: 14,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
});
