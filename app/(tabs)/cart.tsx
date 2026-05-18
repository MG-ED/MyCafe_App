import { useCafe } from "@/context/CafeContext";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CartScreen() {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartCount,
    cartTotal,
    placeOrder,
  } = useCafe();
  const insets = useSafeAreaInsets();
  const [showModal, setShowModal] = useState(false);
  const [customerName, setCustomerName] = useState("");

  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      Alert.alert("Empty Cart", "Add items before placing an order.");
      return;
    }
    setShowModal(true);
  };

  const handleConfirmOrder = () => {
    if (!customerName.trim()) {
      Alert.alert("Name Required", "Please enter the customer's name.");
      return;
    }
    placeOrder(customerName.trim());
    setCustomerName("");
    setShowModal(false);
    Alert.alert("✅ Order Placed!", "Order has been sent to kitchen.");
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛒 Cart</Text>
        {cart.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() =>
              Alert.alert("Clear Cart", "Remove all items?", [
                { text: "Cancel", style: "cancel" },
                { text: "Clear", style: "destructive", onPress: clearCart },
              ])
            }
          >
            <Feather name="trash-2" size={15} color="#C0392B" />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {cart.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add drinks or snacks from the menu
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {/* Cart Items */}
          {cart.map((item) => (
            <View
              key={`${item.product.id}-${item.size}`}
              style={[styles.cartItem, { backgroundColor: item.product.bg }]}
            >
              <Text style={styles.itemEmoji}>{item.product.emoji}</Text>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product.name}</Text>
                <Text style={styles.itemSize}>Size: {item.size}</Text>
                <Text style={styles.itemPrice}>
                  ₱{(item.product.price * item.quantity).toLocaleString()}
                </Text>
              </View>
              <View style={styles.qtyControls}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() =>
                    updateCartQuantity(item.product.id, item.size, -1)
                  }
                >
                  <Feather name="minus" size={14} color="#FFF5E4" />
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() =>
                    updateCartQuantity(item.product.id, item.size, 1)
                  }
                >
                  <Feather name="plus" size={14} color="#FFF5E4" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeFromCart(item.product.id, item.size)}
              >
                <Feather name="x" size={16} color="#C0392B" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Order Summary Card — inline, no dark overlay */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryDivider} />

            {cart.map((item) => (
              <View
                key={`summary-${item.product.id}-${item.size}`}
                style={styles.summaryRow}
              >
                <Text style={styles.summaryItemName} numberOfLines={1}>
                  {item.product.emoji} {item.product.name}
                  <Text style={styles.summaryItemQty}> ×{item.quantity}</Text>
                </Text>
                <Text style={styles.summaryItemPrice}>
                  ₱{(item.product.price * item.quantity).toLocaleString()}
                </Text>
              </View>
            ))}

            <View style={styles.summaryTotalRow}>
              <View>
                <Text style={styles.summaryTotalLabel}>
                  {cartCount} item{cartCount !== 1 ? "s" : ""}
                </Text>
                <Text style={styles.summaryTotal}>
                  ₱{cartTotal.toLocaleString()}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.orderBtn}
              onPress={handlePlaceOrder}
              activeOpacity={0.85}
            >
              <Feather name="shopping-bag" size={18} color="#FFF5E4" />
              <Text style={styles.orderBtnText}>Place Order</Text>
              <Feather name="arrow-right" size={18} color="#FFF5E4" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Customer Name Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>🧾</Text>
            <Text style={styles.modalTitle}>Customer Name</Text>
            <Text style={styles.modalSubtitle}>
              Enter the name for this order
            </Text>

            <View style={styles.orderPreview}>
              {cart.map((item) => (
                <View
                  key={`${item.product.id}-${item.size}`}
                  style={styles.previewRow}
                >
                  <Text style={styles.previewEmoji}>{item.product.emoji}</Text>
                  <Text style={styles.previewName} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.previewQty}>×{item.quantity}</Text>
                  <Text style={styles.previewPrice}>
                    ₱{(item.product.price * item.quantity).toLocaleString()}
                  </Text>
                </View>
              ))}
              <View style={styles.previewTotal}>
                <Text style={styles.previewTotalLabel}>Total</Text>
                <Text style={styles.previewTotalVal}>
                  ₱{cartTotal.toLocaleString()}
                </Text>
              </View>
            </View>

            <TextInput
              style={styles.nameInput}
              placeholder="e.g. Maria Santos"
              placeholderTextColor="#C4A882"
              value={customerName}
              onChangeText={setCustomerName}
              autoFocus
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmOrder}
                activeOpacity={0.85}
              >
                <Feather name="check" size={16} color="#FFF5E4" />
                <Text style={styles.confirmText}>Confirm Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDF6EC" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#3E1F0D" },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FDECEA",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  clearText: { fontSize: 13, fontWeight: "700", color: "#C0392B" },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 80,
  },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#3E1F0D" },
  emptySubtitle: { fontSize: 14, color: "#8B6355" },

  list: {
    paddingHorizontal: 20,
    gap: 12,
    paddingTop: 4,
    paddingBottom: 28,
  },

  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 14,
    gap: 10,
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  itemEmoji: { fontSize: 36 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "700", color: "#3E1F0D" },
  itemSize: { fontSize: 11, color: "#8B6355", marginTop: 2 },
  itemPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: "#3E1F0D",
    marginTop: 4,
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#3E1F0D",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  qtyBtn: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyNum: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFF5E4",
    minWidth: 20,
    textAlign: "center",
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FDECEA",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Summary Card ────────────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: "#FFF8F0",
    borderRadius: 24,
    padding: 20,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#F0DEC8",
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#3E1F0D",
    marginBottom: 12,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#F0DEC8",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryItemName: {
    flex: 1,
    fontSize: 13,
    color: "#3E1F0D",
    fontWeight: "600",
    marginRight: 8,
  },
  summaryItemQty: {
    fontSize: 12,
    color: "#8B6355",
    fontWeight: "400",
  },
  summaryItemPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3E1F0D",
  },
  summaryTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#F0DEC8",
    marginTop: 8,
    paddingTop: 14,
    marginBottom: 16,
  },
  summaryTotalLabel: {
    fontSize: 12,
    color: "#8B6355",
    fontWeight: "600",
    marginBottom: 2,
  },
  summaryTotal: {
    fontSize: 28,
    fontWeight: "800",
    color: "#3E1F0D",
  },
  orderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#3E1F0D",
    borderRadius: 18,
    paddingVertical: 16,
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  orderBtnText: { fontSize: 16, fontWeight: "800", color: "#FFF5E4" },

  // ── Modal ───────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: "#FDF6EC",
    borderRadius: 28,
    padding: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  modalEmoji: { fontSize: 40, textAlign: "center", marginBottom: 8 },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#3E1F0D",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#8B6355",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  orderPreview: {
    backgroundColor: "#FFF8F0",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#F0DEC8",
  },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  previewEmoji: { fontSize: 18, width: 26 },
  previewName: { flex: 1, fontSize: 13, color: "#3E1F0D", fontWeight: "600" },
  previewQty: { fontSize: 12, color: "#8B6355", width: 30 },
  previewPrice: { fontSize: 13, fontWeight: "700", color: "#3E1F0D" },
  previewTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F0DEC8",
    paddingTop: 8,
    marginTop: 4,
  },
  previewTotalLabel: { fontSize: 13, fontWeight: "700", color: "#8B6355" },
  previewTotalVal: { fontSize: 16, fontWeight: "800", color: "#3E1F0D" },
  nameInput: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#3E1F0D",
    fontWeight: "500",
    borderWidth: 1.5,
    borderColor: "#F0DEC8",
    marginBottom: 16,
  },
  modalBtns: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#F5E6D3",
  },
  cancelText: { fontSize: 14, fontWeight: "700", color: "#8B6355" },
  confirmBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#3E1F0D",
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmText: { fontSize: 14, fontWeight: "800", color: "#FFF5E4" },
});
