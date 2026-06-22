"use client";

import { useState } from "react";
import { useProfile } from "@/components/profile-provider";

const T = {
  bg: "var(--fc-bg)",
  card: "var(--fc-card)",
  card2: "var(--fc-card2)",
  border: "var(--fc-border)",
  text: "var(--fc-text)",
  textSub: "var(--fc-text-sub)",
  textMut: "var(--fc-text-mut)",
  accent: "var(--fc-accent)",
};

type Mode = "pick" | "local" | "login" | "signup";

export function ProfileAuthGate({ children }: { children: React.ReactNode }) {
  const { activeProfile, ready } = useProfile();
  const [mode, setMode] = useState<Mode>("pick");

  if (!ready) {
    return (
      <div style={{ minHeight: "100dvh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🍛</div>
          <p style={{ color: T.textSub, fontSize: 14 }}>Loading profiles…</p>
        </div>
      </div>
    );
  }

  if (!activeProfile) {
    return <ProfileAuthScreen mode={mode} setMode={setMode} />;
  }

  return <>{children}</>;
}

function ProfileAuthScreen({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const {
    profiles,
    switchProfile,
    createLocalProfileAndActivate,
    signInWithEmail,
    signUpWithEmail,
    supabaseEnabled,
  } = useProfile();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: T.card2,
    border: `1.5px solid ${T.border}`,
    borderRadius: 12,
    padding: "14px 16px",
    color: T.text,
    fontSize: 15,
    fontFamily: "inherit",
    marginBottom: 10,
  };

  const btnPrimary: React.CSSProperties = {
    width: "100%",
    background: `linear-gradient(135deg, ${T.accent}, #78350f)`,
    color: "#fff",
    border: "none",
    borderRadius: 14,
    padding: "15px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    marginTop: 4,
  };

  const btnGhost: React.CSSProperties = {
    width: "100%",
    background: T.card,
    color: T.text,
    border: `1.5px solid ${T.border}`,
    borderRadius: 14,
    padding: "14px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    marginTop: 8,
  };

  async function handleLocalCreate() {
    if (!name.trim()) {
      setError("Please enter a name.");
      return;
    }
    createLocalProfileAndActivate(name.trim());
  }

  async function handleLogin() {
    setLoading(true);
    setError("");
    const result = await signInWithEmail(email.trim(), password);
    setLoading(false);
    if (result.error) setError(result.error);
  }

  async function handleSignup() {
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await signUpWithEmail(name.trim(), email.trim(), password);
    setLoading(false);
    if (result.error) setError(result.error);
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: T.bg,
        maxWidth: 480,
        margin: "0 auto",
        padding: "calc(24px + env(safe-area-inset-top, 0px)) 20px 32px",
        fontFamily: "var(--font-dm-sans), sans-serif",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>🍛</div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text, fontFamily: "var(--font-cormorant), serif" }}>
          FridgeChef India
        </h1>
        <p style={{ margin: "8px 0 0", color: T.textSub, fontSize: 14 }}>
          {mode === "pick" && "Choose or create a profile"}
          {mode === "local" && "Create a profile on this device"}
          {mode === "login" && "Sign in to your account"}
          {mode === "signup" && "Create a cloud account"}
        </p>
      </div>

      {mode === "pick" && (
        <>
          {profiles.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: T.textMut, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                Your profiles
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => switchProfile(p.id)}
                    className="tap"
                    style={{
                      ...btnGhost,
                      marginTop: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{p.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>{p.name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: T.textSub }}>
                        {p.kind === "account" ? p.email || "Cloud account" : "This device"}
                      </p>
                    </div>
                    <span style={{ color: T.accent, fontSize: 18 }}>→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button className="tap" style={btnPrimary} onClick={() => { setMode("local"); setError(""); }}>
            + New profile on this device
          </button>

          {supabaseEnabled && (
            <>
              <button className="tap" style={btnGhost} onClick={() => { setMode("login"); setError(""); }}>
                Sign in with email
              </button>
              <button className="tap" style={btnGhost} onClick={() => { setMode("signup"); setError(""); }}>
                Create cloud account
              </button>
            </>
          )}
        </>
      )}

      {mode === "local" && (
        <>
          <input
            style={inputStyle}
            placeholder="Your name (e.g. Swati, Cook, Mom)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          {error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 8 }}>{error}</p>}
          <button className="tap" style={btnPrimary} onClick={handleLocalCreate}>
            Continue
          </button>
          <button className="tap" style={btnGhost} onClick={() => setMode("pick")}>
            ← Back
          </button>
        </>
      )}

      {(mode === "login" || mode === "signup") && (
        <>
          {mode === "signup" && (
            <input
              style={inputStyle}
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            style={inputStyle}
            placeholder="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            style={inputStyle}
            placeholder="Password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 8 }}>{error}</p>}
          <button
            className="tap"
            style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
            onClick={mode === "login" ? handleLogin : handleSignup}
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
          <button className="tap" style={btnGhost} onClick={() => setMode("pick")}>
            ← Back
          </button>
        </>
      )}

      <p style={{ color: T.textMut, fontSize: 11, textAlign: "center", marginTop: 24, lineHeight: 1.5 }}>
        Each profile keeps its own diet, history, and grocery list.
        {supabaseEnabled ? " Cloud accounts sync when Supabase is connected." : ""}
      </p>
    </div>
  );
}
