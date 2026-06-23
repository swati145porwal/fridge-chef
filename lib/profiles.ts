export type ProfileKind = "local" | "account";

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  authUserId?: string;
  kind: ProfileKind;
  emoji: string;
  createdAt: number;
  onboarded: boolean;
}

const REGISTRY_KEY = "fc6-profiles";
const ACTIVE_KEY = "fc6-active-profile";

const PROFILE_EMOJIS = ["👤", "👩‍🍳", "👨‍🍳", "🧑‍🍳", "🥗", "🍛", "🌶️", "🥬"];

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return Boolean(url && key && !url.includes("your-project") && !key.includes("your-anon"));
}

export function profileStorageKey(profileId: string, suffix: string): string {
  return `fc6-${profileId}-${suffix}`;
}

export function profileSuffixes(): string[] {
  return ["prefs", "sel", "hist", "cook", "onboarded", "openai_api_key"];
}

function readRegistry(): UserProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    return raw ? (JSON.parse(raw) as UserProfile[]) : [];
  } catch {
    return [];
  }
}

function writeRegistry(profiles: UserProfile[]) {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(profiles));
}

export function getActiveProfileId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveProfileId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function clearActiveProfileId() {
  localStorage.removeItem(ACTIVE_KEY);
}

export function listProfiles(): UserProfile[] {
  return readRegistry();
}

export function getProfile(id: string): UserProfile | undefined {
  return readRegistry().find((p) => p.id === id);
}

export function saveProfile(profile: UserProfile) {
  const profiles = readRegistry();
  const idx = profiles.findIndex((p) => p.id === profile.id);
  if (idx >= 0) profiles[idx] = profile;
  else profiles.push(profile);
  writeRegistry(profiles);
}

export function removeProfile(id: string) {
  const profiles = readRegistry().filter((p) => p.id !== id);
  writeRegistry(profiles);
  profileSuffixes().forEach((suffix) => {
    localStorage.removeItem(profileStorageKey(id, suffix));
  });
}

export function createProfileId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createLocalProfile(name: string): UserProfile {
  const profiles = readRegistry();
  const profile: UserProfile = {
    id: createProfileId(),
    name: name.trim(),
    kind: "local",
    emoji: PROFILE_EMOJIS[profiles.length % PROFILE_EMOJIS.length],
    createdAt: Date.now(),
    onboarded: false,
  };
  saveProfile(profile);
  return profile;
}

export function createAccountProfile(input: {
  name: string;
  email: string;
  authUserId: string;
}): UserProfile {
  const existing = readRegistry().find((p) => p.authUserId === input.authUserId);
  if (existing) {
    const updated = { ...existing, name: input.name.trim() || existing.name, email: input.email };
    saveProfile(updated);
    return updated;
  }

  const profiles = readRegistry();
  const profile: UserProfile = {
    id: createProfileId(),
    name: input.name.trim() || input.email.split("@")[0],
    email: input.email,
    authUserId: input.authUserId,
    kind: "account",
    emoji: PROFILE_EMOJIS[profiles.length % PROFILE_EMOJIS.length],
    createdAt: Date.now(),
    onboarded: false,
  };
  saveProfile(profile);
  return profile;
}

/** Move legacy fc5-* keys into the first profile so existing users keep their data. */
export function migrateLegacyStorage(profileId: string) {
  const legacyMap: Record<string, string> = {
    "fc5-prefs": "prefs",
    "fc5-sel": "sel",
    "fc5-hist": "hist",
    "fc5-cook": "cook",
    "fc5-onboarded": "onboarded",
  };

  for (const [legacyKey, suffix] of Object.entries(legacyMap)) {
    const value = localStorage.getItem(legacyKey);
    const scopedKey = profileStorageKey(profileId, suffix);
    if (value && !localStorage.getItem(scopedKey)) {
      localStorage.setItem(scopedKey, value);
    }
    localStorage.removeItem(legacyKey);
  }

  const apiKey = localStorage.getItem("openai_api_key");
  const scopedApiKey = profileStorageKey(profileId, "openai_api_key");
  if (apiKey && !localStorage.getItem(scopedApiKey)) {
    localStorage.setItem(scopedApiKey, apiKey);
  }
}

export function clearLegacyStorageKeys() {
  if (typeof window === "undefined") return;
  [
    "fc5-prefs",
    "fc5-sel",
    "fc5-hist",
    "fc5-cook",
    "fc5-onboarded",
    "openai_api_key",
    "fridgechef.cookVoiceLang",
  ].forEach((key) => localStorage.removeItem(key));
}

export function eraseAllProfileStorage(profileId: string) {
  clearProfileData(profileId);
  clearLegacyStorageKeys();
  if (typeof window === "undefined") return;
  const prefix = `fc6-${profileId}-`;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) localStorage.removeItem(key);
  }
}

/** Write a clean storage snapshot after in-memory state has been reset. */
export function writeProfileStorageSnapshot(
  profileId: string,
  snapshot: {
    prefs: unknown;
    selected: number[];
    history: unknown[];
    cook: number[];
    onboarded?: boolean;
  },
) {
  localStorage.setItem(profileStorageKey(profileId, "prefs"), JSON.stringify(snapshot.prefs));
  localStorage.setItem(profileStorageKey(profileId, "sel"), JSON.stringify(snapshot.selected));
  localStorage.setItem(profileStorageKey(profileId, "hist"), JSON.stringify(snapshot.history));
  localStorage.setItem(profileStorageKey(profileId, "cook"), JSON.stringify(snapshot.cook));
  if (snapshot.onboarded) {
    localStorage.setItem(profileStorageKey(profileId, "onboarded"), "true");
  } else {
    localStorage.removeItem(profileStorageKey(profileId, "onboarded"));
  }
  localStorage.removeItem(profileStorageKey(profileId, "openai_api_key"));
}

export function activateFallbackProfile(): UserProfile {
  const remaining = listProfiles();
  if (remaining.length > 0) {
    setActiveProfileId(remaining[0].id);
    return remaining[0];
  }
  const profile = createLocalProfile("Me");
  setActiveProfileId(profile.id);
  return profile;
}
