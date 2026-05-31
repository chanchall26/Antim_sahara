"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppUser } from "@/types";
import { makeId } from "@/lib/utils";
import { firebaseEnabled, auth } from "@/lib/firebase/client";

export interface AuthError {
  code: string;
  message: string;
}

interface AuthValue {
  user: AppUser | null;
  loading: boolean;
  /** Instant demo sign-in (no backend). */
  signInDemo: (name?: string) => AppUser;
  /** Real email + password auth (creates the account if new, else signs in). */
  signInWithEmail: (email: string, password: string, name?: string) => Promise<AppUser>;
  /** Google sign-in via popup. */
  signInWithGoogle: () => Promise<AppUser>;
  signOut: () => void;
  usingFirebase: boolean;
}

const AuthContext = createContext<AuthValue | null>(null);
const STORAGE_KEY = "antim.user";

function loadLocalUser(): AppUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppUser) : null;
  } catch {
    return null;
  }
}

function saveLocalUser(user: AppUser | null) {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Map Firebase auth error codes to warm, plain-language messages. */
function friendlyError(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "That email doesn't look right. Please check and try again.";
    case "auth/weak-password":
      return "Please choose a password with at least 6 characters.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "That password doesn't match this email. Please try again.";
    case "auth/email-already-in-use":
      return "An account already exists — signing you in instead.";
    case "auth/operation-not-allowed":
    case "auth/configuration-not-found":
      return "This sign-in method isn't switched on yet. Please use demo mode for now.";
    case "auth/network-request-failed":
      return "Network problem. Please check your connection and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled. Please try again.";
    case "auth/popup-blocked":
      return "Your browser blocked the popup. Please allow popups and try again.";
    case "auth/account-exists-with-different-credential":
      return "This email is already registered with a different sign-in method.";
    case "auth/unauthorized-domain":
      return "This site isn't authorised for Google sign-in yet.";
    default:
      return "Something went wrong. Please try again, or use demo mode.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const local = loadLocalUser();
    // Restore a demo session immediately (Firebase doesn't know about demo users).
    if (local?.isDemo) setUser(local);

    if (firebaseEnabled && auth) {
      import("firebase/auth").then(({ onAuthStateChanged }) => {
        const unsub = onAuthStateChanged(auth!, (fbUser) => {
          if (fbUser) {
            const u: AppUser = {
              uid: fbUser.uid,
              displayName: fbUser.displayName ?? local?.displayName ?? undefined,
              email: fbUser.email ?? undefined,
              phone: fbUser.phoneNumber ?? undefined,
              preferredLanguage:
                (typeof window !== "undefined" && localStorage.getItem("antim.locale")) || "en",
              createdAt: Date.now(),
            };
            setUser(u);
            saveLocalUser(u);
          } else if (!loadLocalUser()?.isDemo) {
            setUser(null);
          }
          setLoading(false);
        });
        return () => unsub();
      });
    } else {
      if (local) setUser(local);
      setLoading(false);
    }
  }, []);

  const persist = useCallback((u: AppUser) => {
    setUser(u);
    saveLocalUser(u);
    setLoading(false);
    return u;
  }, []);

  const signInDemo = useCallback(
    (name?: string) =>
      persist({
        uid: makeId("demo"),
        displayName: name || "Friend",
        isDemo: true,
        preferredLanguage:
          (typeof window !== "undefined" && localStorage.getItem("antim.locale")) || "en",
        createdAt: Date.now(),
      }),
    [persist],
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string, name?: string): Promise<AppUser> => {
      // No Firebase configured → behave like a local account so the flow still works.
      if (!firebaseEnabled || !auth) {
        return persist({
          uid: makeId("u"),
          displayName: name || email.split("@")[0],
          email,
          preferredLanguage:
            (typeof window !== "undefined" && localStorage.getItem("antim.locale")) || "en",
          createdAt: Date.now(),
        });
      }

      const {
        createUserWithEmailAndPassword,
        signInWithEmailAndPassword,
        updateProfile,
      } = await import("firebase/auth");

      try {
        // Try to create the account; if it exists, sign in instead.
        let cred;
        try {
          cred = await createUserWithEmailAndPassword(auth, email, password);
          if (name) await updateProfile(cred.user, { displayName: name });
        } catch (e) {
          const code = (e as { code?: string }).code ?? "";
          if (code === "auth/email-already-in-use") {
            cred = await signInWithEmailAndPassword(auth, email, password);
          } else {
            throw e;
          }
        }
        // onAuthStateChanged will set the user; return a resolved user for immediate navigation.
        return {
          uid: cred.user.uid,
          displayName: name || cred.user.displayName || email.split("@")[0],
          email,
          preferredLanguage:
            (typeof window !== "undefined" && localStorage.getItem("antim.locale")) || "en",
          createdAt: Date.now(),
        };
      } catch (e) {
        const code = (e as { code?: string }).code ?? "unknown";
        const err: AuthError = { code, message: friendlyError(code) };
        throw err;
      }
    },
    [persist],
  );

  const signInWithGoogle = useCallback(async (): Promise<AppUser> => {
    if (!firebaseEnabled || !auth) {
      return persist({
        uid: makeId("u"),
        displayName: "Google user",
        preferredLanguage:
          (typeof window !== "undefined" && localStorage.getItem("antim.locale")) || "en",
        createdAt: Date.now(),
      });
    }
    const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      const cred = await signInWithPopup(auth, provider);
      return {
        uid: cred.user.uid,
        displayName: cred.user.displayName ?? cred.user.email?.split("@")[0],
        email: cred.user.email ?? undefined,
        preferredLanguage:
          (typeof window !== "undefined" && localStorage.getItem("antim.locale")) || "en",
        createdAt: Date.now(),
      };
    } catch (e) {
      const code = (e as { code?: string }).code ?? "unknown";
      const err: AuthError = { code, message: friendlyError(code) };
      throw err;
    }
  }, [persist]);

  const signOut = useCallback(() => {
    if (firebaseEnabled && auth) {
      import("firebase/auth").then(({ signOut: fbSignOut }) => fbSignOut(auth!));
    }
    setUser(null);
    saveLocalUser(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      signInDemo,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      usingFirebase: firebaseEnabled,
    }),
    [user, loading, signInDemo, signInWithEmail, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
