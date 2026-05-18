// ─── app/(auth)/login.tsx ─────────────────────────────────────────────────────
// SECURITY HARDENED:
//  ✅ Brute-force lockout (5 attempts → 15-min lockout, countdown timer)
//  ✅ Input sanitization (strips XSS, null bytes, HTML tags)
//  ✅ Strict email validation
//  ✅ Generic error messages (no account-existence leakage)
//  ✅ Disables form during lockout
//  ✅ Lockout state visible in UI with real-time countdown
//  ✅ Rate limiter clears on successful login
// ─────────────────────────────────────────────────────────────────────────────

import { auth } from "@/constants/firebase";
import { sanitizeText, validateEmail } from "@/constants/security";
import { useGoogleSignIn } from "@/hooks/useGoogleSignIn";
import { useRateLimiter } from "@/hooks/useRateLimiter";
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
    RadialGradient,
    Stop,
} from "react-native-svg";

const { width, height } = Dimensions.get("window");

const C = {
  espresso: "#2C1A0E",
  espressoDark: "#1A0F08",
  caramel: "#C8793A",
  cream: "#FAF3E0",
  latte: "#D4A96A",
  danger: "#E74C3C",
  warning: "#E67E22",
  locked: "#922B21",
};

// ── Background ────────────────────────────────────────────────────────────────

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
      <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="lg1" cx="50%" cy="60%" r="55%">
            <Stop offset="0" stopColor="#C8793A" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#2C1A0E" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse
          cx={width * 0.5}
          cy={height * 0.65}
          rx={width * 0.85}
          ry={height * 0.5}
          fill="url(#lg1)"
        />
        <Circle
          cx={width * 0.5}
          cy={height * 0.75}
          r={width * 0.82}
          stroke="rgba(200,121,58,0.18)"
          strokeWidth="1.5"
          fill="none"
        />
        <Circle
          cx={width * 0.5}
          cy={height * 0.75}
          r={width * 0.67}
          stroke="rgba(200,121,58,0.10)"
          strokeWidth="1"
          fill="none"
        />
        <Circle
          cx={width * 0.5}
          cy={height * 0.75}
          r={width * 0.54}
          stroke="rgba(200,121,58,0.06)"
          strokeWidth="0.8"
          fill="none"
        />
      </Svg>
      <LinearGradient
        colors={["transparent", "rgba(20,10,4,0.45)"]}
        style={bgS.bottom}
      />
      <LinearGradient
        colors={["rgba(15,8,3,0.35)", "transparent"]}
        style={bgS.top}
      />
    </View>
  );
}

const bgS = StyleSheet.create({
  bottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
  },
  top: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.22,
  },
});

// ── Lockout Banner ────────────────────────────────────────────────────────────

function LockoutBanner({ remainingSeconds }: { remainingSeconds: number }) {
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const timeStr =
    mins > 0 ? `${mins}m ${secs.toString().padStart(2, "0")}s` : `${secs}s`;

  return (
    <View style={lockS.banner}>
      <Text style={lockS.icon}>🔒</Text>
      <View style={lockS.textWrap}>
        <Text style={lockS.title}>Account Temporarily Locked</Text>
        <Text style={lockS.sub}>
          Too many failed attempts. Try again in{" "}
          <Text style={lockS.timer}>{timeStr}</Text>
        </Text>
      </View>
    </View>
  );
}

const lockS = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(146,43,33,0.25)",
    borderWidth: 1,
    borderColor: "rgba(231,76,60,0.45)",
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  icon: { fontSize: 24 },
  textWrap: { flex: 1 },
  title: { fontSize: 13, fontWeight: "700", color: "#F1948A" },
  sub: { fontSize: 12, color: "rgba(241,148,138,0.75)", marginTop: 2 },
  timer: { fontWeight: "800", color: "#F1948A" },
});

