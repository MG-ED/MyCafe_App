import { auth } from "@/constants/firebase";
import { useRouter } from "expo-router";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
    } catch (error: any) {
      Alert.alert(
        "Error",
        "Could not send reset email. Make sure the email is correct.",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.logoMini}>
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
                <Text style={styles.inputIcon}></Text>
                <TextInput
                  style={styles.input}
                  placeholder="juan@gmail.com"
                  placeholderTextColor="#C4A882"
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
                <Text style={styles.inputIcon}></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#C4A882"
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
                <ActivityIndicator color="#FFF5E4" />
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
    backgroundColor: "#FDF6EC",
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: "space-between",
    gap: 24,
  },
  header: { alignItems: "center" },
  backBtn: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  backIcon: { fontSize: 20, color: "#3E1F0D", fontWeight: "600" },
  logoMini: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoEmoji: { width: 80, height: 80 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#3E1F0D",
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 14, color: "#8B6355", marginTop: 6 },
  firebaseBadge: {
    backgroundColor: "#FFF3CD",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFE49C",
  },
  firebaseText: { fontSize: 12, color: "#856404", fontWeight: "600" },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3E1F0D",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: "#E8D5C0",
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputError: { borderColor: "#C0392B", backgroundColor: "#FFF5F5" },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#3E1F0D", fontWeight: "500" },
  showHide: { fontSize: 13, color: "#8B4513", fontWeight: "600" },
  errorText: {
    fontSize: 12,
    color: "#C0392B",
    fontWeight: "500",
    marginLeft: 4,
  },
  forgotBtn: { alignSelf: "flex-end" },
  forgotText: { fontSize: 13, color: "#8B4513", fontWeight: "600" },
  cta: { gap: 16, alignItems: "center" },
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
  loginBtnDisabled: { opacity: 0.5 },
  loginBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFF5E4",
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E8D5C0" },
  dividerText: { fontSize: 13, color: "#B89080", fontWeight: "500" },
  signupLink: { fontSize: 14, color: "#8B6355" },
  signupLinkBold: { fontWeight: "800", color: "#3E1F0D" },
});
