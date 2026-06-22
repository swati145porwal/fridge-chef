"use client";

import { useState, useEffect } from "react";
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
  gold: "#c89020",
  teal: "#28a892",
  tealBg: "#071814",
};

interface Recipe {
  id: number;
  name: string;
  cal: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

interface NutritionLog {
  id: string;
  recipe_id: number;
  meal_type: string;
  servings: number;
  date: string;
}

interface DayPlan {
  breakfast: Recipe | null;
  lunch: Recipe | null;
  dinner: Recipe | null;
}

interface NutritionTrackerProps {
  plan: DayPlan[];
  onBack: () => void;
}

// Daily recommended values
const DAILY_TARGETS = {
  calories: 2000,
  protein: 50, // grams
  carbs: 250, // grams
  fat: 65, // grams
  fiber: 25, // grams
};

export function NutritionTrackerScreen({ plan, onBack }: NutritionTrackerProps) {
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogMeal, setShowLogMeal] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  async function loadData() {
    const deviceId = getDeviceId();
    if (!deviceId) return;

    setIsLoading(true);

    // Fetch logs for the selected date
    const { data: logsData } = await supabase
      .from("nutrition_logs")
      .select("*")
      .eq("device_id", deviceId)
      .eq("date", selectedDate);

    // Fetch all recipes for reference
    const { data: recipesData } = await supabase
      .from("recipes")
      .select("id, name, cal, protein, carbs, fat, fiber");

    setLogs(logsData || []);
    setRecipes(recipesData || []);
    setIsLoading(false);
  }

  async function logMeal(recipeId: number, mealType: string, servings: number = 1) {
    const deviceId = getDeviceId();
    if (!deviceId) return;

    const { error } = await supabase.from("nutrition_logs").upsert(
      {
        device_id: deviceId,
        recipe_id: recipeId,
        meal_type: mealType,
        servings,
        date: selectedDate,
      },
      { onConflict: "device_id,date,recipe_id,meal_type" }
    );

    if (!error) {
      loadData();
      setShowLogMeal(false);
    }
  }

  async function removeMeal(logId: string) {
    await supabase.from("nutrition_logs").delete().eq("id", logId);
    loadData();
  }

