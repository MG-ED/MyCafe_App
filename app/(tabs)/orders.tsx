// ─── app/(tabs)/orders.tsx ────────────────────────────────────────────────────
// ADDED: "End Shift" button — confirms then calls endShift() which deletes
//        all orders from Firestore. Products are completely untouched.
// FIXED: SafeAreaView → View + useSafeAreaInsets
// ─────────────────────────────────────────────────────────────────────────────

import { OrderStatus, useCafe } from "@/context/CafeContext";
import { Feather } from "@expo/vector-icons";
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

const STATUS_COLORS: Record<
  OrderStatus,
  { bg: string; text: string; dot: string }
> = {
  Pending: { bg: "#FFF3CD", text: "#856404", dot: "#F0AD4E" },
  Preparing: { bg: "#CCE5FF", text: "#004085", dot: "#007BFF" },
  Ready: { bg: "#D4EDDA", text: "#155724", dot: "#28A745" },
  Done: { bg: "#F5E6D3", text: "#5C3317", dot: "#8B6355" },
};

const STATUSES: OrderStatus[] = ["Pending", "Preparing", "Ready", "Done"];

export default function OrdersScreen() {
  const { orders, updateOrderStatus, endShift } = useCafe();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<OrderStatus | "All">("All");
  const [ending, setEnding] = useState(false);

  const filtered =
    filter === "All" ? orders : orders.filter((o) => o.status === filter);

  const activeCount = orders.filter((o) => o.status !== "Done").length;
  const collected = orders
    .filter((o) => o.status === "Done")
    .reduce((sum, o) => sum + o.total, 0);

  const handleEndShift = () => {
    if (orders.length === 0) {
      Alert.alert("No Orders", "There are no orders to clear.");
      return;
    }
    Alert.alert(
      "⚠️ End Shift",
      `This will permanently delete all ${orders.length} order${orders.length !== 1 ? "s" : ""}.\n\nYour products will NOT be affected.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Shift",
          style: "destructive",
          onPress: async () => {
            setEnding(true);
            try {
              await endShift();
              Alert.alert(
                "✅ Shift Ended",
                "All orders have been cleared. Ready for the next shift!",
              );
            } catch {
              Alert.alert("Error", "Could not end shift. Please try again.");
            } finally {
              setEnding(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderLeft}>
            <Text style={styles.pageEmoji}>🧾</Text>
            <View>
              <Text style={styles.pageTitle}>Orders</Text>
              <Text style={styles.pageSubtitle}>
                {activeCount} active order{activeCount !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          {/* END SHIFT BUTTON */}
          <TouchableOpacity
            style={[styles.endShiftBtn, ending && styles.endShiftBtnDisabled]}
            onPress={handleEndShift}
            activeOpacity={0.8}
            disabled={ending}
          >
            <Feather name="moon" size={14} color="#FFF5E4" />
            <Text style={styles.endShiftText}>
              {ending ? "Clearing..." : "End Shift"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Strip */}
        <View style={styles.strip}>
          <View style={styles.stripItem}>
            <Text style={styles.stripVal}>{orders.length}</Text>
            <Text style={styles.stripLbl}>TOTAL</Text>
          </View>
          <View style={styles.stripDivider} />
          <View style={styles.stripItem}>
            <Text style={[styles.stripVal, { color: "#E67E22" }]}>
              {activeCount}
            </Text>
            <Text style={styles.stripLbl}>ACTIVE</Text>
          </View>
          <View style={styles.stripDivider} />
          <View style={styles.stripItem}>
            <Text style={[styles.stripVal, { color: "#27AE60", fontSize: 15 }]}>
              ₱{collected.toLocaleString()}
            </Text>
            <Text style={styles.stripLbl}>COLLECTED</Text>
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chips}
        >
          {(["All", ...STATUSES] as (OrderStatus | "All")[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, filter === s && styles.chipActive]}
              onPress={() => setFilter(s)}
            >
              <Text
                style={[styles.chipText, filter === s && styles.chipTextActive]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Empty state */}
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubtitle}>
              Orders will appear here after placement
            </Text>
          </View>
        )}

        {/* Order Cards */}
        <View style={styles.list}>
          {filtered.map((order) => {
            const sc = STATUS_COLORS[order.status] ?? STATUS_COLORS["Pending"];
            return (
              <View key={order.id} style={styles.card}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.orderIdRow}>
                    <View>
                      <Text style={styles.orderNum}>
                        Order #{order.orderNumber ?? "—"}
                      </Text>
                      <Text style={styles.customerName}>
                        👤 {order.customerName}
                      </Text>
                    </View>
                    <View
                      style={[styles.statusPill, { backgroundColor: sc.bg }]}
                    >
                      <View
                        style={[styles.statusDot, { backgroundColor: sc.dot }]}
                      />
                      <Text style={[styles.statusText, { color: sc.text }]}>
                        {order.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.metaRow}>
                    {order.time ? (
                      <View style={styles.metaChip}>
                        <Feather name="clock" size={11} color="#8B6355" />
                        <Text style={styles.metaText}>{order.time}</Text>
                      </View>
                    ) : null}
                    <View style={styles.metaChip}>
                      <Feather name="hash" size={11} color="#8B6355" />
                      <Text style={styles.metaText}>
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Items */}
                <View style={styles.itemList}>
                  {order.items.map((item, idx) => (
                    <View key={idx} style={styles.orderItem}>
                      <Text style={styles.itemEmoji}>{item.product.emoji}</Text>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.product.name}
                      </Text>
                      <Text style={styles.itemSize}>{item.size}</Text>
                      <Text style={styles.itemQty}>×{item.quantity}</Text>
                      <Text style={styles.itemPrice}>
                        ₱{(item.quantity * item.product.price).toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Footer */}
                <View style={styles.cardFooter}>
                  <Text style={styles.totalLabel}>
                    Total:{" "}
                    <Text style={styles.totalVal}>
                      ₱{order.total.toLocaleString()}
                    </Text>
                  </Text>
                  {order.status !== "Done" && (
                    <TouchableOpacity
                      style={styles.nextBtn}
                      onPress={() => {
                        const idx = STATUSES.indexOf(order.status);
                        if (idx < STATUSES.length - 1)
                          updateOrderStatus(order.id, STATUSES[idx + 1]);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.nextBtnText}>
                        {order.status === "Pending"
                          ? "Start Prep"
                          : order.status === "Preparing"
                            ? "Mark Ready"
                            : "Complete"}
                      </Text>
                      <Feather name="chevron-right" size={14} color="#FFF5E4" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDF6EC" },
  content: { paddingHorizontal: 20, paddingTop: 20 },

  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  pageHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pageEmoji: { fontSize: 40 },
  pageTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#3E1F0D",
    letterSpacing: -0.5,
  },
  pageSubtitle: { fontSize: 13, color: "#8B6355", marginTop: 2 },

  // End Shift button
  endShiftBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#C0392B",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#C0392B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  endShiftBtnDisabled: { opacity: 0.5 },
  endShiftText: { fontSize: 13, fontWeight: "800", color: "#FFF5E4" },

  strip: {
    flexDirection: "row",
    backgroundColor: "#3E1F0D",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "space-around",
  },
  stripItem: { alignItems: "center", gap: 2 },
  stripVal: { fontSize: 22, fontWeight: "800", color: "#FFF5E4" },
  stripLbl: {
    fontSize: 10,
    color: "#C4A882",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  stripDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,245,228,0.15)",
  },

  chips: { marginBottom: 16 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: "#F5E6D3",
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#3E1F0D" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#8B6355" },
  chipTextActive: { color: "#FFF5E4" },

  empty: { alignItems: "center", gap: 8, paddingVertical: 48 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#8B6355" },
  emptySubtitle: { fontSize: 13, color: "#C4A882" },

  list: { gap: 14 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F0DEC8",
  },
  cardHeader: { backgroundColor: "#FFF8F0", padding: 14, gap: 8 },
  orderIdRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  orderNum: { fontSize: 15, fontWeight: "800", color: "#3E1F0D" },
  customerName: {
    fontSize: 12,
    color: "#8B6355",
    marginTop: 2,
    fontWeight: "600",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: "700" },
  metaRow: { flexDirection: "row", gap: 12 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: "#8B6355", fontWeight: "500" },

  itemList: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  orderItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  itemEmoji: { fontSize: 18, width: 26 },
  itemName: { flex: 1, fontSize: 13, color: "#3E1F0D", fontWeight: "600" },
  itemSize: { fontSize: 11, color: "#8B6355", width: 20 },
  itemQty: { fontSize: 13, color: "#8B6355", fontWeight: "500", width: 28 },
  itemPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3E1F0D",
    width: 56,
    textAlign: "right",
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0DEC8",
    backgroundColor: "#FDFAF6",
  },
  totalLabel: { fontSize: 13, color: "#8B6355", fontWeight: "500" },
  totalVal: { fontWeight: "800", color: "#3E1F0D", fontSize: 15 },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#3E1F0D",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  nextBtnText: { fontSize: 12, fontWeight: "700", color: "#FFF5E4" },
});
