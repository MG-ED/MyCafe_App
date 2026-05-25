import TermsAndPrivacyModal from "@/components/TermsAndPrivacyModal";
import { auth, db } from "@/constants/firebase";
import {
  LIMITS,
  PasswordStrength,
  checkPasswordStrength,
  sanitizeText,
  validateCafeName,
  validateEmail,
  validateFullName,
  validatePassword,
} from "@/constants/security";
import { useRateLimiter } from "@/hooks/useRateLimiter";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  caramel: "#C8793A",
  cream: "#FAF3E0",
  latte: "#D4A96A",
  danger: "#E74C3C",
};

// ── Background ────────────────────────────────────────────────────────────────

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
      <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="sg1" cx="50%" cy="60%" r="55%">
            <Stop offset="0" stopColor="#C8793A" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#2C1A0E" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse
          cx={width * 0.5}
          cy={height * 0.65}
          rx={width * 0.85}
          ry={height * 0.5}
          fill="url(#sg1)"
        />
        <Circle
          cx={width * 0.5}
          cy={height * 0.76}
          r={width * 0.82}
          stroke="rgba(200,121,58,0.17)"
          strokeWidth="1.5"
          fill="none"
        />
        <Circle
          cx={width * 0.5}
          cy={height * 0.76}
          r={width * 0.68}
          stroke="rgba(200,121,58,0.10)"
          strokeWidth="1"
          fill="none"
        />
        <Circle
          cx={width * 0.5}
          cy={height * 0.76}
          r={width * 0.55}
          stroke="rgba(200,121,58,0.06)"
          strokeWidth="0.8"
          fill="none"
        />
      </Svg>
      <LinearGradient
        colors={["transparent", "rgba(18,8,3,0.45)"]}
        style={bgS.bottom}
      />
      <LinearGradient
        colors={["rgba(12,6,2,0.4)", "transparent"]}
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
    height: height * 0.2,
  },
});

// ── Password Strength Meter ───────────────────────────────────────────────────

