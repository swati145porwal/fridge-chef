"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* Design Tokens (CSS Variables) */
const T = {
  bg: "var(--fc-bg)",
  surface: "var(--fc-surface)",
  card: "var(--fc-card)",
  card2: "var(--fc-card2)",
  border: "var(--fc-border)",
  border2: "var(--fc-border2)",
  text: "var(--fc-text)",
  textSub: "var(--fc-text-sub)",
  textMut: "var(--fc-text-mut)",
  accent: "var(--fc-accent)",
  gold: "var(--fc-gold)",
  teal: "var(--fc-teal)",
  tealBg: "var(--fc-teal-bg)",
};

const ONBOARDING_STEPS = [
  {
    id: "welcome",
    title: "Welcome to FridgeChef",
    subtitle: "Your personal Indian recipe companion",
    icon: "🍛",
    description: "Discover delicious recipes based on what's in your fridge. Let's personalize your experience.",
  },
  {
    id: "name",
    title: "What's your name?",
    subtitle: "We'll greet you personally every day",
    icon: "👋",
    isName: true,
    optional: true,
  },
  {
    id: "diet",
    title: "Dietary Preference",
    subtitle: "What type of food do you eat?",
    icon: "🥗",
    options: [
      { id: "veg", label: "Vegetarian", icon: "🥬" },
      { id: "vegan", label: "Vegan", icon: "🌱" },
      { id: "jain", label: "Jain", icon: "🙏" },
      { id: "egget", label: "Eggetarian", icon: "🥚" },
      { id: "nonveg", label: "Non-Veg", icon: "🍗" },
    ],
    single: true,
  },
  {
    id: "allergies",
    title: "Allergies",
    subtitle: "Anything we should avoid?",
    icon: "⚠️",
    options: [
      { id: "dairy", label: "Dairy", icon: "🥛" },
      { id: "gluten", label: "Gluten", icon: "🌾" },
      { id: "nuts", label: "Tree Nuts", icon: "🥜" },
      { id: "peanuts", label: "Peanuts", icon: "🥜" },
      { id: "eggs", label: "Eggs", icon: "🥚" },
      { id: "soy", label: "Soy", icon: "🫘" },
      { id: "shellfish", label: "Shellfish", icon: "🦐" },
      { id: "fish", label: "Fish", icon: "🐟" },
    ],
    single: false,
    optional: true,
  },
  {
    id: "cuisine",
    title: "Favorite Cuisines",
    subtitle: "What flavors do you love?",
    icon: "🌶️",
    options: [
      { id: "north", label: "North Indian", icon: "🫓" },
      { id: "punjabi", label: "Punjabi", icon: "🍛" },
      { id: "south", label: "South Indian", icon: "🥞" },
      { id: "maharashtra", label: "Maharashtrian", icon: "🍲" },
      { id: "gujarati", label: "Gujarati", icon: "🥘" },
      { id: "bengali", label: "Bengali", icon: "🐟" },
      { id: "mughlai", label: "Mughlai", icon: "🍖" },
      { id: "hyderabadi", label: "Hyderabadi", icon: "🍚" },
    ],
    single: false,
  },
  {
    id: "spice",
    title: "Spice Tolerance",
    subtitle: "How spicy do you like it?",
    icon: "🔥",
    options: [
      { id: "mild", label: "Mild", icon: "🌿", desc: "Gentle flavors" },
      { id: "medium", label: "Medium", icon: "🌶️", desc: "Balanced heat" },
      { id: "spicy", label: "Spicy", icon: "🔥", desc: "Bring the heat" },
      { id: "xspicy", label: "Extra Spicy", icon: "💀", desc: "Fire lover" },
    ],
    single: true,
  },
];

interface OnboardingProps {
  onComplete: (prefs: {
    diet: string[];
    cuisine: string[];
    allergies: string[];
    spice: string[];
    name: string;
  }) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [selections, setSelections] = useState<Record<string, string[]>>({
    diet: ["veg"],
    allergies: [],
    cuisine: ["north", "punjabi"],
    spice: ["medium"],
  });

  const currentStep = ONBOARDING_STEPS[step];
  const isLastStep = step === ONBOARDING_STEPS.length - 1;
  const isFirstStep = step === 0;

  const toggleOption = (stepId: string, optionId: string, single: boolean) => {
    setSelections((prev) => {
      const current = prev[stepId] || [];
      if (single) {
        return { ...prev, [stepId]: [optionId] };
      }
      if (current.includes(optionId)) {
        return { ...prev, [stepId]: current.filter((id) => id !== optionId) };
      }
      return { ...prev, [stepId]: [...current, optionId] };
    });
  };

