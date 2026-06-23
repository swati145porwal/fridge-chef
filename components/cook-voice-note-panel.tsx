"use client";

import { useEffect, useMemo, useState } from "react";
import {
  COOK_LANGUAGES,
  type CookLangId,
  type CookPlanDay,
  type CookRecipe,
  downloadOrShareCookVoice,
  formatPlanDaySpeech,
  formatRecipeSpeech,
  speakCookLanguage,
} from "@/lib/cook-voice-languages";

const LANG_STORAGE_KEY = "fridgechef.cookVoiceLang";

type CookVoiceNotePanelProps = {
  mode: "recipe" | "plan";
  recipe?: CookRecipe;
  plan?: CookPlanDay;
  filenamePrefix?: string;
};

export function CookVoiceNotePanel({ mode, recipe, plan, filenamePrefix = "cook" }: CookVoiceNotePanelProps) {
  const [langId, setLangId] = useState<CookLangId>("hi");
  const [speaking, setSpeaking] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [hint, setHint] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY) as CookLangId | null;
      if (saved && COOK_LANGUAGES.some((l) => l.id === saved)) setLangId(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const speechText = useMemo(() => {
    if (mode === "recipe" && recipe) return formatRecipeSpeech(recipe, langId);
    if (mode === "plan" && plan) return formatPlanDaySpeech(plan, langId);
    return "";
  }, [mode, recipe, plan, langId]);

  const activeLang = COOK_LANGUAGES.find((l) => l.id === langId)!;

  const pickLang = (id: CookLangId) => {
    setLangId(id);
    setHint("");
    try {
      localStorage.setItem(LANG_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const handlePlay = () => {
    if (!speechText) return;
    setSpeaking(true);
    setHint("");
    const ok = speakCookLanguage(speechText, langId, () => setSpeaking(false));
    if (!ok) {
      setSpeaking(false);
      setHint("Voice not supported — try Download audio.");
    }
  };

  const handleShare = async () => {
    if (!speechText) return;
    setSharing(true);
    setHint("");
    const filename = `${filenamePrefix}-${langId}.mp3`;
    const result = await downloadOrShareCookVoice(speechText, langId, filename);
    setSharing(false);
    if (result === "shared") setHint("Audio shared — attach in WhatsApp if needed.");
    else if (result === "downloaded") setHint("Audio downloaded — send as voice note on WhatsApp.");
    else setHint("Playing on speaker — hold phone near your cook.");
  };

  if (!speechText) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <p style={{ color: "#78716c", fontSize: 11, margin: "0 0 8px", lineHeight: 1.45 }}>
        Voice note for your cook — pick a language, play aloud, or share audio on WhatsApp.
      </p>
      <div className="scroll-x" style={{ display: "flex", gap: 6, marginBottom: 8, paddingBottom: 2 }}>
        {COOK_LANGUAGES.map((lang) => {
          const on = lang.id === langId;
          return (
            <button
              key={lang.id}
              type="button"
              onClick={() => pickLang(lang.id)}
              className="tap"
              style={{
                flexShrink: 0,
                border: on ? "1.5px solid #f59e0b" : "1px solid #e7e5e4",
                background: on ? "#fff7ed" : "#fff",
                color: on ? "#b45309" : "#57534e",
                borderRadius: 999,
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: on ? 700 : 500,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              {lang.native}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={handlePlay}
        disabled={speaking}
        className="tap"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          background: "#1a1208",
          border: "1px solid #f59e0b40",
          borderRadius: 14,
          padding: "13px 16px",
          color: "#fbbf24",
          fontSize: 13,
          fontWeight: 700,
          marginBottom: 6,
          fontFamily: "inherit",
          cursor: speaking ? "wait" : "pointer",
          opacity: speaking ? 0.7 : 1,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
        <span style={{ flex: 1, textAlign: "left" }}>
          {speaking ? "Playing…" : `Play voice note — ${activeLang.native}`}
        </span>
      </button>
      <button
        type="button"
        onClick={handleShare}
        disabled={sharing}
        className="tap"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          background: "#f59e0b18",
          border: "1px solid #f59e0b35",
          borderRadius: 14,
          padding: "11px 16px",
          color: "#d97706",
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "inherit",
          cursor: sharing ? "wait" : "pointer",
          opacity: sharing ? 0.7 : 1,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span style={{ flex: 1, textAlign: "left" }}>
          {sharing ? "Preparing…" : `Download / share ${activeLang.label} audio`}
        </span>
      </button>
      {hint ? (
        <p style={{ color: "#b45309", fontSize: 11, margin: "6px 2px 0", lineHeight: 1.4 }}>{hint}</p>
      ) : null}
    </div>
  );
}
