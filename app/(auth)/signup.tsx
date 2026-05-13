import { auth, db } from "@/constants/firebase";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
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
};

function SignupBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <LinearGradient
        colors={["#120906", C.espresso, "#3A1E0C", "#180C04"]}
        locations={[0, 0.3, 0.65, 1]}
        start={{ x: 0.6, y: 0 }}
        end={{ x: 0.4, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={signupBgStyles.rayLeft} />
      <View style={signupBgStyles.rayRight} />
      <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="sg1" cx="15%" cy="25%" r="38%">
            <Stop offset="0" stopColor="#C8793A" stopOpacity="0.16" />
            <Stop offset="1" stopColor="#2C1A0E" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="sg2" cx="85%" cy="70%" r="38%">
            <Stop offset="0" stopColor="#D4A96A" stopOpacity="0.13" />
            <Stop offset="1" stopColor="#2C1A0E" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse
          cx={width * 0.15}
          cy={height * 0.25}
          rx={width * 0.55}
          ry={height * 0.3}
          fill="url(#sg1)"
        />
        <Ellipse
          cx={width * 0.85}
          cy={height * 0.7}
          rx={width * 0.55}
          ry={height * 0.3}
          fill="url(#sg2)"
        />
        {/* Concentric arcs — centered */}
        <Circle
          cx={width * 0.5}
          cy={height * 0.5}
          r={width * 0.9}
          stroke="rgba(200,121,58,0.07)"
          strokeWidth="1"
          fill="none"
        />
        <Circle
          cx={width * 0.5}
          cy={height * 0.5}
          r={width * 0.7}
          stroke="rgba(200,121,58,0.05)"
          strokeWidth="0.8"
          fill="none"
        />
        {/* Top-right beans */}
        <Ellipse
          cx={width * 0.85}
          cy={height * 0.07}
          rx="15"
          ry="9"
          fill="rgba(200,121,58,0.12)"
          transform={`rotate(-15, ${width * 0.85}, ${height * 0.07})`}
        />
        <Path
          d={`M${width * 0.85 - 9} ${height * 0.07} Q${width * 0.85} ${height * 0.07 - 4} ${width * 0.85 + 9} ${height * 0.07}`}
          stroke="rgba(200,121,58,0.22)"
          strokeWidth="1"
          fill="none"
        />
        <Ellipse
          cx={width * 0.78}
          cy={height * 0.04}
          rx="10"
          ry="6.5"
          fill="rgba(200,121,58,0.09)"
          transform={`rotate(10, ${width * 0.78}, ${height * 0.04})`}
        />
        {/* Bottom-left beans */}
        <Ellipse
          cx={width * 0.13}
          cy={height * 0.93}
          rx="17"
          ry="10.5"
          fill="rgba(212,169,106,0.1)"
          transform={`rotate(20, ${width * 0.13}, ${height * 0.93})`}
        />
        <Path
          d={`M${width * 0.13 - 10} ${height * 0.93} Q${width * 0.13} ${height * 0.93 - 5} ${width * 0.13 + 10} ${height * 0.93}`}
          stroke="rgba(212,169,106,0.18)"
          strokeWidth="1"
          fill="none"
        />
        {/* Horizontal divider hint */}
        <Path
          d={`M${width * 0.06} ${height * 0.44} L${width * 0.94} ${height * 0.44}`}
          stroke="rgba(200,121,58,0.09)"
          strokeWidth="0.8"
          fill="none"
        />
      </Svg>
      <LinearGradient
        colors={["transparent", "rgba(18,8,3,0.5)"]}
        style={signupBgStyles.bottomVignette}
      />
      <LinearGradient
        colors={["rgba(12,6,2,0.5)", "transparent"]}
        style={signupBgStyles.topVignette}
      />
    </View>
  );
}

const signupBgStyles = StyleSheet.create({
  rayLeft: {
    position: "absolute",
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: "rgba(200,121,58,0.045)",
    top: -width * 0.4,
    left: -width * 0.65,
  },
  rayRight: {
    position: "absolute",
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width * 0.7,
    backgroundColor: "rgba(212,169,106,0.04)",
    bottom: -width * 0.5,
    right: -width * 0.55,
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
    height: height * 0.2,
  },
});