// ── Screen ────────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const router = useRouter();
  const rl = useRateLimiter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [focused, setFocused] = useState<string | null>(null);
  const { googleLoading, signInWithGoogle } = useGoogleSignIn({
    allowNewUser: false,
    onSuccess: () => router.replace("/(tabs)"),
  });

  // Check lock state when email field loses focus
  const handleEmailBlur = async () => {
    setFocused(null);
    if (email.trim()) await rl.checkLock(email.trim().toLowerCase());
  };

  const validate = (): boolean => {
    const emailErr = validateEmail(email);
    const passErr = !password ? "Password is required." : "";
    setErrors({ email: emailErr ?? "", password: passErr });
    return !emailErr && !passErr;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    if (rl.isLocked) return;

    const cleanEmail = sanitizeText(email).toLowerCase();
    // We don't sanitize password — preserve special chars the user chose

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, cleanEmail, password);
      await rl.recordSuccess(cleanEmail);
      router.replace("/(tabs)");
    } catch (error: any) {
      // ── Record the failure for rate limiting ──
      const nowLocked = await rl.recordFailure(cleanEmail);

      if (nowLocked) {
        // Banner already shown; no additional alert
        setPassword("");
        setLoading(false);
        return;
      }

      // ── Generic error messages (don't leak account existence) ──
      const authErrors: Record<string, string> = {
        "auth/user-not-found": "Invalid email or password.",
        "auth/wrong-password": "Invalid email or password.",
        "auth/invalid-credential": "Invalid email or password.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/user-disabled":
          "This account has been suspended. Contact support.",
        "auth/too-many-requests":
          "Too many attempts. Please wait before trying again.",
        "auth/network-request-failed": "Network error. Check your connection.",
      };

      const msg =
        authErrors[error.code] ??
        "Login failed. Please check your credentials and try again.";

      const attemptsLeft = rl.attemptsLeft;
      const warningMsg =
        attemptsLeft <= 2 && attemptsLeft > 0
          ? `\n\n⚠️ Warning: ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining before your account is temporarily locked.`
          : "";

      Alert.alert("Login Failed", msg + warningMsg);
      setPassword(""); // Always clear password on failure
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      Alert.alert(
        "Enter Email",
        "Type your email address first, then tap Forgot Password.",
      );
      return;
    }
    const emailErr = validateEmail(cleanEmail);
    if (emailErr) {
      Alert.alert("Invalid Email", emailErr);
      return;
    }
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      // Generic success message — don't confirm account existence
      Alert.alert(
        "Reset Email Sent",
        "If an account exists for that email, a password reset link has been sent. Check your inbox and spam folder.",
      );
    } catch {
      // Always show the same message to prevent account enumeration
      Alert.alert(
        "Reset Email Sent",
        "If an account exists for that email, a password reset link has been sent.",
      );
    }
  };

  const isFormDisabled = loading || googleLoading || rl.isLocked;

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
            <View style={styles.logoRing}>
              <Image
                source={require("../../assets/MyCafe_Logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Log in to your MyCafe account</Text>
          </View>

          {/* Lockout banner */}
          {rl.isLocked && (
            <LockoutBanner remainingSeconds={rl.remainingSeconds} />
          )}

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gmail/Email</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focused === "email" && styles.inputFocused,
                  errors.email && styles.inputError,
                  rl.isLocked && styles.inputDisabled,
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    isFormDisabled && styles.inputTextDisabled,
                  ]}
                  placeholder="(juan@gmail.com)"
                  placeholderTextColor="rgba(212,169,106,0.4)"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v.slice(0, 254)); // Hard length cap
                    setErrors((p) => ({ ...p, email: "" }));
                  }}
                  onFocus={() => setFocused("email")}
                  onBlur={handleEmailBlur}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  editable={!isFormDisabled}
                />
              </View>
              {errors.email ? (
                <Text style={styles.errorText}>⚠ {errors.email}</Text>
              ) : null}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focused === "password" && styles.inputFocused,
                  errors.password && styles.inputError,
                  rl.isLocked && styles.inputDisabled,
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    isFormDisabled && styles.inputTextDisabled,
                  ]}
                  placeholder="(Enter your password)"
                  placeholderTextColor="rgba(212,169,106,0.4)"
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v.slice(0, 128)); // Hard length cap
                    setErrors((p) => ({ ...p, password: "" }));
                  }}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  textContentType="password"
                  editable={!isFormDisabled}
                />
                {!rl.isLocked && (
                  <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                    <Text style={styles.showHide}>
                      {showPass ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {errors.password ? (
                <Text style={styles.errorText}>⚠ {errors.password}</Text>
              ) : null}
            </View>

            {/* Attempts warning */}
            {!rl.isLocked && rl.attemptsLeft < 5 && rl.attemptsLeft > 0 && (
              <Text style={styles.warningText}>
                ⚠ {rl.attemptsLeft} attempt{rl.attemptsLeft === 1 ? "" : "s"}{" "}
                left before temporary lockout
              </Text>
            )}

            {!rl.isLocked && (
              <TouchableOpacity
                style={styles.forgotBtn}
                onPress={handleForgotPassword}
                disabled={isFormDisabled}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* CTA */}
          <View style={styles.cta}>
            <TouchableOpacity
              style={[
                styles.loginBtn,
                (isFormDisabled || !email || !password) &&
                  styles.loginBtnDisabled,
                rl.isLocked && styles.loginBtnLocked,
              ]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={isFormDisabled}
            >
              {loading ? (
                <ActivityIndicator color={C.cream} />
              ) : rl.isLocked ? (
                <Text style={styles.loginBtnText}>🔒 Account Locked</Text>
              ) : (
                <Text style={styles.loginBtnText}>Log in</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.googleBtn,
                isFormDisabled && styles.loginBtnDisabled,
              ]}
              onPress={signInWithGoogle}
              activeOpacity={0.85}
              disabled={isFormDisabled}
            >
              {googleLoading ? (
                <ActivityIndicator color={C.espresso} />
              ) : (
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              onPress={() => router.replace("/(auth)/signup")}
              disabled={isFormDisabled}
            >
              <Text style={styles.signupLink}>
                Do not have an account?{" "}
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
    paddingTop: 64,
    paddingBottom: 40,
    justifyContent: "space-between",
    gap: 28,
  },
  header: { alignItems: "center", gap: 6 },
  logoRing: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: "rgba(58,30,12,0.85)",
    borderWidth: 1.5,
    borderColor: "rgba(200,121,58,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logoImage: { width: 62, height: 62 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: C.cream,
    letterSpacing: -0.3,
  },
  subtitle: { fontSize: 13, color: C.latte, opacity: 0.75, marginTop: 2 },

  form: { gap: 18 },
  inputGroup: { gap: 8 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: C.latte,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: "rgba(200,121,58,0.25)",
  },
  inputFocused: {
    borderColor: "rgba(200,121,58,0.65)",
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  inputError: {
    borderColor: C.danger,
    backgroundColor: "rgba(231,76,60,0.08)",
  },
  inputDisabled: {
    borderColor: "rgba(146,43,33,0.4)",
    backgroundColor: "rgba(146,43,33,0.08)",
    opacity: 0.6,
  },
  input: { flex: 1, fontSize: 14, color: C.cream, fontWeight: "500" },
  inputTextDisabled: { color: "rgba(250,243,224,0.4)" },
  showHide: { fontSize: 13, color: C.caramel, fontWeight: "600" },
  errorText: {
    fontSize: 12,
    color: C.danger,
    fontWeight: "500",
    marginLeft: 4,
  },
  warningText: {
    fontSize: 12,
    color: C.warning,
    fontWeight: "600",
    textAlign: "right",
  },
  forgotBtn: { alignSelf: "flex-end" },
  forgotText: { fontSize: 13, color: C.caramel, fontWeight: "600" },

  cta: { gap: 16, alignItems: "center" },
  loginBtn: {
    width: "100%",
    backgroundColor: C.caramel,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: C.caramel,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 7,
  },
  loginBtnDisabled: { opacity: 0.5 },
  loginBtnLocked: { backgroundColor: C.locked, shadowColor: C.locked },
  loginBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: C.cream,
    letterSpacing: 0.3,
  },
  googleBtn: {
    width: "100%",
    backgroundColor: C.cream,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(212,169,106,0.55)",
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: C.espresso,
    letterSpacing: 0.2,
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
  signupLinkBold: { fontWeight: "700", color: C.caramel },
});
