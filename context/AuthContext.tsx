"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

type Profile = {
  pseudo: string | null;
  email: string | null;
  emailConfirmed: boolean;
};

type AuthContextType = {
  user: User | null;
  profile: Profile;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    pseudo: string
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updatePseudo: (pseudo: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function defaultProfile(): Profile {
  return { pseudo: null, email: null, emailConfirmed: true };
}

function isPseudoValid(pseudo: string) {
  // Autorise uniquement lettres/chiffres, longueur 3 à 15
  return /^[a-zA-Z0-9]{3,15}$/.test(pseudo);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(defaultProfile());
  const [loading, setLoading] = useState(true);
  const pendingPseudo = useRef<string | null>(null);

  const fetchProfile = useCallback(
    async (u: User | null) => {
      if (!u) {
        setProfile(defaultProfile());
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("pseudo, email")
        .eq("id", u.id)
        .maybeSingle();
      if (error && error.code !== "PGRST116") {
        console.error("Erreur profil", error);
        return;
      }
      setProfile({
        pseudo: data?.pseudo ?? (u.user_metadata as { pseudo?: string })?.pseudo ?? null,
        email: data?.email ?? u.email ?? null,
        emailConfirmed: true,
      });
    },
    []
  );

  const ensureProfile = useCallback(
    async (u: User, desiredPseudo?: string) => {
      const pseudoCandidate =
        desiredPseudo ??
        pendingPseudo.current ??
        (u.user_metadata as { pseudo?: string })?.pseudo ??
        null;

      if (!pseudoCandidate) {
        await fetchProfile(u);
        return;
      }

      const { data: existingPseudo } = await supabase
        .from("profiles")
        .select("id")
        .eq("pseudo", pseudoCandidate)
        .maybeSingle();

      if (existingPseudo && existingPseudo.id !== u.id) {
        setProfile((prev) => ({
          ...prev,
          pseudo: null,
          email: u.email ?? null,
          emailConfirmed: !!u.email_confirmed_at,
        }));
        return;
      }

      const { error: upsertError } = await supabase.from("profiles").upsert({
        id: u.id,
        email: u.email,
        pseudo: pseudoCandidate,
      });
      if (upsertError) {
        console.error("Erreur upsert profil", upsertError);
      }
      await fetchProfile(u);
      pendingPseudo.current = null;
    },
    [fetchProfile]
  );

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      await fetchProfile(data.session?.user ?? null);
      setLoading(false);
    };
    init();
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      await fetchProfile(session?.user ?? null);
      if (session?.user) {
        await ensureProfile(session.user);
      }
    });
    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [ensureProfile, fetchProfile]);

  const signIn = useCallback(async (identifier: string, password: string) => {
    const login = identifier.trim();
    if (!login) return { error: "Saisis ton pseudo ou Email." };

    let emailToUse = login;
    const looksLikeEmail = login.includes("@");

    // Si pseudo fourni, on récupère l'email associé (recherche insensible à la casse)
    if (!looksLikeEmail) {
      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .ilike("pseudo", login)
        .maybeSingle();

      if (profileError) {
        console.error("Erreur recherche pseudo", profileError);
        return { error: "Impossible de vérifier ce pseudo. Réessaie." };
      }
      if (!profileRow?.email) {
        return { error: "Pseudo introuvable. Vérifie l'orthographe ou inscris-toi." };
      }
      emailToUse = profileRow.email;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, pseudo: string) => {
      if (!isPseudoValid(pseudo)) {
        return {
          error: "Pseudo invalide (3-15 caractères alphanumériques, sans spéciaux).",
        };
      }
      // Vérifie l'unicité du pseudo avant de créer le compte pour éviter un profil sans pseudo
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("pseudo", pseudo)
        .maybeSingle();
      if (existing) return { error: "Pseudo déjà utilisé, choisis-en un autre." };

      pendingPseudo.current = pseudo;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { pseudo },
        },
      });
      if (error) return { error: error.message };
      // Tente de connecter immédiatement (email non confirmé requis désactivé)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) return { error: signInError.message };
      return {};
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(defaultProfile());
    // on ne redirige pas ici pour laisser les pages gérer la navigation
  }, []);

  const updatePseudo = useCallback(
    async (pseudo: string) => {
      if (!user) return { error: "Pas d'utilisateur connecté" };
      if (!isPseudoValid(pseudo)) {
        return {
          error: "Pseudo invalide (3-15 caractères alphanumériques, sans spéciaux).",
        };
      }
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("pseudo", pseudo)
        .maybeSingle();
      if (existing && existing.id !== user.id) {
        return { error: "Pseudo déjà utilisé" };
      }
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, email: user.email, pseudo });
      if (error) return { error: error.message };
      pendingPseudo.current = null;
      await fetchProfile(user);
      return {};
    },
    [fetchProfile, user]
  );

  const updatePassword = useCallback(async (password: string) => {
    if (!user) return { error: "Pas d'utilisateur connecté" };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
    return {};
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile: () => fetchProfile(user),
      updatePseudo,
      updatePassword,
    }),
    [
      fetchProfile,
      loading,
      profile,
      signIn,
      signUp,
      signOut,
      updatePseudo,
      updatePassword,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
