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
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { getClientAuth, getClientDb, isFirebaseConfigured } from "@/lib/firebase/client";
import type { UserProfile, UserRole } from "@/types";

interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function ensureUserDocument(user: User, extras?: Partial<UserProfile>) {
  const db = getClientDb();
  const ref = doc(db, "users", user.uid);
  const existing = await getDoc(ref);
  if (existing.exists()) return;

  const firstName = extras?.firstName ?? user.displayName?.split(" ")[0] ?? "";
  const lastName =
    extras?.lastName ?? user.displayName?.split(" ").slice(1).join(" ") ?? "";
  const displayName =
    extras?.displayName ??
    user.displayName ??
    [firstName, lastName].filter(Boolean).join(" ") ??
    user.email ??
    "Member";

  await setDoc(ref, {
    uid: user.uid,
    email: user.email ?? extras?.email ?? "",
    firstName,
    lastName,
    displayName,
    photoURL: extras?.photoURL ?? user.photoURL ?? "",
    role: extras?.role ?? ("member" as UserRole),
    createdAt: serverTimestamp(),
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return;

    const auth = getClientAuth();
    const db = getClientDb();
    let unsubProfile: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubProfile?.();
      setFirebaseUser(user);

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      unsubProfile = onSnapshot(
        doc(db, "users", user.uid),
        (snap) => {
          if (snap.exists()) {
            setProfile({ uid: snap.id, ...(snap.data() as Omit<UserProfile, "uid">) });
          } else {
            setProfile(null);
            void ensureUserDocument(user);
          }
          setLoading(false);
        },
        () => {
          void ensureUserDocument(user).finally(() => setLoading(false));
        },
      );
    });

    return () => {
      unsubAuth();
      unsubProfile?.();
    };
  }, [configured]);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(getClientAuth(), email, password);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const auth = getClientAuth();
    const credential = await createUserWithEmailAndPassword(
      auth,
      input.email,
      input.password,
    );
    const displayName = `${input.firstName} ${input.lastName}`.trim();
    await updateProfile(credential.user, { displayName });
    await ensureUserDocument(credential.user, {
      firstName: input.firstName,
      lastName: input.lastName,
      displayName,
      email: input.email,
      role: "member",
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const auth = getClientAuth();
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    await ensureUserDocument(result.user);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(getClientAuth());
  }, []);

  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      loading,
      configured,
      signIn,
      register,
      signInWithGoogle,
      signOut,
    }),
    [
      firebaseUser,
      profile,
      loading,
      configured,
      signIn,
      register,
      signInWithGoogle,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
