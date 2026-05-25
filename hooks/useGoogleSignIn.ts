// ─── hooks/useGoogleSignIn.ts ─────────────────────────────────────────────────
// FIXES applied:
//
//  1. onSuccess stabilized via useRef — the original code listed onSuccess as
//     a useEffect dependency. Since login.tsx passes an arrow function
//     `() => router.replace("/(tabs)")`, every render produced a new function
//     reference, causing the effect to re-fire and potentially creating race
//     conditions or stale-closure navigation. Now onSuccess is stored in a ref
//     and excluded from the dependency array.
//
//  2. Deduplicated response handling — handledTokenRef still guards against
//     duplicate processing, but the dependency list is now [allowNewUser, response]
//     only, so it won't re-run on unrelated parent re-renders.
//
//  3. Improved id_token extraction with clearer fallback chain for both
//     Expo Go (web-based OAuth) and native development builds.
//
//  4. Loading state is always cleared in `finally`, even when an early return
//     path was hit after setting it. Previously some paths set loading=true
//     without a guarantee it would be cleared.
// ─────────────────────────────────────────────────────────────────────────────

import { auth, db } from "@/constants/firebase";
import { makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import {
  deleteUser,
  fetchSignInMethodsForEmail,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithCredential,
  signOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform } from "react-native";

// ── FIX: Guard maybeCompleteAuthSession() so it only runs in a real browser.
if (typeof window !== "undefined") {
  WebBrowser.maybeCompleteAuthSession();
}

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

  // ── FIX 1: Stabilize onSuccess with a ref ────────────────────────────────
  // Arrow functions passed as props are recreated on every parent render.
  // Storing in a ref means the effect dependency list never needs to include
  // onSuccess, preventing spurious re-runs and stale-closure bugs.
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }); // intentionally no deps — always keep ref current

  const clientIds = useMemo(
    () => ({
      webClientId: extra.googleWebClientId || undefined,
      iosClientId: extra.googleIosClientId || undefined,
      androidClientId: extra.googleAndroidClientId || undefined,
    }),
    [
      extra.googleAndroidClientId,
      extra.googleIosClientId,
      extra.googleWebClientId,
    ],
  );

  // ── Redirect URI ──────────────────────────────────────────────────────────
  // On web, makeRedirectUri() returns the current page origin (e.g.
  // http://localhost:8081). Add that URL to Authorized redirect URIs in your
  // Google Cloud Console → OAuth 2.0 Client (Web application).
  // For native builds the scheme-based URI is used automatically.
  // BUG FIX: Removed the `useProxy` variable — it was being passed to
  // promptAsync() with an `as any` cast which is not supported in
  // expo-auth-session v5+ and caused a deprecation warning.
  const redirectUri = makeRedirectUri({
    scheme: Platform.OS === "web" ? undefined : "mycafe",
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    ...clientIds,
    scopes: ["openid", "profile", "email"],
    redirectUri,
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
      Alert.alert(
        "Google Sign-In",
        "Google Sign-In is still loading. Please try again.",
      );
      return;
    }

    // Reset the handled-token guard so the user can retry after a previous
    // successful or failed attempt in the same session.
    handledTokenRef.current = null;
    try {
      // BUG FIX: `useProxy` was passed to promptAsync() via a hacky `as any`
      // cast. expo-auth-session removed support for this option in v5+; passing
      // it caused a warning and could silently break the OAuth redirect on Expo
      // Go. The correct approach is to configure redirectUri correctly (already
      // done above) and call promptAsync() with no options.
      await promptAsync();
    } catch (error) {
      console.warn("useGoogleSignIn: promptAsync failed", error);
      Alert.alert(
        "Google Sign-In Failed",
        "Unable to start Google authentication. Please try again.",
      );
    }
  };

  // ── FIX 2: onSuccess removed from dependency array ────────────────────────
  // Only [allowNewUser, response] drive this effect. onSuccess is read from
  // the stable ref instead.
  useEffect(() => {
    const finishGoogleSignIn = async () => {
      if (response?.type !== "success") return;

      // ── FIX 3: Improved id_token extraction ────────────────────────────────
      // expo-auth-session can return the token in different places depending
      // on the platform and OAuth flow used:
      //   • Expo Go / web flow  → response.params.id_token
      //   • Native dev build    → response.authentication.idToken
      const idToken =
        response.params?.id_token || response.authentication?.idToken || null;

      if (!idToken) {
        Alert.alert(
          "Google Sign-In Failed",
          "Google did not return an authentication token. Please try again.",
        );
        return;
      }

      // De-duplicate: ignore if we already handled this exact token
      if (handledTokenRef.current === idToken) return;
      handledTokenRef.current = idToken;

      // ── FIX 4: setLoading(true) before try, cleared in finally ─────────────
      setLoading(true);
      try {
        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, credential);
        const additionalInfo = getAdditionalUserInfo(result);

        // Login screen: block brand-new Google accounts (require Sign Up first)
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

        // Navigate immediately so the UI doesn't hang waiting for Firestore
        const user = result.user;
        try {
          console.log("useGoogleSignIn: signInWithCredential succeeded", {
            uid: user.uid,
            email: user.email,
          });
        } catch {
          // ignore
        }

        if (typeof onSuccessRef.current === "function") {
          try {
            onSuccessRef.current();
            console.log("useGoogleSignIn: onSuccess called");
          } catch (err) {
            console.warn("useGoogleSignIn: onSuccess threw", err);
          }
        } else {
          console.warn(
            "useGoogleSignIn: onSuccessRef.current is not a function",
          );
        }

        // Fire and forget the Firestore upsert — errors should not block navigation
        (async () => {
          try {
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
          } catch (upsertErr) {
            console.warn(
              "useGoogleSignIn: failed to upsert user document",
              upsertErr,
            );
          }
        })();
      } catch (error: any) {
        // Special handling when the Google email already has an account
        // with a different sign-in method (e.g. email/password).
        if (error?.code === "auth/account-exists-with-different-credential") {
          // Try to derive the email from the error or idToken.
          let email: string | null = null;
          try {
            email =
              (error?.customData && (error.customData as any).email) || null;
          } catch {
            email = null;
          }

          // Fallback: decode the idToken payload to extract the email.
          const decodeJwt = (token: string | null) => {
            if (!token) return null;
            try {
              const parts = token.split(".");
              if (parts.length < 2) return null;
              const payload = parts[1];
              // atob may not exist in all RN environments — try globalThis.atob
              const atobFn = (globalThis as any).atob;
              let json = null;
              if (typeof atobFn === "function") {
                json = atobFn(payload.replace(/-/g, "+").replace(/_/g, "/"));
              } else if (typeof Buffer !== "undefined") {
                // Node/metro environment
                // @ts-ignore
                json = Buffer.from(payload, "base64").toString("utf8");
              }
              if (!json) return null;
              return JSON.parse(json);
            } catch {
              return null;
            }
          };

          if (!email) {
            const decoded = decodeJwt(idToken);
            email = decoded?.email || decoded?.gmail || null;
          }

          if (email) {
            try {
              const methods = await fetchSignInMethodsForEmail(auth, email);
              const primary = methods && methods.length ? methods[0] : null;
              const methodLabel = primary === "password" ? "Password" : primary;

              Alert.alert(
                "Account Exists",
                `An account already exists for ${email} using ${methodLabel}. Please sign in with that method and link Google from your profile.`,
                [
                  {
                    text: "Send Reset Email",
                    onPress: async () => {
                      try {
                        await sendPasswordResetEmail(auth, email as string);
                        Alert.alert(
                          "Reset Sent",
                          "A password reset email has been sent. Use it to sign in and then link Google from your profile.",
                        );
                      } catch {
                        Alert.alert(
                          "Could not send reset",
                          "Failed to send password reset. Try signing in with your original method.",
                        );
                      }
                    },
                  },
                  { text: "OK", style: "cancel" },
                ],
              );
            } catch {
              Alert.alert(
                "Account Exists",
                "An account already exists with this email. Please sign in with the original method and link Google in your profile.",
              );
            }
            return;
          }
        }

        // Fall through to generic error handling below when we didn't return.

        const message =
          error?.code === "auth/account-exists-with-different-credential"
            ? "An account already exists with this Gmail. Please log in with the original method first, then link Google in your profile."
            : error?.code === "auth/network-request-failed"
              ? "Network error. Please check your connection and try again."
              : "Could not sign in with Google. Please try again.";
        Alert.alert("Google Sign-In Failed", message);
      } finally {
        // ── FIX 4: Always clear loading, even on early-return paths ─────────
        setLoading(false);
      }
    };

    finishGoogleSignIn();
  }, [allowNewUser, response]); // ← onSuccess intentionally NOT in deps

  return {
    googleLoading: loading,
    googleReady: Boolean(request) && isConfigured,
    signInWithGoogle,
  };
}
