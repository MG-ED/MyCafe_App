import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Path,
  RadialGradient,
  Stop,
} from "react-native-svg";

const { width, height } = Dimensions.get("window");

// ── Brand palette ──────────────────────────────────────────────────────────
const C = {
  espresso: "#2C1A0E",
  espressoDark: "#1A0F08",
  espressoMid: "#3D2314",
  caramel: "#C8793A",
  caramelLight: "#E8924A",
  cream: "#FAF3E0",
  latte: "#D4A96A",
  steamDark: "rgba(255,255,255,0.08)",
  steam: "rgba(255,255,255,0.18)",
};

function BackgroundArt() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Base deep gradient */}
      <LinearGradient
        colors={[C.espressoDark, C.espresso, C.espressoMid, "#1E0E05"]}
        locations={[0, 0.3, 0.7, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Diagonal warm light ray top-left */}
      <View style={styles.bgRayTopLeft} />
      {/* Diagonal warm light ray bottom-right */}
      <View style={styles.bgRayBottomRight} />

      {/* SVG decorative layer */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="glow1" cx="30%" cy="20%" r="45%">
            <Stop offset="0" stopColor="#C8793A" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#2C1A0E" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="glow2" cx="80%" cy="75%" r="40%">
            <Stop offset="0" stopColor="#D4A96A" stopOpacity="0.14" />
            <Stop offset="1" stopColor="#2C1A0E" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Ambient glow blobs */}
        <Ellipse
          cx={width * 0.3}
          cy={height * 0.2}
          rx={width * 0.7}
          ry={height * 0.35}
          fill="url(#glow1)"
        />
        <Ellipse
          cx={width * 0.8}
          cy={height * 0.75}
          rx={width * 0.55}
          ry={height * 0.3}
          fill="url(#glow2)"
        />

        {/* Large decorative ring top */}
        <Circle
          cx={width * 0.5}
          cy={-height * 0.05}
          r={width * 0.72}
          stroke="rgba(200,121,58,0.09)"
          strokeWidth="1"
          fill="none"
        />
        <Circle
          cx={width * 0.5}
          cy={-height * 0.05}
          r={width * 0.58}
          stroke="rgba(200,121,58,0.07)"
          strokeWidth="0.8"
          fill="none"
        />

        {/* Large decorative ring bottom */}
        <Circle
          cx={width * 0.5}
          cy={height * 1.05}
          r={width * 0.72}
          stroke="rgba(212,169,106,0.08)"
          strokeWidth="1"
          fill="none"
        />
        <Circle
          cx={width * 0.5}
          cy={height * 1.05}
          r={width * 0.55}
          stroke="rgba(212,169,106,0.06)"
          strokeWidth="0.8"
          fill="none"
        />

        {/* Coffee bean shapes — top right cluster */}
        {/* Bean 1 */}
        <Ellipse
          cx={width * 0.82}
          cy={height * 0.11}
          rx="18"
          ry="11"
          fill="rgba(200,121,58,0.13)"
        />
        <Path
          d={`M${width * 0.82} ${height * 0.11 - 11} Q${width * 0.82 + 5} ${height * 0.11} ${width * 0.82} ${height * 0.11 + 11}`}
          stroke="rgba(200,121,58,0.25)"
          strokeWidth="1.2"
          fill="none"
        />
        {/* Bean 2 */}
        <Ellipse
          cx={width * 0.75}
          cy={height * 0.075}
          rx="13"
          ry="8"
          fill="rgba(200,121,58,0.1)"
          transform={`rotate(-20, ${width * 0.75}, ${height * 0.075})`}
        />

        {/* Coffee bean shapes — bottom left cluster */}
        {/* Bean 3 */}
        <Ellipse
          cx={width * 0.15}
          cy={height * 0.88}
          rx="20"
          ry="12"
          fill="rgba(212,169,106,0.11)"
          transform={`rotate(15, ${width * 0.15}, ${height * 0.88})`}
        />
        <Path
          d={`M${width * 0.15 - 20} ${height * 0.88} Q${width * 0.15} ${height * 0.88 - 6} ${width * 0.15 + 20} ${height * 0.88}`}
          stroke="rgba(212,169,106,0.2)"
          strokeWidth="1"
          fill="none"
        />
        {/* Bean 4 */}
        <Ellipse
          cx={width * 0.22}
          cy={height * 0.93}
          rx="14"
          ry="9"
          fill="rgba(212,169,106,0.08)"
          transform={`rotate(-10, ${width * 0.22}, ${height * 0.93})`}
        />

        {/* Steam wisps */}
        <Path
          d={`M${width * 0.38} ${height * 0.48} Q${width * 0.35} ${height * 0.43} ${width * 0.38} ${height * 0.38}`}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M${width * 0.43} ${height * 0.46} Q${width * 0.46} ${height * 0.41} ${width * 0.43} ${height * 0.36}`}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M${width * 0.48} ${height * 0.47} Q${width * 0.45} ${height * 0.42} ${width * 0.48} ${height * 0.37}`}
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
        />

        {/* Horizontal separator line with glow */}
        <Path
          d={`M${width * 0.05} ${height * 0.58} L${width * 0.95} ${height * 0.58}`}
          stroke="rgba(200,121,58,0.12)"
          strokeWidth="1"
          fill="none"
        />
      </Svg>

      {/* Noise texture overlay using tiny semi-transparent tiles */}
      <View style={styles.noiseOverlay} />

      {/* Bottom warm vignette */}
      <LinearGradient
        colors={["transparent", "rgba(26,15,8,0.6)"]}
        style={styles.bottomVignette}
      />
      {/* Top cool vignette */}
      <LinearGradient
        colors={["rgba(20,10,5,0.4)", "transparent"]}
        style={styles.topVignette}
      />
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <BackgroundArt />

      {/* ── Hero ── */}
      <View style={styles.hero}>
        <View style={styles.logoRing}>
          <Image
            source={require("../../assets/MyCafe_Logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.appName}>MyCafe</Text>
        <Text style={styles.tagline}>SMART CAFÉ MANAGEMENT</Text>
      </View>

      {/* ── CTA ── */}
      <View style={styles.cta}>
        <Text style={styles.ctaHeading}>Ready to brew?</Text>
        <Text style={styles.ctaSub}>Craft every cup, track every order.</Text>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push("/(auth)/login")}
          activeOpacity={0.85}
        >
          <Text style={styles.loginBtnText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signupBtn}
          onPress={() => router.push("/(auth)/signup")}
          activeOpacity={0.85}
        >
          <Text style={styles.signupBtnText}>Create Account</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>Your cafe, your way. ☕</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.espressoDark,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 64,
    paddingHorizontal: 28,
    overflow: "hidden",
  },

  // Background art layers
  bgRayTopLeft: {
    position: "absolute",
    width: width * 1.8,
    height: width * 1.8,
    borderRadius: width * 0.9,
    backgroundColor: "rgba(200,121,58,0.06)",
    top: -width * 0.7,
    left: -width * 0.6,
    transform: [{ rotate: "20deg" }],
  },
  bgRayBottomRight: {
    position: "absolute",
    width: width * 1.6,
    height: width * 1.6,
    borderRadius: width * 0.8,
    backgroundColor: "rgba(212,169,106,0.05)",
    bottom: -width * 0.6,
    right: -width * 0.5,
    transform: [{ rotate: "-15deg" }],
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.04)",
    opacity: 0.6,
  },
  bottomVignette: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
  },
  topVignette: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.25,
  },

  // Hero
  hero: { alignItems: "center", gap: 10 },
  logoRing: {
    width: 110,
    height: 110,
    borderRadius: 32,
    backgroundColor: "rgba(200,121,58,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(200,121,58,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoImage: { width: 90, height: 90 },
  appName: {
    fontSize: 44,
    fontWeight: "800",
    color: C.cream,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 11,
    fontWeight: "400",
    color: C.latte,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  pillsRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  pill: {
    backgroundColor: "rgba(200,121,58,0.15)",
    borderWidth: 1,
    borderColor: "rgba(200,121,58,0.3)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: { fontSize: 12, color: C.latte, fontWeight: "600" },

  // CTA block
  cta: { width: "100%", alignItems: "center", gap: 14 },
  ctaHeading: {
    fontSize: 22,
    fontWeight: "700",
    color: C.cream,
    letterSpacing: -0.3,
  },
  ctaSub: { fontSize: 13, color: C.latte, marginBottom: 4 },
  loginBtn: {
    width: "100%",
    backgroundColor: C.caramel,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: C.caramel,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  loginBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: C.cream,
    letterSpacing: 0.5,
  },
  signupBtn: {
    width: "100%",
    backgroundColor: "transparent",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(200,121,58,0.5)",
    paddingVertical: 16,
    alignItems: "center",
  },
  signupBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: C.latte,
    letterSpacing: 0.5,
  },
  footerText: { fontSize: 13, color: "rgba(212,169,106,0.5)", marginTop: 4 },
});