function PasswordStrengthMeter({
  strength,
}: {
  strength: PasswordStrength | null;
}) {
  if (!strength) return null;

  const bars = [0, 1, 2, 3, 4];

  return (
    <View style={meterS.wrapper}>
      {/* Bar segments */}
      <View style={meterS.barsRow}>
        {bars.map((i) => (
          <View
            key={i}
            style={[
              meterS.bar,
              {
                backgroundColor:
                  i < strength.score ? strength.color : "rgba(255,255,255,0.1)",
              },
            ]}
          />
        ))}
        <Text style={[meterS.label, { color: strength.color }]}>
          {strength.label}
        </Text>
      </View>

      {/* Requirements list */}
      {strength.errors.length > 0 && (
        <View style={meterS.reqWrap}>
          {strength.errors.map((err, i) => (
            <Text key={i} style={meterS.req}>
              • {err}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const meterS = StyleSheet.create({
  wrapper: { gap: 6 },
  barsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  label: { fontSize: 11, fontWeight: "700", marginLeft: 4, minWidth: 72 },
  reqWrap: { gap: 2 },
  req: { fontSize: 11, color: "rgba(212,169,106,0.65)" },
});

// ── Gmail domain validator ────────────────────────────────────────────────────

function validateGmailDomain(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return null; // let the required/format check handle empty
  if (!trimmed.endsWith("@gmail.com")) {
    return "Only Gmail accounts (@gmail.com) are accepted.";
  }
  return null;
}

// ── Screen ────────────────────────────────────────────────────────────────────

type FormKey = "fullName" | "gmail" | "cafeName" | "password";

export default function SignupScreen() {
  const router = useRouter();
  const rl = useRateLimiter();

  const [form, setForm] = useState<Record<FormKey, string>>({
    fullName: "",
    gmail: "",
    cafeName: "",
    password: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FormKey, string>>>({});
  const [focused, setFocused] = useState<string | null>(null);
  const [pwStrength, setPwStrength] = useState<PasswordStrength | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState("");

  const updateForm = (key: FormKey, raw: string) => {
    // Hard character limits
    const maxLen: Record<FormKey, number> = {
      fullName: LIMITS.fullName.max,
      gmail: LIMITS.email.max,
      cafeName: LIMITS.cafeName.max,
      password: LIMITS.password.max,
    };
    const value = raw.slice(0, maxLen[key]);

    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));

    if (key === "password" && value) {
      setPwStrength(checkPasswordStrength(value));
    } else if (key === "password") {
      setPwStrength(null);
    }
  };

  const validate = (): boolean => {
    const e: Partial<Record<FormKey, string>> = {};

    const nameErr = validateFullName(form.fullName);
    const emailErr = validateEmail(form.gmail);
    const gmailErr = emailErr ? null : validateGmailDomain(form.gmail);
    const cafeErr = validateCafeName(form.cafeName);
    const passwordErr = validatePassword(form.password);

    if (nameErr) e.fullName = nameErr;
    if (emailErr) e.gmail = emailErr;
    else if (gmailErr) e.gmail = gmailErr;
    if (cafeErr) e.cafeName = cafeErr;
    if (passwordErr) e.password = passwordErr;

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (!termsAccepted) {
      setShowTermsModal(true);
      Alert.alert(
        "Terms Required",
        "Please accept the Terms & Privacy Policy before creating your account.",
      );
      return;
    }
    if (!validate()) return;
    if (rl.isLocked) return;

    // Sanitize all text inputs before sending to Firebase/Firestore
    const cleanEmail = sanitizeText(form.gmail).toLowerCase();
    const cleanFullName = sanitizeText(form.fullName);
    const cleanCafeName = sanitizeText(form.cafeName);
    // Password: do NOT sanitize — preserve exact characters

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        form.password,
      );
      await updateProfile(credential.user, {
        displayName: cleanFullName,
      });
      // Write sanitized data to Firestore
      await setDoc(doc(db, "users", credential.user.uid), {
        uid: credential.user.uid,
        fullName: cleanFullName,
        email: cleanEmail,
        cafeName: cleanCafeName,
        termsAcceptedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      // Send verification email in the background — do NOT block navigation
      sendEmailVerification(credential.user).catch(() => {
        // Silent fail — user can request resend from within the app
      });

      await rl.recordSuccess(cleanEmail);

      // Navigate to the app immediately; email verification is not mandatory
      router.replace("/(tabs)");
    } catch (error: any) {
      await rl.recordFailure(cleanEmail);

      const msg: Record<string, string> = {
        "auth/email-already-in-use":
          "An account with this email already exists.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Password does not meet security requirements.",
        "auth/network-request-failed": "Network error. Check your connection.",
        "auth/operation-not-allowed": "Account creation is currently disabled.",
      };
      Alert.alert(
        "Sign Up Failed",
        msg[error.code] ?? "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const allFilled = Object.values(form).every((v) => v.trim().length > 0);
  const isFormDisabled = loading || rl.isLocked;
  const canSubmit = allFilled && termsAccepted && !isFormDisabled;

  const fields: {
    key: FormKey;
    label: string;
    placeholder: string;
    keyboardType?: any;
    secure?: boolean;
    autoCapitalize?: any;
    autoComplete?: any;
    textContentType?: any;
  }[] = [
    {
      key: "fullName",
      label: "FULL NAME",
      placeholder: "Juan dela Cruz",
      autoCapitalize: "words",
      autoComplete: "name",
      textContentType: "name",
    },
    {
      key: "gmail",
      label: "GMAIL",
      placeholder: "juan@gmail.com",
      keyboardType: "email-address",
      autoComplete: "email",
      textContentType: "emailAddress",
    },
    {
      key: "cafeName",
      label: "CAFE NAME",
      placeholder: "JUAN CAFE",
      autoCapitalize: "characters",
    },
    {
      key: "password",
      label: "PASSWORD",
      placeholder: "• • • • • •",
      secure: true,
      autoComplete: "off",
      textContentType: "none",
    },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.espressoDark }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SignupBackground />

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
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Create your MyCafe account</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {fields.map((field) => (
            <View key={field.key} style={styles.inputGroup}>
              <Text style={styles.label}>{field.label}</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focused === field.key && styles.inputFocused,
                  errors[field.key] && styles.inputError,
                  isFormDisabled && styles.inputDisabled,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder={field.placeholder}
                  placeholderTextColor="rgba(212,169,106,0.4)"
                  value={form[field.key]}
                  onChangeText={(v) => updateForm(field.key, v)}
                  onFocus={() => setFocused(field.key)}
                  onBlur={() => {
                    setFocused(null);
                    if (field.key === "gmail") {
                      const gmailErr = validateGmailDomain(form.gmail);
                      if (gmailErr) {
                        setErrors((prev) => ({ ...prev, gmail: gmailErr }));
                      }
                    }
                  }}
                  autoCapitalize={field.autoCapitalize ?? "none"}
                  autoCorrect={false}
                  autoComplete={field.autoComplete}
                  textContentType={field.textContentType}
                  keyboardType={field.keyboardType ?? "default"}
                  secureTextEntry={field.secure && !showPass}
                  editable={!isFormDisabled}
                  spellCheck={false}
                />
                {field.secure && (
                  <TouchableOpacity
                    onPress={() => setShowPass(!showPass)}
                    disabled={isFormDisabled}
                  >
                    <Text style={styles.showHide}>
                      {showPass ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Password strength meter (only for password field) */}
              {field.key === "password" &&
                pwStrength &&
                form.password.length > 0 && (
                  <PasswordStrengthMeter strength={pwStrength} />
                )}

              {/* Gmail domain hint */}
              {field.key === "gmail" &&
                form.gmail.trim().length > 0 &&
                !errors.gmail && (
                  <Text
                    style={[
                      styles.gmailHint,
                      {
                        color: form.gmail
                          .trim()
                          .toLowerCase()
                          .endsWith("@gmail.com")
                          ? "#27AE60"
                          : C.danger,
                      },
                    ]}
                  >
                    {form.gmail.trim().toLowerCase().endsWith("@gmail.com")
                      ? "✓ Valid Gmail account"
                      : "⚠ Must be a @gmail.com address"}
                  </Text>
                )}

              {errors[field.key] ? (
                <Text style={styles.errorText}>⚠ {errors[field.key]}</Text>
              ) : null}
            </View>
          ))}
        </View>

        {/* Terms */}
        <TouchableOpacity
          onPress={() => setShowTermsModal(true)}
          disabled={isFormDisabled}
          activeOpacity={0.7}
        >
          <Text style={styles.terms}>
            {termsAccepted ? "Accepted: " : "Required: "}
            <Text style={[styles.termsBold, styles.termsLink]}>
              Terms & Privacy Policy
            </Text>
          </Text>
        </TouchableOpacity>
        {termsError ? (
          <Text style={styles.termsError}>{termsError}</Text>
        ) : null}

        {/* CTA */}
        <View style={styles.cta}>
          <TouchableOpacity
            style={[styles.signupBtn, !canSubmit && styles.btnDisabled]}
            onPress={handleSignup}
            activeOpacity={0.85}
            disabled={!canSubmit}
          >
            {loading ? (
              <ActivityIndicator color={C.cream} />
            ) : (
              <Text style={styles.signupBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            onPress={() => router.replace("/(auth)/login")}
            disabled={isFormDisabled}
          >
            <Text style={styles.loginLink}>
              Already have an account?{" "}
              <Text style={styles.loginLinkBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TermsAndPrivacyModal
        visible={showTermsModal}
        loading={loading}
        onAccept={() => {
          setTermsAccepted(true);
          setTermsError("");
          setShowTermsModal(false);
        }}
        onReject={() => {
          setTermsAccepted(false);
          setShowTermsModal(false);
          setTermsError(
            "Please accept the Terms & Privacy Policy to create a new account.",
          );
          Alert.alert(
            "Terms Required",
            "You must accept the Terms & Privacy Policy to create a new account.",
          );
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 56,
    paddingBottom: 40,
    gap: 22,
  },
  header: { alignItems: "center", gap: 5 },
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

  form: { gap: 14 },
  inputGroup: { gap: 7 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: C.latte,
    letterSpacing: 1.0,
    textTransform: "uppercase",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 15,
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
  inputDisabled: { opacity: 0.5 },
  input: { flex: 1, fontSize: 14, color: C.cream, fontWeight: "500" },
  showHide: { fontSize: 13, color: C.caramel, fontWeight: "600" },
  gmailHint: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: C.danger,
    fontWeight: "500",
    marginLeft: 4,
  },

  terms: {
    fontSize: 12,
    color: C.cream,
    textAlign: "center",
    lineHeight: 18,
  },
  termsBold: { fontWeight: "700", color: C.latte },
  termsLink: {
    textDecorationLine: "underline",
  },
  termsError: {
    fontSize: 12,
    color: C.danger,
    textAlign: "center",
    marginTop: 6,
  },

  cta: { gap: 14, alignItems: "center" },
  signupBtn: {
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
  btnDisabled: { opacity: 0.5 },
  signupBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: C.cream,
    letterSpacing: 0.3,
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
  loginLink: { fontSize: 14, color: C.latte },
  loginLinkBold: { fontWeight: "700", color: C.caramel },
});