  // Calculate totals for the day
  const dailyTotals = logs.reduce(
    (acc, log) => {
      const recipe = recipes.find((r) => r.id === log.recipe_id);
      if (!recipe) return acc;

      const multiplier = log.servings || 1;
      return {
        calories: acc.calories + (recipe.cal || 0) * multiplier,
        protein: acc.protein + (recipe.protein || 0) * multiplier,
        carbs: acc.carbs + (recipe.carbs || 0) * multiplier,
        fat: acc.fat + (recipe.fat || 0) * multiplier,
        fiber: acc.fiber + (recipe.fiber || 0) * multiplier,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  // Group logs by meal type
  const mealGroups = logs.reduce((acc, log) => {
    if (!acc[log.meal_type]) acc[log.meal_type] = [];
    acc[log.meal_type].push(log);
    return acc;
  }, {} as Record<string, NutritionLog[]>);

  // Date navigation
  const goToDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  // Progress bar component
  const ProgressBar = ({
    value,
    max,
    color,
    label,
    unit,
  }: {
    value: number;
    max: number;
    color: string;
    label: string;
    unit: string;
  }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const isOver = value > max;

    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ color: T.textSub, fontSize: 11, fontWeight: 500 }}>{label}</span>
          <span style={{ color: isOver ? T.accent : T.text, fontSize: 11, fontWeight: 600 }}>
            {Math.round(value)} / {max} {unit}
          </span>
        </div>
        <div
          style={{
            height: 6,
            background: T.card2,
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${percentage}%`,
              background: isOver ? T.accent : color,
              borderRadius: 3,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="fa">
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: T.textSub,
          fontSize: 12,
          cursor: "pointer",
          padding: "0 0 12px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "inherit",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15,18 9,12 15,6" />
        </svg>
        Back
      </button>

      {/* Date Selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <button
          onClick={() => goToDate(-1)}
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            padding: "8px 12px",
            color: T.text,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>

        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: 20,
              fontWeight: 700,
              color: T.text,
            }}
          >
            {isToday
              ? "Today"
              : new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long" })}
          </p>
          <p style={{ color: T.textSub, fontSize: 12 }}>
            {new Date(selectedDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <button
          onClick={() => goToDate(1)}
          disabled={isToday}
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            padding: "8px 12px",
            color: isToday ? T.textMut : T.text,
            cursor: isToday ? "not-allowed" : "pointer",
            opacity: isToday ? 0.5 : 1,
            fontFamily: "inherit",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </button>
      </div>

      {/* Daily Summary */}
      <div
        style={{
          background: T.card,
          borderRadius: 8,
          padding: "1.25rem",
          border: `1px solid ${T.border}`,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <p
              style={{
                color: T.textSub,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Daily Summary
            </p>
            <p
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontSize: 36,
                fontWeight: 700,
                color: dailyTotals.calories > DAILY_TARGETS.calories ? T.accent : T.text,
                lineHeight: 1,
                marginTop: 4,
              }}
            >
              {Math.round(dailyTotals.calories)}
            </p>
            <p style={{ color: T.textSub, fontSize: 12, marginTop: 2 }}>
              of {DAILY_TARGETS.calories} kcal
            </p>
          </div>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: `conic-gradient(${T.accent} ${(dailyTotals.calories / DAILY_TARGETS.calories) * 360}deg, ${T.card2} 0deg)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: T.card,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: T.text, fontSize: 14, fontWeight: 600 }}>
                {Math.min(Math.round((dailyTotals.calories / DAILY_TARGETS.calories) * 100), 999)}%
              </span>
            </div>
          </div>
        </div>

        <ProgressBar
          value={dailyTotals.protein}
          max={DAILY_TARGETS.protein}
          color={T.teal}
          label="Protein"
          unit="g"
        />
        <ProgressBar
          value={dailyTotals.carbs}
          max={DAILY_TARGETS.carbs}
          color={T.gold}
          label="Carbs"
          unit="g"
        />
        <ProgressBar
          value={dailyTotals.fat}
          max={DAILY_TARGETS.fat}
          color="#e879f9"
          label="Fat"
          unit="g"
        />
        <ProgressBar
          value={dailyTotals.fiber}
          max={DAILY_TARGETS.fiber}
          color="#4ade80"
          label="Fiber"
          unit="g"
        />
      </div>

      {/* Log Meal Button */}
      <button
        onClick={() => setShowLogMeal(true)}
        style={{
          width: "100%",
          background: T.accent,
          border: "none",
          borderRadius: 6,
          padding: "12px 16px",
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Log a Meal
      </button>

      {/* Meals Logged */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: T.textSub, fontSize: 13 }}>Loading...</p>
        </div>
      ) : logs.length === 0 ? (
        <div
          style={{
            background: T.card,
            borderRadius: 8,
            padding: "2rem",
            border: `1px solid ${T.border}`,
            textAlign: "center",
          }}
        >
          <p style={{ color: T.text, fontSize: 14, marginBottom: 4 }}>No meals logged</p>
          <p style={{ color: T.textSub, fontSize: 12 }}>
            Tap &quot;Log a Meal&quot; to start tracking your nutrition
          </p>
        </div>
      ) : (
        ["Breakfast", "Lunch", "Dinner", "Snack"].map((mealType) => {
          const mealsInGroup = mealGroups[mealType];
          if (!mealsInGroup || mealsInGroup.length === 0) return null;

          return (
            <div key={mealType} style={{ marginBottom: 12 }}>
              <p
                style={{
                  color: T.textSub,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                {mealType}
              </p>
              {mealsInGroup.map((log) => {
                const recipe = recipes.find((r) => r.id === log.recipe_id);
                if (!recipe) return null;

                return (
                  <div
                    key={log.id}
                    style={{
                      background: T.card,
                      borderRadius: 6,
                      padding: "10px 12px",
                      marginBottom: 4,
                      border: `1px solid ${T.border}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ color: T.text, fontSize: 13, fontWeight: 500 }}>{recipe.name}</p>
                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <span style={{ color: T.accent, fontSize: 11 }}>{recipe.cal} kcal</span>
                        {recipe.protein && (
                          <span style={{ color: T.teal, fontSize: 11 }}>{recipe.protein}g P</span>
                        )}
                        {log.servings !== 1 && (
                          <span style={{ color: T.textMut, fontSize: 11 }}>x{log.servings}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeMeal(log.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: T.textMut,
                        cursor: "pointer",
                        padding: 4,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })
      )}

      {/* Log Meal Modal */}
      {showLogMeal && (
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
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onClick={() => setShowLogMeal(false)}
        >
          <div
            style={{
              background: T.card,
              borderRadius: "16px 16px 0 0",
              padding: "1.5rem",
              width: "100%",
              maxWidth: 480,
              maxHeight: "70vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: T.text,
                }}
              >
                Log a Meal
              </h3>
              <button
                onClick={() => setShowLogMeal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: T.textSub,
                  fontSize: 20,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {/* Quick add from today's plan */}
            {plan && (
              <div style={{ marginBottom: 16 }}>
                <p
                  style={{
                    color: T.textSub,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  {"From Today's Plan"}
                </p>
                {(["breakfast", "lunch", "dinner"] as const).map((mealKey) => {
                  const todayIdx = (new Date().getDay() + 6) % 7;
                  const recipe = plan[todayIdx]?.[mealKey];
                  if (!recipe) return null;

                  return (
                    <button
                      key={mealKey}
                      onClick={() => logMeal(recipe.id, mealKey.charAt(0).toUpperCase() + mealKey.slice(1))}
                      style={{
                        width: "100%",
                        background: T.tealBg,
                        border: `1px solid ${T.teal}30`,
                        borderRadius: 6,
                        padding: "10px 12px",
                        marginBottom: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      <div style={{ textAlign: "left" }}>
                        <p style={{ color: T.teal, fontSize: 9, textTransform: "uppercase", marginBottom: 2 }}>
                          {mealKey}
                        </p>
                        <p style={{ color: T.text, fontSize: 13 }}>{recipe.name}</p>
                      </div>
                      <span style={{ color: T.teal, fontSize: 12 }}>+ Add</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* All recipes */}
            <p
              style={{
                color: T.textSub,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              All Recipes
            </p>
            <div style={{ maxHeight: 300, overflow: "auto" }}>
              {recipes.slice(0, 20).map((recipe) => (
                <div
                  key={recipe.id}
                  style={{
                    background: T.card2,
                    borderRadius: 6,
                    padding: "10px 12px",
                    marginBottom: 4,
                    border: `1px solid ${T.border2}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ color: T.text, fontSize: 13 }}>{recipe.name}</p>
                      <p style={{ color: T.textSub, fontSize: 11, marginTop: 2 }}>
                        {recipe.cal} kcal
                        {recipe.protein ? ` · ${recipe.protein}g protein` : ""}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {["Breakfast", "Lunch", "Dinner", "Snack"].map((meal) => (
                        <button
                          key={meal}
                          onClick={() => logMeal(recipe.id, meal)}
                          style={{
                            background: T.surface,
                            border: `1px solid ${T.border}`,
                            borderRadius: 4,
                            padding: "4px 8px",
                            color: T.textSub,
                            fontSize: 10,
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          {meal.charAt(0)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
