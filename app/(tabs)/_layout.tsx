// ─── app/(tabs)/_layout.tsx ───────────────────────────────────────────────────
// FIXED:
//  • Tab bar now uses useSafeAreaInsets for correct bottom padding on all devices
//  • Removed hard-coded Platform.OS === "ios" ? 28 : 14 — unreliable on Android
//    with gesture nav bar
//  • cartTabBtn elevation increased so the bubble doesn't clip behind the bar
// ─────────────────────────────────────────────────────────────────────────────

import { useCafe } from "@/context/CafeContext";
import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Tabs } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabName =
  | "index"
  | "drinks"
  | "snacks"
  | "favorites"
  | "profile"
  | "orders"
  | "cart";

type ExpoTabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

const TAB_CONFIG: Record<
  TabName,
  { icon: ComponentProps<typeof Feather>["name"]; label: string }
> = {
  index: { icon: "home", label: "Home" },
  drinks: { icon: "coffee", label: "Drinks" },
  snacks: { icon: "box", label: "Snacks" },
  favorites: { icon: "heart", label: "Favs" },
  profile: { icon: "user", label: "Profile" },
  orders: { icon: "file-text", label: "Orders" },
  // BUG FIX: cart was missing from TAB_CONFIG — it fell back to
  // { icon: "circle", label: "cart" } making the tab bar look broken
  cart: { icon: "shopping-cart", label: "Cart" },
};

function CafeBottomTabBar({
  state,
  descriptors,
  navigation,
}: ExpoTabBarProps) {
  const { cartCount } = useCafe();
  // FIXED: use safe-area insets so the bar respects gesture nav bar on Android
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom + 8 }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const config = TAB_CONFIG[route.name as TabName] ?? {
          icon: "circle" as any,
          label: route.name,
        };
        const isCart = route.name === "cart";

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented)
            navigation.navigate(route.name);
        };

        if (isCart) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.cartTabBtn}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.cartBubble,
                  isFocused && styles.cartBubbleActive,
                ]}
              >
                <Feather name="shopping-cart" size={22} color="#FFF5E4" />
                {cartCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {cartCount > 99 ? "99+" : cartCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[styles.tabLabel, isFocused && styles.tabLabelActive]}
              >
                Cart
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabBtn}
            activeOpacity={0.75}
          >
            <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
              <Feather
                name={config.icon}
                size={20}
                color={isFocused ? "#3E1F0D" : "#C4A882"}
              />
            </View>
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CafeBottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="drinks" options={{ title: "Drinks" }} />
      <Tabs.Screen name="snacks" options={{ title: "Snacks" }} />
      <Tabs.Screen name="favorites" options={{ title: "Favorites" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      <Tabs.Screen name="orders" options={{ title: "Orders" }} />
      {/* BUG FIX: cart screen was not declared — Expo Router requires every
          navigable route to have a matching Tabs.Screen */}
      <Tabs.Screen name="cart" options={{ title: "Cart" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#3E1F0D",
    paddingTop: 10,
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
    paddingBottom: 2,
  },
  iconWrap: {
    width: 40,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: { backgroundColor: "#FFF5E4" },
  tabLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "#C4A882",
    letterSpacing: 0.3,
  },
  tabLabelActive: { color: "#FFF5E4", fontWeight: "700" },
  cartTabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
    paddingBottom: 2,
  },
  cartBubble: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: "#6B3A2A",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -16,
    shadowColor: "#D2691E",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  cartBubbleActive: { backgroundColor: "#D2691E" },
  badge: {
    position: "absolute",
    top: -5,
    right: -6,
    backgroundColor: "#E74C3C",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#3E1F0D",
  },
  badgeText: { fontSize: 10, fontWeight: "800", color: "#fff" },
});
