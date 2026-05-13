import { auth } from "@/constants/firebase";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
  cream: "#FAF3E0",
  latte: "#D4A96A",
  steamDark: "rgba(255,255,255,0.08)",
  surface: "rgba(255,255,255,0.06)",
  border: "rgba(200,121,58,0.25)",
  borderFocus: "rgba(200,121,58,0.7)",
};

function LoginBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <LinearGradient
        colors={[C.espressoDark, C.espresso, "#3A2010", "#1A0A04"]}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={loginBgStyles.rayTopRight} />
      <View style={loginBgStyles.rayBottomLeft} />
      <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="lg1" cx="70%" cy="15%" r="40%">
            <Stop offset="0" stopColor="#C8793A" stopOpacity="0.18" />
            <Stop offset="1" stopColor="#2C1A0E" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="lg2" cx="20%" cy="80%" r="35%">
            <Stop offset="0" stopColor="#D4A96A" stopOpacity="0.12" />
            <Stop offset="1" stopColor="#2C1A0E" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse
          cx={width * 0.7}
          cy={height * 0.15}
          rx={width * 0.6}
          ry={height * 0.28}
          fill="url(#lg1)"
        />
        <Ellipse
          cx={width * 0.2}
          cy={height * 0.8}
          rx={width * 0.5}
          ry={height * 0.25}
          fill="url(#lg2)"
        />
        {/* Decorative arcs top-right */}
        <Circle
          cx={width * 1.1}
          cy={-height * 0.05}
          r={width * 0.65}
          stroke="rgba(200,121,58,0.1)"
          strokeWidth="1"
          fill="none"
        />
        <Circle
          cx={width * 1.1}
          cy={-height * 0.05}
          r={width * 0.5}
          stroke="rgba(200,121,58,0.07)"
          strokeWidth="0.8"
          fill="none"
        />
        {/* Decorative arcs bottom-left */}
        <Circle
          cx={-width * 0.1}
          cy={height * 1.08}
          r={width * 0.6}
          stroke="rgba(212,169,106,0.08)"
          strokeWidth="1"
          fill="none"
        />
        {/* Coffee beans top-left */}
        <Ellipse
          cx={width * 0.12}
          cy={height * 0.08}
          rx="16"
          ry="10"
          fill="rgba(200,121,58,0.12)"
          transform={`rotate(25, ${width * 0.12}, ${height * 0.08})`}
        />
        <Path
          d={`M${width * 0.12 - 10} ${height * 0.08} Q${width * 0.12} ${height * 0.08 - 5} ${width * 0.12 + 10} ${height * 0.08}`}
          stroke="rgba(200,121,58,0.22)"
          strokeWidth="1"
          fill="none"
        />
        <Ellipse
          cx={width * 0.19}
          cy={height * 0.05}
          rx="11"
          ry="7"
          fill="rgba(200,121,58,0.09)"
          transform={`rotate(-10, ${width * 0.19}, ${height * 0.05})`}
        />
        {/* Coffee beans bottom-right */}
        <Ellipse
          cx={width * 0.88}
          cy={height * 0.92}
          rx="18"
          ry="11"
          fill="rgba(212,169,106,0.1)"
          transform={`rotate(-20, ${width * 0.88}, ${height * 0.92})`}
        />
        <Path
          d={`M${width * 0.88 - 11} ${height * 0.92} Q${width * 0.88} ${height * 0.92 - 5} ${width * 0.88 + 11} ${height * 0.92}`}
          stroke="rgba(212,169,106,0.18)"
          strokeWidth="1"
          fill="none"
        />
        {/* Horizontal separator hint */}
        <Path
          d={`M${width * 0.08} ${height * 0.52} L${width * 0.92} ${height * 0.52}`}
          stroke="rgba(200,121,58,0.1)"
          strokeWidth="0.8"
          fill="none"
        />
      </Svg>
      <LinearGradient
        colors={["transparent", "rgba(20,10,4,0.55)"]}
        style={loginBgStyles.bottomVignette}
      />
      <LinearGradient
        colors={["rgba(15,8,3,0.45)", "transparent"]}
        style={loginBgStyles.topVignette}
      />
    </View>
  );
}

