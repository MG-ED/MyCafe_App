import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface SummaryPanelProps {
  customerOrders?: number;
  todayIncome?: number;
  onEndShift?: () => void;
}

export default function SummaryPanel({
  customerOrders = 0,
  todayIncome = 0,
  onEndShift,
}: SummaryPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <TouchableOpacity
        style={styles.collapsedBtn}
        onPress={() => setCollapsed(false)}
        activeOpacity={0.85}
      >
        <Text style={styles.collapsedEmoji}>📊</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.panel}>
      {/* Header */}
      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.panelTitle}>Today's Summary</Text>
          <View style={styles.liveDot}>
            <View style={styles.dot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setCollapsed(true)}
          style={styles.collapseBtn}
        >
          <Feather name="chevron-right" size={16} color="#8B6355" />
        </TouchableOpacity>
      </View>

      {/* Card 1 */}
      <View style={styles.card}>
        <View style={styles.cardIcon}>
          <Text style={styles.cardEmoji}>🛒</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardLabel}>Customer Orders</Text>
          <Text style={styles.cardValue}>{customerOrders}</Text>
        </View>
      </View>

      {/* Card 2 */}
      <View style={styles.card}>
        <View style={[styles.cardIcon, { backgroundColor: "#E8F5E9" }]}>
          <Text style={styles.cardEmoji}>💰</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardLabel}>Today's Income</Text>
          <Text style={[styles.cardValue, { color: "#2E7D32" }]}>
            ₱{todayIncome.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* End Shift */}
      <TouchableOpacity
        style={styles.endShiftBtn}
        onPress={onEndShift}
        activeOpacity={0.85}
      >
        <Feather name="log-out" size={14} color="#FFF5E4" />
        <Text style={styles.endShiftText}>End Shift</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Collapsed
  collapsedBtn: {
    position: "absolute",
    right: 16,
    top: 100,
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#3E1F0D",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 999,
  },
  collapsedEmoji: { fontSize: 22 },

  // Panel
  panel: {
    position: "absolute",
    right: 12,
    top: 90,
    width: 180,
    backgroundColor: "#FFF8F0",
    borderRadius: 24,
    padding: 14,
    gap: 10,
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 999,
    borderWidth: 1,
    borderColor: "#F0DEC8",
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  panelTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#3E1F0D",
    letterSpacing: 0.3,
  },
  liveDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
  },
  liveText: {
    fontSize: 10,
    color: "#4CAF50",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  collapseBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#F5E6D3",
    alignItems: "center",
    justifyContent: "center",
  },

  // Cards
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFF0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  cardEmoji: { fontSize: 18 },
  cardContent: { flex: 1 },
  cardLabel: {
    fontSize: 9,
    color: "#8B6355",
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#3E1F0D",
    marginTop: 1,
  },

  divider: {
    height: 1,
    backgroundColor: "#F0DEC8",
    marginVertical: 2,
  },

  // End Shift
  endShiftBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#C0392B",
    borderRadius: 12,
    paddingVertical: 10,
    shadowColor: "#C0392B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  endShiftText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFF5E4",
    letterSpacing: 0.3,
  },
});
