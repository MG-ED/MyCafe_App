import { useRouter } from "expo-router";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Background Circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/MyCafe_Logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.tagline}>Craft every cup, track every order.</Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
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
    backgroundColor: "#FDF6EC",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 60,
    paddingHorizontal: 28,
    overflow: "hidden",
  },
  bgCircle1: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#3E1F0D",
    top: -100,
    right: -80,
    opacity: 0.08,
  },
  bgCircle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#8B4513",
    bottom: 100,
    left: -60,
    opacity: 0.07,
  },
  bgCircle3: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#D2691E",
    top: height * 0.35,
    right: -30,
    opacity: 0.08,
  },

  // Hero
  hero: {
    alignItems: "center",
    marginTop: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  logoImage: {
    width: 200,
    height: 200,
  },
  appName: {
    fontSize: 42,
    fontWeight: "800",
    color: "#3E1F0D",
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 15,
    color: "#8B6355",
    marginTop: 8,
    letterSpacing: 0.2,
  },

  // Info Cards
  cardsRow: {
    flexDirection: "row",
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  infoIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#5C3317",
    textAlign: "center",
    lineHeight: 15,
  },

  // Buttons
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    gap: 14,
  },
  loginBtn: {
    width: "100%",
    backgroundColor: "#3E1F0D",
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  loginBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFF5E4",
    letterSpacing: 0.5,
  },
  signupBtn: {
    width: "100%",
    backgroundColor: "transparent",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#3E1F0D",
    paddingVertical: 16,
    alignItems: "center",
  },
  signupBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#3E1F0D",
    letterSpacing: 0.5,
  },
  footerText: {
    fontSize: 13,
    color: "#B89080",
    marginTop: 4,
  },
});
