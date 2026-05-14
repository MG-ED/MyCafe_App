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
  RadialGradient,
  Stop,
} from "react-native-svg";

const { width, height } = Dimensions.get("window");

const C = {
  espresso: "#2C1A0E",
  espressoDark: "#1A0F08",
  espressoMid: "#3D2314",
  caramel: "#C8793A",
  cream: "#FAF3E0",
  latte: "#D4A96A",
};

function BackgroundArt() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <LinearGradient
        colors={[C.espressoDark, C.espresso, C.espressoMid, "#1E0E05"]}
        locations={[0, 0.3, 0.7, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="glow1" cx="50%" cy="55%" r="55%">
            <Stop offset="0" stopColor="#C8793A" stopOpacity="0.25" />
            <Stop offset="1" stopColor="#2C1A0E" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse
          cx={width * 0.5}
          cy={height * 0.62}
          rx={width * 0.85}
          ry={height * 0.48}
          fill="url(#glow1)"
        />
        <Circle
          cx={width * 0.5}
          cy={height * 0.74}
          r={width * 0.84}
          stroke="rgba(200,121,58,0.2)"
          strokeWidth="1.5"
          fill="none"
        />
        <Circle
          cx={width * 0.5}
          cy={height * 0.74}
          r={width * 0.7}
          stroke="rgba(200,121,58,0.12)"
          strokeWidth="1"
          fill="none"
        />
        <Circle
          cx={width * 0.5}
          cy={height * 0.74}
          r={width * 0.57}
          stroke="rgba(200,121,58,0.07)"
          strokeWidth="0.8"
          fill="none"
        />
      </Svg>
      <LinearGradient
        colors={["transparent", "rgba(26,15,8,0.4)"]}
        style={bgStyles.bottomVignette}
      />
      <LinearGradient
        colors={["rgba(20,10,5,0.3)", "transparent"]}
        style={bgStyles.topVignette}
      />
    </View>
  );
}

const bgStyles = StyleSheet.create({
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
    height: height * 0.2,
  },
});

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <BackgroundArt />

      {/* Hero */}
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

      {/* Bottom Card */}
      <View style={styles.bottomCard}>
        <Text style={styles.ctaHeading}>Ready to brew?</Text>
        <Text style={styles.ctaSub}>Craft every cup, track every order.</Text>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push("/(auth)/login")}
          activeOpacity={0.85}
        >
          <Text style={styles.loginBtnText}>Log in</Text>
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
    overflow: "hidden",
  },
  hero: {
    alignItems: "center",
    paddingTop: 72,
    gap: 8,
  },
  logoRing: {
    width: 112,
    height: 112,
    borderRadius: 28,
    backgroundColor: "rgba(58,30,12,0.85)",
    borderWidth: 1.5,
    borderColor: "rgba(200,121,58,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  logoImage: { width: 90, height: 90 },
  appName: {
    fontSize: 46,
    fontWeight: "800",
    color: C.cream,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 11,
    fontWeight: "500",
    color: C.latte,
    letterSpacing: 3.5,
    textTransform: "uppercase",
  },
  bottomCard: {
    width: "100%",
    backgroundColor: "rgba(42, 22, 8, 0.95)",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 28,
    alignItems: "center",
    gap: 14,
    borderTopWidth: 1,
    borderColor: "rgba(200,121,58,0.18)",
  },
  ctaHeading: {
    fontSize: 22,
    fontWeight: "700",
    color: C.cream,
  },
  ctaSub: {
    fontSize: 13,
    color: C.latte,
    opacity: 0.8,
    marginBottom: 4,
  },
  loginBtn: {
    width: "100%",
    backgroundColor: "#E8D5B0",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2C1A0E",
    letterSpacing: 0.3,
  },
  signupBtn: {
    width: "100%",
    backgroundColor: C.caramel,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    shadowColor: C.caramel,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  signupBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: C.cream,
    letterSpacing: 0.3,
  },
  footerText: {
    fontSize: 12,
    color: "rgba(212,169,106,0.4)",
    marginTop: 2,
  },
});
