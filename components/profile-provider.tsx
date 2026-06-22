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
import { createClient } from "@/lib/supabase/client";
import {
  clearActiveProfileId,
  createAccountProfile,
  createLocalProfile,
  getActiveProfileId,
  getProfile,
  isSupabaseConfigured,
  listProfiles,
  migrateLegacyStorage,
  removeProfile,
  saveProfile,
  setActiveProfileId,
  type UserProfile,
} from "@/lib/profiles";

interface ProfileContextValue {
  profiles: UserProfile[];
  activeProfile: UserProfile | null;
  ready: boolean;
  supabaseEnabled: boolean;
  switchProfile: (id: string) => void;
  createLocalProfileAndActivate: (name: string) => UserProfile;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  deleteProfile: (id: string) => void;
  updateActiveProfile: (patch: Partial<UserProfile>) => void;
  refreshProfiles: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);
  const supabaseEnabled = isSupabaseConfigured();

  const refreshProfiles = useCallback(() => {
    setProfiles(listProfiles());
    const activeId = getActiveProfileId();
    setActiveProfile(activeId ? getProfile(activeId) ?? null : null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      let registry = listProfiles();
      const legacyOnboarded = localStorage.getItem("fc5-onboarded");
      const legacyPrefs = localStorage.getItem("fc5-prefs");

      if (registry.length === 0 && (legacyOnboarded || legacyPrefs)) {
        const migrated = createLocalProfile("Me");
        migrated.onboarded = legacyOnboarded === "true";
        saveProfile(migrated);
        migrateLegacyStorage(migrated.id);
        setActiveProfileId(migrated.id);
        registry = listProfiles();
      }

      if (supabaseEnabled) {
        try {
          const supabase = createClient();
          const { data } = await supabase.auth.getSession();
          const session = data.session;
          if (session?.user) {
            const metaName =
              (session.user.user_metadata?.name as string | undefined) ||
              session.user.email?.split("@")[0] ||
              "Account";
            const profile = createAccountProfile({
              name: metaName,
              email: session.user.email ?? "",
              authUserId: session.user.id,
            });
            setActiveProfileId(profile.id);
          }
        } catch {
          // Supabase unavailable — local profiles still work
        }
      }

      if (!cancelled) {
        setProfiles(listProfiles());
        const activeId = getActiveProfileId();
        setActiveProfile(activeId ? getProfile(activeId) ?? null : null);
        setReady(true);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [supabaseEnabled]);

  const switchProfile = useCallback((id: string) => {
    setActiveProfileId(id);
    setActiveProfile(getProfile(id) ?? null);
  }, []);

  const createLocalProfileAndActivate = useCallback((name: string) => {
    const profile = createLocalProfile(name);
    setActiveProfileId(profile.id);
    setActiveProfile(profile);
    setProfiles(listProfiles());
    return profile;
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!supabaseEnabled) return { error: "Cloud login is not configured yet." };
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    const user = data.user;
    if (!user) return { error: "Sign in failed." };

    const profile = createAccountProfile({
      name: (user.user_metadata?.name as string) || email.split("@")[0],
      email: user.email ?? email,
      authUserId: user.id,
    });
    setActiveProfileId(profile.id);
    setActiveProfile(profile);
    setProfiles(listProfiles());
    return {};
  }, [supabaseEnabled]);

  const signUpWithEmail = useCallback(async (name: string, email: string, password: string) => {
    if (!supabaseEnabled) return { error: "Cloud login is not configured yet." };
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name.trim() } },
    });
    if (error) return { error: error.message };

    const user = data.user;
    if (!user) return { error: "Sign up failed." };

    const profile = createAccountProfile({
      name: name.trim() || email.split("@")[0],
      email: user.email ?? email,
      authUserId: user.id,
    });
    setActiveProfileId(profile.id);
    setActiveProfile(profile);
    setProfiles(listProfiles());
    return {};
  }, [supabaseEnabled]);

  const signOut = useCallback(async () => {
    if (supabaseEnabled) {
      try {
        await createClient().auth.signOut();
      } catch {
        // ignore
      }
    }
    clearActiveProfileId();
    setActiveProfile(null);
  }, [supabaseEnabled]);

  const deleteProfile = useCallback((id: string) => {
    removeProfile(id);
    if (getActiveProfileId() === id) {
      clearActiveProfileId();
      setActiveProfile(null);
    }
    setProfiles(listProfiles());
  }, []);

  const updateActiveProfile = useCallback((patch: Partial<UserProfile>) => {
    const activeId = getActiveProfileId();
    if (!activeId) return;
    const current = getProfile(activeId);
    if (!current) return;
    const updated = { ...current, ...patch };
    saveProfile(updated);
    setActiveProfile(updated);
    setProfiles(listProfiles());
  }, []);

  const value = useMemo(
    () => ({
      profiles,
      activeProfile,
      ready,
      supabaseEnabled,
      switchProfile,
      createLocalProfileAndActivate,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      deleteProfile,
      updateActiveProfile,
      refreshProfiles,
    }),
    [
      profiles,
      activeProfile,
      ready,
      supabaseEnabled,
      switchProfile,
      createLocalProfileAndActivate,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      deleteProfile,
      updateActiveProfile,
      refreshProfiles,
    ],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