const loginBgStyles = StyleSheet.create({
  rayTopRight: {
    position: "absolute",
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: "rgba(200,121,58,0.05)",
    top: -width * 0.65,
    right: -width * 0.55,
  },
  rayBottomLeft: {
    position: "absolute",
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width * 0.7,
    backgroundColor: "rgba(212,169,106,0.04)",
    bottom: -width * 0.55,
    left: -width * 0.5,
  },
  bottomVignette: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
  },
  topVignette: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.22,
  },
});

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  const validate = () => {
    const e = { email: "", password: "" };
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return !e.email && !e.password;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password,
      );
      router.replace("/(tabs)");
    } catch (error: any) {
      const msg: Record<string, string> = {
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password. Please try again.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/invalid-credential": "Invalid email or password.",
        "auth/too-many-requests": "Too many failed attempts. Try again later.",
        "auth/network-request-failed": "Network error. Check your connection.",
        "auth/user-disabled": "This account has been disabled.",
      };
      Alert.alert(
        "Login Failed",
        msg[error.code] ?? error.message ?? "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        "Enter Email",
        "Please type your email address first, then tap Forgot Password.",
      );
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      Alert.alert(
        "Email Sent ✉️",
        `Password reset link sent to ${email.trim()}. Check your inbox.`,
      );
    } catch {
      Alert.alert(
        "Error",
        "Could not send reset email. Make sure the email is correct.",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.espressoDark }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LoginBackground />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.logoRing}>
              <Image
                source={require("../../assets/MyCafe_Logo.png")}
                style={styles.logoEmoji}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Log in to your MyCafe account</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gmail / Email</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.email ? styles.inputError : null,
                ]}
              >
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="juan@gmail.com"
                  placeholderTextColor="rgba(212,169,106,0.45)"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setErrors((p) => ({ ...p, email: "" }));
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
              {errors.email ? (
                <Text style={styles.errorText}>⚠️ {errors.email}</Text>
              ) : null}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.password ? styles.inputError : null,
                ]}
              >
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(212,169,106,0.45)"
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    setErrors((p) => ({ ...p, password: "" }));
                  }}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Text style={styles.showHide}>
                    {showPass ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={styles.errorText}>⚠️ {errors.password}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* CTA */}
          <View style={styles.cta}>
            <TouchableOpacity
              style={[
                styles.loginBtn,
                (!email || !password || loading) && styles.loginBtnDisabled,
              ]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={C.cream} />
              ) : (
                <Text style={styles.loginBtnText}>Log In →</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              onPress={() => router.replace("/(auth)/signup")}
              disabled={loading}
            >
              <Text style={styles.signupLink}>
                Don't have an account?{" "}
                <Text style={styles.signupLinkBold}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: "space-between",
    gap: 28,
  },

  // Header
  header: { alignItems: "center" },
  backBtn: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { fontSize: 20, color: C.cream, fontWeight: "600" },
  logoRing: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(200,121,58,0.12)",
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoEmoji: { width: 64, height: 64 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: C.cream,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 14, color: C.latte, marginTop: 6, opacity: 0.8 },

  // Form
  form: { gap: 16 },
  inputGroup: { gap: 8 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: C.latte,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  inputError: {
    borderColor: "#E74C3C",
    backgroundColor: "rgba(231,76,60,0.08)",
  },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: C.cream, fontWeight: "500" },
  showHide: { fontSize: 13, color: C.caramel, fontWeight: "600" },
  errorText: {
    fontSize: 12,
    color: "#E74C3C",
    fontWeight: "500",
    marginLeft: 4,
  },
  forgotBtn: { alignSelf: "flex-end" },
  forgotText: { fontSize: 13, color: C.caramel, fontWeight: "600" },

  // CTA
  cta: { gap: 16, alignItems: "center" },
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
  loginBtnDisabled: { opacity: 0.45 },
  loginBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: C.cream,
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  dividerText: {
    fontSize: 13,
    color: "rgba(212,169,106,0.5)",
    fontWeight: "500",
  },
  signupLink: { fontSize: 14, color: C.latte },
  signupLinkBold: { fontWeight: "800", color: C.caramel },
});