  const canProceed = () => {
    if (currentStep.id === "welcome") return true;
    if (currentStep.optional) return true;
    if ((currentStep as typeof currentStep & { isName?: boolean }).isName) return true;
    const selected = selections[currentStep.id] || [];
    return selected.length > 0;
  };

  const handleNext = () => {
    if (isLastStep) {
      onComplete({
        diet: selections.diet || ["veg"],
        cuisine: selections.cuisine || ["north"],
        allergies: selections.allergies || [],
        spice: selections.spice || ["medium"],
        name: name.trim(),
      });
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setStep((s) => s - 1);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: T.bg,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-dm-sans), sans-serif",
      }}
    >
      {/* Progress bar — pushed below status bar on notch phones */}
      <div style={{ padding: "calc(16px + env(safe-area-inset-top, 0px)) 20px 0" }}>
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 8,
          }}
        >
          {ONBOARDING_STEPS.map((_, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: idx <= step ? T.accent : T.border,
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>
        <p style={{ color: T.textSub, fontSize: 11, textAlign: "right" }}>
          {step + 1} of {ONBOARDING_STEPS.length}
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                style={{
                  fontSize: 64,
                  marginBottom: 16,
                  filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
                }}
              >
                {currentStep.icon}
              </motion.div>
              <h1
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontSize: 28,
                  fontWeight: 700,
                  color: T.text,
                  marginBottom: 8,
                }}
              >
                {currentStep.title}
              </h1>
              <p style={{ color: T.textSub, fontSize: 14 }}>
                {currentStep.subtitle}
              </p>
            </div>

            {/* Description for welcome screen */}
            {currentStep.description && (
              <div
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <p style={{ color: T.text, fontSize: 14, lineHeight: 1.7 }}>
                  {currentStep.description}
                </p>
              </div>
            )}

            {/* Name input */}
            {(currentStep as typeof currentStep & { isName?: boolean }).isName && (
              <div style={{ marginBottom: 8 }}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your first name..."
                  autoFocus
                  autoComplete="given-name"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: `2px solid ${name ? T.accent : T.border}`,
                    fontSize: 18,
                    outline: "none",
                    background: T.card,
                    color: T.text,
                    fontFamily: "inherit",
                    textAlign: "center",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                />
                {name && (
                  <p style={{ color: T.accent, fontSize: 14, textAlign: "center", marginTop: 12 }}>
                    Nice to meet you, {name}! 👋
                  </p>
                )}
              </div>
            )}

            {/* Options */}
            {currentStep.options && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: currentStep.single && currentStep.options.length <= 5 ? "1fr" : "1fr 1fr",
                  gap: 10,
                }}
              >
                {currentStep.options.map((option, idx) => {
                  const isSelected = (selections[currentStep.id] || []).includes(option.id);
                  return (
                    <motion.button
                      key={option.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => toggleOption(currentStep.id, option.id, currentStep.single || false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "14px 16px",
                        background: isSelected ? `${T.accent}15` : T.card,
                        border: `2px solid ${isSelected ? T.accent : T.border}`,
                        borderRadius: 12,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        textAlign: "left",
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ fontSize: 24 }}>{option.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            color: isSelected ? T.accent : T.text,
                            fontSize: 14,
                            fontWeight: isSelected ? 600 : 500,
                            margin: 0,
                          }}
                        >
                          {option.label}
                        </p>
                        {"desc" in option && option.desc && (
                          <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>
                            {option.desc}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: T.accent,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {currentStep.optional && (
              <p style={{ color: T.textSub, fontSize: 12, textAlign: "center", marginTop: 16 }}>
                Optional - skip if none apply
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons — clear of iOS home indicator */}
      <div
        style={{
          paddingTop: 16,
          paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
          paddingLeft: 20,
          paddingRight: 20,
          display: "flex",
          gap: 12,
          borderTop: `1px solid ${T.border}`,
          background: T.bg,
        }}
      >
        {!isFirstStep && (
          <button
            onClick={handleBack}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: 10,
              border: `1px solid ${T.border2}`,
              background: "transparent",
              color: T.textSub,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!canProceed()}
          style={{
            flex: isFirstStep ? 1 : 2,
            padding: "14px",
            borderRadius: 10,
            border: "none",
            background: canProceed() ? T.accent : T.card2,
            color: canProceed() ? "#fff" : T.textSub,
            fontSize: 14,
            fontWeight: 600,
            cursor: canProceed() ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            transition: "all 0.15s",
          }}
        >
          {isLastStep ? "Get Started" : isFirstStep ? "Let's Go" : "Continue"}
        </button>
      </div>
    </div>
  );
}
