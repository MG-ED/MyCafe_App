import { Product, useCafe } from "@/context/CafeContext";
import { Feather } from "@expo/vector-icons";
import { memo, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  product: Product;
  compact?: boolean;
}

const DEFAULT_SIZE = "Regular";

function ProductCardInner({ product, compact = false }: Props) {
  const {
    addToCart,
    updateCartQuantity,
    toggleFavorite,
    deleteProduct,
    favorites,
    cart,
    isNewProduct,
  } = useCafe();

  // BUG FIX: Track image load errors so we can fall back to the emoji when the
  // stored URL is broken (e.g. the image was deleted from Storage).
  const [imageError, setImageError] = useState(false);

  const isFav = favorites.has(product.id);

  // "New" badge only shows within the first 24 hours after creation
  const showNewBadge = isNewProduct(product);

  // Find if this product is already in cart
  const cartItem = cart.find(
    (i) => i.product.id === product.id && i.size === DEFAULT_SIZE,
  );
  const cartQty = cartItem?.quantity ?? 0;

  const handleAdd = () => addToCart(product, DEFAULT_SIZE);
  const handleIncrease = () => updateCartQuantity(product.id, DEFAULT_SIZE, 1);
  const handleDecrease = () => updateCartQuantity(product.id, DEFAULT_SIZE, -1);

  const handleDelete = () => {
    Alert.alert("Remove Product", `Remove "${product.name}" from your menu?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => deleteProduct(product.id),
      },
    ]);
  };

  // Show image only if we have a URI and it hasn't errored
  const showImage = !!product.imageUri && !imageError;

  // ── Compact card (horizontal scroll) ────────────────────────────────────
  if (compact) {
    return (
      <View style={[styles.compactCard, { backgroundColor: product.bg }]}>
        {/* "New" badge — only within 24 hours */}
        {showNewBadge && (
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>New</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.compactFavBtn}
          onPress={() => toggleFavorite(product.id)}
          activeOpacity={0.7}
        >
          <Feather
            name="heart"
            size={14}
            color={isFav ? "#E74C3C" : "#C4A882"}
            style={isFav ? { opacity: 1 } : { opacity: 0.7 }}
          />
        </TouchableOpacity>

        {showImage ? (
          <Image
            source={{ uri: product.imageUri }}
            style={styles.compactImage}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <Text style={styles.compactEmoji}>{product.emoji}</Text>
        )}

        <Text style={styles.compactName} numberOfLines={1}>
          {product.name}
        </Text>

        <View style={styles.compactPriceRow}>
          <Text style={styles.compactPrice}>₱{product.price}</Text>
          {cartQty > 0 ? (
            <View style={styles.miniStepper}>
              <TouchableOpacity
                style={styles.miniStepBtn}
                onPress={handleDecrease}
              >
                <Feather name="minus" size={11} color="#FFF5E4" />
              </TouchableOpacity>
              <Text style={styles.miniStepNum}>{cartQty}</Text>
              <TouchableOpacity
                style={styles.miniStepBtn}
                onPress={handleIncrease}
              >
                <Feather name="plus" size={11} color="#FFF5E4" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleAdd}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={14} color="#FFF5E4" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ── Full card (grid layout) ──────────────────────────────────────────────
  return (
    <View style={[styles.card, { backgroundColor: product.bg }]}>
      {/* Top row: "New" badge + actions */}
      <View style={styles.topRow}>
        {/* "New" badge — only within 24 hours */}
        {showNewBadge ? (
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>New</Text>
          </View>
        ) : (
          <View />
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => toggleFavorite(product.id)}
            activeOpacity={0.7}
          >
            <Feather
              name="heart"
              size={16}
              color={isFav ? "#E74C3C" : "#C4A882"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={15} color="#C0392B" />
          </TouchableOpacity>
        </View>
      </View>

      {showImage ? (
        <Image
          source={{ uri: product.imageUri }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <Text style={styles.emoji}>{product.emoji}</Text>
      )}

      <Text style={styles.name} numberOfLines={2}>
        {product.name}
      </Text>

      {/* Price + stepper / add button */}
      <View style={styles.priceRow}>
        <Text style={styles.price}>₱{product.price}</Text>

        {cartQty > 0 ? (
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepBtn} onPress={handleDecrease}>
              <Feather name="minus" size={13} color="#FFF5E4" />
            </TouchableOpacity>
            <Text style={styles.stepNum}>{cartQty}</Text>
            <TouchableOpacity style={styles.stepBtn} onPress={handleIncrease}>
              <Feather name="plus" size={13} color="#FFF5E4" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={handleAdd}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={16} color="#FFF5E4" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// BUG FIX: memo prevents ProductCard from re-rendering when unrelated context
// values change (e.g. syncPending flipping true→false, cafeName changing).
// Without this, adding a product to the cart caused ALL cards on the screen
// to re-render simultaneously.
export default memo(ProductCardInner);

const styles = StyleSheet.create({
  // ── Full card ──────────────────────────────────────────────────────────────
  card: {
    width: "47.5%",
    borderRadius: 22,
    padding: 12,
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  tagBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  actions: { flexDirection: "row", gap: 6 },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteBtn: { backgroundColor: "#FDECEA" },
  image: { width: "100%", height: 110, borderRadius: 14, marginBottom: 10 },
  emoji: { fontSize: 52, textAlign: "center", marginVertical: 6 },
  name: {
    fontSize: 14,
    fontWeight: "800",
    color: "#3E1F0D",
    marginBottom: 8,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: { fontSize: 16, fontWeight: "800", color: "#3E1F0D" },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#3E1F0D",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3E1F0D",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 5,
    gap: 6,
  },
  stepBtn: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFF5E4",
    minWidth: 18,
    textAlign: "center",
  },

  // ── Compact card ───────────────────────────────────────────────────────────
  compactCard: {
    width: 150,
    borderRadius: 20,
    padding: 10,
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  compactFavBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 1,
  },
  compactImage: {
    width: "100%",
    height: 90,
    borderRadius: 12,
    marginBottom: 8,
    marginTop: 4,
  },
  compactEmoji: { fontSize: 42, textAlign: "center", marginVertical: 4 },
  compactName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#3E1F0D",
    marginBottom: 6,
  },
  compactPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  compactPrice: { fontSize: 14, fontWeight: "800", color: "#3E1F0D" },
  miniStepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3E1F0D",
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 4,
  },
  miniStepBtn: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  miniStepNum: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFF5E4",
    minWidth: 14,
    textAlign: "center",
  },
});
