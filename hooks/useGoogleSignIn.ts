import { auth, db } from "@/constants/firebase";
import Constants from "expo-constants";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {
  deleteUser,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";

WebBrowser.maybeCompleteAuthSession();

type GoogleExtra = {
  googleWebClientId?: string;
  googleIosClientId?: string;
  googleAndroidClientId?: string;
};

type UseGoogleSignInOptions = {
  allowNewUser: boolean;
  hasAcceptedTerms?: boolean;
  requireTerms?: boolean;
  onTermsRequired?: () => void;
  onSuccess: () => void;
};

export function useGoogleSignIn({
  allowNewUser,
  hasAcceptedTerms = false,
  requireTerms = false,
  onTermsRequired,
  onSuccess,
}: UseGoogleSignInOptions) {
  const [loading, setLoading] = useState(false);
  const handledTokenRef = useRef<string | null>(null);
  const extra = (Constants.expoConfig?.extra ?? {}) as GoogleExtra;

  const clientIds = useMemo(
    () => ({
      webClientId: extra.googleWebClientId || undefined,
      iosClientId: extra.googleIosClientId || undefined,
      androidClientId: extra.googleAndroidClientId || undefined,
    }),
    [extra.googleAndroidClientId, extra.googleIosClientId, extra.googleWebClientId],
  );

  const [request, response, promptAsync] = Google.useAuthRequest({
    ...clientIds,
    scopes: ["openid", "profile", "email"],
  });

  const isConfigured = Boolean(
    clientIds.webClientId || clientIds.iosClientId || clientIds.androidClientId,
  );

  const signInWithGoogle = async () => {
    if (requireTerms && !hasAcceptedTerms) {
      onTermsRequired?.();
      return;
    }

    if (!isConfigured) {
      Alert.alert(
        "Google Sign-In Setup Needed",
        "Add your Google OAuth client ID in app.json under expo.extra before using Google Sign-In.",
      );
      return;
    }

    if (!request) {
      Alert.alert("Google Sign-In", "Google Sign-In is still loading.");
      return;
    }

    await promptAsync();
  };

  useEffect(() => {
    const finishGoogleSignIn = async () => {
      if (response?.type !== "success") return;

      const idToken =
        response.params?.id_token || response.authentication?.idToken;

      if (!idToken) {
        Alert.alert(
          "Google Sign-In Failed",
          "Google did not return a profile token. Please try again.",
        );
        return;
      }

      if (handledTokenRef.current === idToken) return;
      handledTokenRef.current = idToken;

      setLoading(true);
      try {
        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, credential);
        const additionalInfo = getAdditionalUserInfo(result);

        if (additionalInfo?.isNewUser && !allowNewUser) {
          try {
            await deleteUser(result.user);
          } catch {
            await signOut(auth);
          }
          Alert.alert(
            "Create Account First",
            "Please use Sign Up with Google and accept the Terms & Privacy Policy before logging in.",
          );
          return;
        }

        const user = result.user;
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        const existing = snap.exists() ? snap.data() : {};

        await setDoc(
          userRef,
          {
            uid: user.uid,
            fullName: existing.fullName || user.displayName || "Cafe Owner",
            gmail: user.email || existing.gmail || existing.email || "",
            email: user.email || existing.email || existing.gmail || "",
            profilePic: user.photoURL || existing.profilePic || "",
            photoURL: user.photoURL || existing.photoURL || "",
            googleProviderConnected: true,
            googleProfileConsent: true,
            googleProfileConsentAt:
              existing.googleProfileConsentAt || serverTimestamp(),
            gmailProfileConsent: true,
            gmailProfileConsentAt:
              existing.gmailProfileConsentAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
            ...(snap.exists() ? {} : { createdAt: serverTimestamp() }),
          },
          { merge: true },
        );

        onSuccess();
      } catch (error: any) {
        const message =
          error?.code === "auth/account-exists-with-different-credential"
            ? "An account already exists with this Gmail. Please log in with the original method first."
            : "Could not sign in with Google. Please try again.";
        Alert.alert("Google Sign-In Failed", message);
      } finally {
        setLoading(false);
      }
    };

    finishGoogleSignIn();
  }, [allowNewUser, onSuccess, response]);

  return {
    googleLoading: loading,
    googleReady: Boolean(request) && isConfigured,
    signInWithGoogle,
  };
}
