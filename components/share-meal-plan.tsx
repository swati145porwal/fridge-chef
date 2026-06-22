"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getDeviceId } from "@/hooks/use-device-id";

const T = {
  bg: "#0d0a07",
  surface: "#151009",
  card: "#1e1810",
  card2: "#261e14",
  border: "#332618",
  border2: "#403220",
  text: "#f4ede2",
  textSub: "#8a7060",
  textMut: "#3d3020",
  accent: "#e05a18",
  teal: "#28a892",
};

interface Recipe {
  id: number;
  name: string;
  time: string;
  cal: number;
  health: string[];
  [key: string]: unknown;
}

interface DayPlan {
  day: string;
  full: string;
  color: string;
  breakfast: Recipe | null;
  lunch: Recipe | null;
  dinner: Recipe | null;
}

interface Prefs {
  diet: string[];
  cuisine: string[];
  health: string[];
  allergies: string[];
  dislikes: string[];
  [key: string]: unknown;
}

interface ShareMealPlanProps {
  plan: DayPlan[];
  prefs: Prefs;
  onClose: () => void;
}

function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

export function ShareMealPlan({ plan, prefs, onClose }: ShareMealPlanProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState("My Meal Plan");

  const supabase = createClient();

  async function handleShare() {
    const deviceId = getDeviceId();
    if (!deviceId) return;

    setIsSharing(true);

    try {
      const slug = generateSlug();
      
      // Convert plan to storable format
      const planData = plan.reduce((acc, day, idx) => {
        acc[day.full] = {
          breakfast: day.breakfast,
          lunch: day.lunch,
          dinner: day.dinner,
        };
        return acc;
      }, {} as Record<string, unknown>);

      const { error } = await supabase
        .from("shared_meal_plans")
        .insert({
          slug,
          title,
          plan: planData,
          preferences: prefs,
          device_id: deviceId,
        });

      if (error) throw error;

      const url = `${window.location.origin}/share/${slug}`;
      setShareUrl(url);

      // Try native share if available
      if (navigator.share) {
        try {
          await navigator.share({
            title: title,
            text: `Check out my weekly meal plan: ${title}`,
            url: url,
          });
        } catch {
          // User cancelled or not supported
        }
      }
    } catch (error) {
      console.error("Error sharing plan:", error);
    } finally {
      setIsSharing(false);
    }
  }

  async function copyToClipboard() {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const totalMeals = plan.reduce((acc, d) => {
    return acc + (d.breakfast ? 1 : 0) + (d.lunch ? 1 : 0) + (d.dinner ? 1 : 0);
  }, 0);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: T.card,
          borderRadius: 12,
          padding: "1.5rem",
          width: "100%",
          maxWidth: 380,
          border: `1px solid ${T.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <p
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontSize: 22,
                fontWeight: 700,
                color: T.text,
              }}
            >
              Share Meal Plan
            </p>
            <p style={{ color: T.textSub, fontSize: 12, marginTop: 4 }}>
              {totalMeals} meals across 7 days
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: T.textSub,
              fontSize: 20,
              cursor: "pointer",
              padding: 4,
            }}
          >
            ×
          </button>
        </div>

        {!shareUrl ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  color: T.textSub,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Plan Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Meal Plan"
                style={{
                  width: "100%",
                  background: T.surface,
                  border: `1px solid ${T.border2}`,
                  borderRadius: 6,
                  padding: "10px 12px",
                  color: T.text,
                  fontSize: 14,
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div
              style={{
                background: T.surface,
                borderRadius: 6,
                padding: 12,
                marginBottom: 16,
                border: `1px solid ${T.border}`,
              }}
            >
              <p style={{ color: T.textSub, fontSize: 11, marginBottom: 8 }}>Preview:</p>
              {plan.slice(0, 3).map((d, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <span style={{ color: d.color, fontSize: 11, fontWeight: 600 }}>{d.day}</span>
                  <span style={{ color: T.textMut, fontSize: 11, margin: "0 6px" }}>—</span>
                  <span style={{ color: T.text, fontSize: 11 }}>
                    {[d.breakfast?.name, d.lunch?.name, d.dinner?.name].filter(Boolean).join(" / ")}
                  </span>
                </div>
              ))}
              <p style={{ color: T.textMut, fontSize: 10, marginTop: 8 }}>...and 4 more days</p>
            </div>

            <button
              onClick={handleShare}
              disabled={isSharing}
              style={{
                width: "100%",
                background: T.accent,
                border: "none",
                borderRadius: 6,
                padding: "12px 16px",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: isSharing ? "not-allowed" : "pointer",
                opacity: isSharing ? 0.7 : 1,
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {isSharing ? (
                "Creating link..."
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  Create Share Link
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <div
              style={{
                background: "#0a180a",
                borderRadius: 6,
                padding: 16,
                marginBottom: 16,
                border: "1px solid #1a3d1a33",
                textAlign: "center",
              }}
            >
              <p style={{ color: "#4ade80", fontSize: 14, marginBottom: 4 }}>Link created!</p>
              <p style={{ color: "#9de8be", fontSize: 11 }}>Anyone with this link can view your meal plan</p>
            </div>

            <div
              style={{
                background: T.surface,
                borderRadius: 6,
                padding: "10px 12px",
                marginBottom: 12,
                border: `1px solid ${T.border}`,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <input
                type="text"
                value={shareUrl}
                readOnly
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  color: T.text,
                  fontSize: 12,
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={copyToClipboard}
                style={{
                  flex: 1,
                  background: copied ? "#0a180a" : T.card2,
                  border: `1px solid ${copied ? "#1a3d1a33" : T.border2}`,
                  borderRadius: 6,
                  padding: "10px 16px",
                  color: copied ? "#4ade80" : T.text,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
              
              {navigator.share && (
                <button
                  onClick={() => navigator.share({ title, text: `Check out my meal plan`, url: shareUrl })}
                  style={{
                    flex: 1,
                    background: T.accent,
                    border: "none",
                    borderRadius: 6,
                    padding: "10px 16px",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Share
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
