import React, { useEffect, useRef } from "react";
import { Animated, Easing, Modal, StyleSheet, Text, View } from "react-native";

// ─── Brand palette (mirrors SplashScreen) ─────────────────────────────────
const COLORS = {
  espresso: "#2C1A0E",
  caramel: "#C8793A",
  cream: "#FAF3E0",
  latte: "#D4A96A",
  overlay: "rgba(44,26,14,0.65)",
};

export type LoadingMessage =
  | "Brewing your experience…"
  | "Loading menu…"
  | "Preparing dashboard…"
  | "Processing your order…"
  | "Signing you in…"
  | "Creating your account…"
  | "Saving changes…"
  | "Fetching latest orders…";

interface LoadingOverlayProps {
  visible: boolean;
  message?: LoadingMessage | string;
}

export default function LoadingOverlay({
  visible,
  message = "Brewing your experience…",
}: LoadingOverlayProps) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const dotPulse = (dot: Animated.Value, delay: number) =>
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dot, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(600 - delay),
      ]),
    );

  useEffect(() => {
    if (!visible) return;
    const spinAnim = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spinAnim.start();
    dotPulse(dot1, 0).start();
    dotPulse(dot2, 200).start();
    dotPulse(dot3, 400).start();

    return () => {
      spinAnim.stop();
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
      onRequestClose={() => {
        /* intentionally non-dismissable loading overlay */
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Spinner */}
          <Animated.View
            style={[styles.spinner, { transform: [{ rotate: spin }] }]}
          />

          {/* Coffee icon */}
          <View style={styles.iconRow}>
            <Text style={styles.coffeeEmoji}>☕</Text>
          </View>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Bouncing dots */}
          <View style={styles.dots}>
            {[dot1, dot2, dot3].map((d, i) => (
              <Animated.View key={i} style={[styles.dot, { opacity: d }]} />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: COLORS.espresso,
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    minWidth: 200,
  },
  spinner: {
    position: "absolute",
    top: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "rgba(200,121,58,0.2)",
    borderTopColor: COLORS.caramel,
  },
  iconRow: {
    marginTop: 8,
    marginBottom: 12,
  },
  coffeeEmoji: {
    fontSize: 36,
  },
  message: {
    color: COLORS.cream,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    marginTop: 14,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.caramel,
  },
});
