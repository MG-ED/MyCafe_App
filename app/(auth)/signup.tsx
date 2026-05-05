import { auth, db } from "@/constants/firebase";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
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
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join MyCafe and start tracking</Text>
          </View>

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
                    placeholderTextColor="#C4A882"
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
                <ActivityIndicator color="#FFF5E4" />
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
    backgroundColor: "#FDF6EC",
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
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
  form: { gap: 14 },
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
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#3E1F0D", fontWeight: "500" },
  showHide: { fontSize: 13, color: "#8B4513", fontWeight: "600" },
  errorText: {
    fontSize: 12,
    color: "#C0392B",
    fontWeight: "500",
    marginLeft: 4,
  },
  terms: { fontSize: 12, color: "#B89080", textAlign: "center" },
  termsBold: { fontWeight: "700", color: "#5C3317" },
  cta: { gap: 16, alignItems: "center" },
  signupBtn: {
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
  btnDisabled: { opacity: 0.5 },
  signupBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFF5E4",
    letterSpacing: 0.5,
  },
  loginLink: { fontSize: 14, color: "#8B6355" },
  loginLinkBold: { fontWeight: "800", color: "#3E1F0D" },
});
