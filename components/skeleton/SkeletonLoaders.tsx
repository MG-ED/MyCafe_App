import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, ViewStyle } from 'react-native';

const { width } = Dimensions.get('window');

// ─── Brand palette ─────────────────────────────────────────────────────────
const C = {
  base:     '#EDE0D0',  
  shine:    '#FAF3E0',  
  bg:       '#FAF3E0',  
  espresso: '#2C1A0E',
};

// ─── Core shimmer hook ─────────────────────────────────────────────────────
function useShimmer(duration = 1200) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1, duration, useNativeDriver: true, isInteraction: false,
        }),
        Animated.timing(shimmer, {
          toValue: 0, duration, useNativeDriver: true, isInteraction: false,
        }),
      ])
    ).start();
    return () => shimmer.stopAnimation();
  }, [shimmer, duration]);

  return shimmer;
}

// ─── Generic shimmer block ─────────────────────────────────────────────────
interface ShimmerBoxProps {
  style?: ViewStyle;
  duration?: number;
}

function ShimmerBox({ style, duration }: ShimmerBoxProps) {
  const shimmer = useShimmer(duration);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <View style={[styles.shimmerContainer, style]}>
      <Animated.View
        style={[
          styles.shimmerHighlight,
          { opacity, transform: [{ translateX }] },
        ]}
      />
    </View>
  );
}

// ─── 1. Product Card Skeleton ──────────────────────────────────────────────
function ProductCardSkeleton() {
  return (
    <View style={styles.productCard}>
      {/* Image placeholder */}
      <ShimmerBox style={styles.productImage} />
      {/* Name line */}
      <ShimmerBox style={styles.productName} />
      {/* Short description */}
      <ShimmerBox style={styles.productDesc} />
      {/* Price + button row */}
      <View style={styles.productRow}>
        <ShimmerBox style={styles.productPrice} />
        <ShimmerBox style={styles.productBtn} />
      </View>
    </View>
  );
}

interface ProductCardSkeletonListProps { count?: number }
export function ProductCardSkeletonList({ count = 4 }: ProductCardSkeletonListProps) {
  return (
    <View style={styles.productGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </View>
  );
}

// ─── 2. Order Row Skeleton ─────────────────────────────────────────────────
function OrderRowSkeleton() {
  return (
    <View style={styles.orderRow}>
      <ShimmerBox style={styles.orderIcon} />
      <View style={styles.orderContent}>
        <ShimmerBox style={styles.orderTitle} />
        <ShimmerBox style={styles.orderSub} />
      </View>
      <ShimmerBox style={styles.orderBadge} />
    </View>
  );
}

interface OrderRowSkeletonListProps { count?: number }
export function OrderRowSkeletonList({ count = 5 }: OrderRowSkeletonListProps) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <OrderRowSkeleton key={i} />
      ))}
    </View>
  );
}

// ─── 3. Dashboard / KPI Card Skeleton ─────────────────────────────────────
function DashboardCardSkeleton() {
  return (
    <View style={styles.dashCard}>
      <ShimmerBox style={styles.dashIcon} />
      <ShimmerBox style={styles.dashValue} />
      <ShimmerBox style={styles.dashLabel} />
    </View>
  );
}

export function DashboardSkeleton() {
  return (
    <View>
      {/* Stats row */}
      <View style={styles.dashGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <DashboardCardSkeleton key={i} />
        ))}
      </View>
      {/* Chart placeholder */}
      <ShimmerBox style={styles.chartBlock} />
      {/* Recent orders */}
      <OrderRowSkeletonList count={3} />
    </View>
  );
}

// ─── 4. Profile Card Skeleton ──────────────────────────────────────────────
export function ProfileCardSkeleton() {
  return (
    <View style={styles.profileCard}>
      <ShimmerBox style={styles.avatar} />
      <View style={styles.profileText}>
        <ShimmerBox style={styles.profileName} />
        <ShimmerBox style={styles.profileEmail} />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  shimmerContainer: {
    backgroundColor: C.base,
    borderRadius: 8,
    overflow: 'hidden',
  },
  shimmerHighlight: {
    position: 'absolute',
    top: 0, bottom: 0,
    left: 0,
    width: 80,
    backgroundColor: C.shine,
    opacity: 0.6,
  },

  // Product
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
  },
  productCard: {
    width: (width - 44) / 2,
    backgroundColor: C.bg,
    borderRadius: 16,
    padding: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  productImage: { width: '100%', height: 110, borderRadius: 12 },
  productName:  { width: '80%', height: 14, borderRadius: 6 },
  productDesc:  { width: '60%', height: 11, borderRadius: 6 },
  productRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { width: 48, height: 18, borderRadius: 6 },
  productBtn:   { width: 36, height: 28, borderRadius: 8 },

  // Order
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200,121,58,0.1)',
  },
  orderIcon:    { width: 44, height: 44, borderRadius: 12 },
  orderContent: { flex: 1, gap: 6 },
  orderTitle:   { height: 14, borderRadius: 6, width: '70%' },
  orderSub:     { height: 11, borderRadius: 6, width: '50%' },
  orderBadge:   { width: 60, height: 24, borderRadius: 12 },

  // Dashboard
  dashGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dashCard: {
    width: (width - 44) / 2,
    backgroundColor: C.bg,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  dashIcon:  { width: 36, height: 36, borderRadius: 10 },
  dashValue: { width: '60%', height: 24, borderRadius: 8 },
  dashLabel: { width: '80%', height: 12, borderRadius: 6 },

  chartBlock: {
    marginHorizontal: 16,
    height: 180,
    borderRadius: 16,
    marginBottom: 16,
  },

  // Profile
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  avatar:       { width: 64, height: 64, borderRadius: 32 },
  profileText:  { flex: 1, gap: 8 },
  profileName:  { height: 16, borderRadius: 6, width: '55%' },
  profileEmail: { height: 12, borderRadius: 6, width: '75%' },
});
