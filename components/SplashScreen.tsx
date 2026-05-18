import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

// ─── Café brand palette ────────────────────────────────────────────────────
const COLORS = {
  espresso: "#2C1A0E",
  caramel: "#C8793A",
  cream: "#FAF3E0",
  latte: "#D4A96A",
  steam: "rgba(255,255,255,0.18)",
  steamDark: "rgba(255,255,255,0.08)",
};

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  // ── Animated values ────────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current; // whole screen fade-in
  const fadeOutAnim = useRef(new Animated.Value(1)).current; // whole screen fade-out
  const scaleAnim = useRef(new Animated.Value(0.7)).current; // logo zoom
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(new Animated.Value(0)).current; // spinner rotation
  const progressAnim = useRef(new Animated.Value(0)).current; // progress bar

  // Cup steam wiggles
  const steam1Y = useRef(new Animated.Value(0)).current;
  const steam1Op = useRef(new Animated.Value(0)).current;
  const steam2Y = useRef(new Animated.Value(0)).current;
  const steam2Op = useRef(new Animated.Value(0)).current;
  const steam3Y = useRef(new Animated.Value(0)).current;
  const steam3Op = useRef(new Animated.Value(0)).current;

  // ── Derived: spinner rotation 0→360 ───────────────────────────────────
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // ── Steam loop helper ──────────────────────────────────────────────────
  const steamLoop = (
    yVal: Animated.Value,
    opVal: Animated.Value,
    delay: number,
  ) =>
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(yVal, {
            toValue: -28,
            duration: 1200,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.sin),
          }),
          Animated.sequence([
            Animated.timing(opVal, {
              toValue: 0.85,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(opVal, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.parallel([
          Animated.timing(yVal, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opVal, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

  // ── Main animation sequence ────────────────────────────────────────────
  useEffect(() => {
    // 1. Screen fades in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // 2. Logo & title stagger in
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(100),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(80),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Spinner
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // 4. Progress bar fills over the FULL 3 s — matches exactly when we navigate
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();

    // 5. Steam wisps
    steamLoop(steam1Y, steam1Op, 0).start();
    steamLoop(steam2Y, steam2Op, 400).start();
    steamLoop(steam3Y, steam3Op, 800).start();

    // 6. After 3 s (bar = 100%): fade out → navigate
    const timer = setTimeout(() => {
      Animated.timing(fadeOutAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onFinish();
      });
    }, 3000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeOutAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.espresso} />

      {/* ── Decorative background circles ── */}
      <View style={[styles.bgCircle, styles.bgCircleLarge]} />
      <View style={[styles.bgCircle, styles.bgCircleSmall]} />

      {/* ── Logo area ── */}
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: logoOpacity,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Coffee cup SVG-style drawn in pure RN */}
        <View style={styles.cupContainer}>
          {/* Steam wisps */}
          {[
            { y: steam1Y, op: steam1Op, left: 18 },
            { y: steam2Y, op: steam2Op, left: 30 },
            { y: steam3Y, op: steam3Op, left: 42 },
          ].map((s, i) => (
            <Animated.View
              key={i}
              style={[
                styles.steamWisp,
                {
                  left: s.left,
                  opacity: s.op,
                  transform: [{ translateY: s.y }],
                },
              ]}
            />
          ))}

          {/* Cup body */}
          <View style={styles.cupBody}>
            <View style={styles.cupTop}>
              <View style={styles.coffeeLevel} />
            </View>
            <View style={styles.cupBottom} />
          </View>

          {/* Handle */}
          <View style={styles.cupHandle} />

          {/* Saucer */}
          <View style={styles.saucer} />
        </View>
      </Animated.View>

      {/* ── App name ── */}
      <Animated.Text style={[styles.appName, { opacity: titleOpacity }]}>
        MyCafe
      </Animated.Text>

      {/* ── Tagline ── */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Smart Café Management
      </Animated.Text>

      {/* ── Spinner + progress bar ── */}
      <Animated.View
        style={[styles.loaderSection, { opacity: taglineOpacity }]}
      >
        <Animated.View
          style={[styles.spinner, { transform: [{ rotate: spin }] }]}
        >
          <View style={styles.spinnerInner} />
        </Animated.View>

        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { width: progressWidth }]}
          />
        </View>

        <Text style={styles.loadingText}>Brewing your experience…</Text>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.espresso,
    alignItems: "center",
    justifyContent: "center",
    width,
    height,
  },

  // Background decorative circles
  bgCircle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: COLORS.steamDark,
  },
  bgCircleLarge: {
    width: width * 1.4,
    height: width * 1.4,
    top: -width * 0.5,
    left: -width * 0.2,
  },
  bgCircleSmall: {
    width: width * 0.8,
    height: width * 0.8,
    bottom: -width * 0.3,
    right: -width * 0.2,
  },

  // Cup
  logoWrapper: {
    marginBottom: 28,
    alignItems: "center",
  },
  cupContainer: {
    width: 72,
    height: 80,
    alignItems: "center",
    position: "relative",
  },
  steamWisp: {
    position: "absolute",
    top: -8,
    width: 4,
    height: 14,
    borderRadius: 4,
    backgroundColor: COLORS.steam,
  },
  cupBody: {
    width: 60,
    alignItems: "center",
    marginTop: 16,
  },
  cupTop: {
    width: 60,
    height: 40,
    backgroundColor: COLORS.caramel,
    borderRadius: 4,
    overflow: "hidden",
    justifyContent: "flex-start",
  },
  coffeeLevel: {
    width: "100%",
    height: 12,
    backgroundColor: "#5C3317",
  },
  cupBottom: {
    width: 48,
    height: 6,
    backgroundColor: COLORS.caramel,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  cupHandle: {
    position: "absolute",
    right: 2,
    top: 26,
    width: 18,
    height: 22,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: COLORS.latte,
    backgroundColor: "transparent",
  },
  saucer: {
    width: 68,
    height: 8,
    backgroundColor: COLORS.latte,
    borderRadius: 4,
    marginTop: 2,
  },

  // Text
  appName: {
    fontSize: 42,
    fontWeight: "800",
    color: COLORS.cream,
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    fontWeight: "400",
    color: COLORS.latte,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 48,
  },

  // Loader
  loaderSection: {
    alignItems: "center",
    gap: 14,
  },
  spinner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: COLORS.steamDark,
    borderTopColor: COLORS.caramel,
  },
  spinnerInner: {
    // just a placeholder for the border-only spinner
  },
  progressTrack: {
    width: 200,
    height: 5,
    backgroundColor: COLORS.steamDark,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.caramel,
    borderRadius: 3,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.latte,
    letterSpacing: 1,
    opacity: 0.8,
  },
});