export default function SignupScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    gmail: "",
    cafeName: "",
    password: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = (): boolean => {
    const e: Partial<typeof form> = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.gmail.trim()) e.gmail = "Gmail is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.gmail))
      e.gmail = "Enter a valid email";
    if (!form.cafeName.trim()) e.cafeName = "Cafe name is required";
    else if (form.cafeName.length < 3) e.cafeName = "At least 3 characters";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "At least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        form.gmail.trim().toLowerCase(),
        form.password,
      );
      await updateProfile(credential.user, {
        displayName: form.fullName.trim(),
      });
      await setDoc(doc(db, "users", credential.user.uid), {
        uid: credential.user.uid,
        fullName: form.fullName.trim(),
        email: form.gmail.trim().toLowerCase(),
        cafeName: form.cafeName.trim(),
        createdAt: serverTimestamp(),
      });
      router.replace("/(tabs)");
    } catch (error: any) {
      const msg: Record<string, string> = {
        "auth/email-already-in-use": "This email is already registered.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/network-request-failed": "Network error. Check your connection.",
      };
      Alert.alert(
        "Sign Up Failed",
        msg[error.code] ?? error.message ?? "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  };

  const isValid = Object.values(form).every((v) => v.trim().length > 0);

  const fields: {
    key: keyof typeof form;
    label: string;
    placeholder: string;
    icon: string;
    keyboardType?: any;
    secure?: boolean;
    autoCapitalize?: any;
  }[] = [
    {
      key: "fullName",
      label: "Full Name",
      placeholder: "Juan dela Cruz",
      icon: "✏️",
      autoCapitalize: "words",
    },
    {
      key: "gmail",
      label: "Gmail",
      placeholder: "juan@gmail.com",
      icon: "📧",
      keyboardType: "email-address",
    },
    {
      key: "cafeName",
      label: "Cafe Name",
      placeholder: "Juan's Cafe",
      icon: "🏪",
      autoCapitalize: "words",
    },
    {
      key: "password",
      label: "Password",
      placeholder: "••••••••",
      icon: "🔒",
      secure: true,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.espressoDark }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SignupBackground />

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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join MyCafe and start tracking</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {fields.map((field) => (
              <View key={field.key} style={styles.inputGroup}>
                <Text style={styles.label}>{field.label}</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors[field.key] ? styles.inputError : null,
                  ]}
                >
                  <Text style={styles.inputIcon}>{field.icon}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={field.placeholder}
                    placeholderTextColor="rgba(212,169,106,0.45)"
                    value={form[field.key]}
                    onChangeText={(v) => updateForm(field.key, v)}
                    autoCapitalize={field.autoCapitalize ?? "none"}
                    autoCorrect={false}
                    keyboardType={field.keyboardType ?? "default"}
                    secureTextEntry={field.secure && !showPass}
                    editable={!loading}
                  />
                  {field.secure && (
                    <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                      <Text style={styles.showHide}>
                        {showPass ? "Hide" : "Show"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                {errors[field.key] ? (
                  <Text style={styles.errorText}>⚠️ {errors[field.key]}</Text>
                ) : null}
              </View>
            ))}
          </View>

          <Text style={styles.terms}>
            By signing up you agree to our{" "}
            <Text style={styles.termsBold}>Terms & Privacy Policy</Text>
          </Text>

          <View style={styles.cta}>
            <TouchableOpacity
              style={[
                styles.signupBtn,
                (!isValid || loading) && styles.btnDisabled,
              ]}
              onPress={handleSignup}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={C.cream} />
              ) : (
                <Text style={styles.signupBtnText}>Create Account →</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.replace("/(auth)/login")}
              disabled={loading}
            >
              <Text style={styles.loginLink}>
                Already have an account?{" "}
                <Text style={styles.loginLinkBold}>Log In</Text>
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
    gap: 24,
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
  form: { gap: 14 },
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
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: C.cream, fontWeight: "500" },
  showHide: { fontSize: 13, color: C.caramel, fontWeight: "600" },
  errorText: {
    fontSize: 12,
    color: "#E74C3C",
    fontWeight: "500",
    marginLeft: 4,
  },

  // Terms
  terms: { fontSize: 12, color: "rgba(212,169,106,0.5)", textAlign: "center" },
  termsBold: { fontWeight: "700", color: C.latte },

  // CTA
  cta: { gap: 16, alignItems: "center" },
  signupBtn: {
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
  btnDisabled: { opacity: 0.45 },
  signupBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: C.cream,
    letterSpacing: 0.5,
  },
  loginLink: { fontSize: 14, color: C.latte },
  loginLinkBold: { fontWeight: "800", color: C.caramel },
});
