"use client";

import Link from "next/link";

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
};

const DAY_COLORS = [
  "#e05a18", // Mon - Orange
  "#c89020", // Tue - Gold
  "#28a892", // Wed - Teal
  "#8a7060", // Thu - Muted
  "#e05a18", // Fri - Orange
  "#c89020", // Sat - Gold
  "#28a892", // Sun - Teal
];

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Recipe {
  id: number;
  name: string;
  time: string;
  cal: number;
  description?: string;
  health?: string[];
}

interface MealPlanData {
  [day: string]: {
    breakfast?: Recipe | null;
    lunch?: Recipe | null;
    dinner?: Recipe | null;
  };
}

interface SharedPlan {
  id: string;
  slug: string;
  title: string | null;
  plan: MealPlanData;
  views: number;
  created_at: string;
}

interface SharedPlanViewProps {
  plan: SharedPlan;
}

export function SharedPlanView({ plan }: SharedPlanViewProps) {
  const days = DAY_NAMES.map((name, idx) => ({
    name,
    short: DAY_SHORT[idx],
    color: DAY_COLORS[idx],
    meals: plan.plan[name] || {},
  }));

  const totalMeals = days.reduce((acc, d) => {
    return acc + (d.meals.breakfast ? 1 : 0) + (d.meals.lunch ? 1 : 0) + (d.meals.dinner ? 1 : 0);
  }, 0);

  const totalCalories = days.reduce((acc, d) => {
    return (
      acc +
      (d.meals.breakfast?.cal || 0) +
      (d.meals.lunch?.cal || 0) +
      (d.meals.dinner?.cal || 0)
    );
  }, 0);

  return (
    <div
      style={{
        fontFamily: "var(--font-dm-sans), sans-serif",
        maxWidth: 480,
        margin: "0 auto",
        minHeight: "100vh",
        background: T.bg,
        paddingBottom: 80,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "13px 16px 10px",
          borderBottom: `1px solid ${T.border}`,
          background: T.bg,
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: 17,
            fontWeight: 700,
            color: T.text,
          }}
        >
          FridgeChef<span style={{ color: T.accent }}> India</span>
        </span>
      </div>

      <div style={{ padding: 16 }}>
        {/* Title Section */}
        <div
          style={{
            background: T.card,
            borderRadius: 8,
            padding: "1.25rem",
            border: `1px solid ${T.border}`,
            marginBottom: 16,
            borderLeft: `3px solid ${T.accent}`,
          }}
        >
          <p
            style={{
              color: T.textSub,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Shared Meal Plan
          </p>
          <h1
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: 26,
              fontWeight: 700,
              color: T.text,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {plan.title || "Weekly Meal Plan"}
          </h1>
          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <div
              style={{
                background: T.card2,
                borderRadius: 5,
                padding: "6px 10px",
                border: `1px solid ${T.border2}`,
                textAlign: "center",
              }}
            >
              <p style={{ color: T.textSub, fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
                Meals
              </p>
              <p style={{ color: T.text, fontSize: 14, fontWeight: 600, marginTop: 1 }}>{totalMeals}</p>
            </div>
            <div
              style={{
                background: T.card2,
                borderRadius: 5,
                padding: "6px 10px",
                border: `1px solid ${T.border2}`,
                textAlign: "center",
              }}
            >
              <p style={{ color: T.textSub, fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
                Avg/Day
              </p>
              <p style={{ color: T.accent, fontSize: 14, fontWeight: 600, marginTop: 1 }}>
                ~{Math.round(totalCalories / 7)} kcal
              </p>
            </div>
            <div
              style={{
                background: T.card2,
                borderRadius: 5,
                padding: "6px 10px",
                border: `1px solid ${T.border2}`,
                textAlign: "center",
              }}
            >
              <p style={{ color: T.textSub, fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
                Views
              </p>
              <p style={{ color: T.teal, fontSize: 14, fontWeight: 600, marginTop: 1 }}>{plan.views}</p>
            </div>
          </div>
        </div>

        {/* Days */}
        {days.map((day, idx) => {
          const hasMeals = day.meals.breakfast || day.meals.lunch || day.meals.dinner;
          if (!hasMeals) return null;

          return (
            <div
              key={idx}
              style={{
                background: T.card,
                borderRadius: 8,
                padding: "1rem",
                border: `1px solid ${T.border}`,
                marginBottom: 10,
                borderLeft: `3px solid ${day.color}`,
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: day.color,
                  marginBottom: 10,
                }}
              >
                {day.name}
              </p>

              {["breakfast", "lunch", "dinner"].map((mealType) => {
                const meal = day.meals[mealType as keyof typeof day.meals];
                if (!meal) return null;

                return (
                  <div
                    key={mealType}
                    style={{
                      background: T.card2,
                      borderRadius: 6,
                      padding: "10px 12px",
                      marginBottom: 6,
                      border: `1px solid ${T.border2}`,
                    }}
                  >
                    <p
                      style={{
                        color: T.textSub,
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      {mealType}
                    </p>
                    <p style={{ color: T.text, fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                      {meal.name}
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span
                        style={{
                          background: T.surface,
                          color: T.textSub,
                          fontSize: 10,
                          padding: "3px 8px",
                          borderRadius: 4,
                          border: `1px solid ${T.border}`,
                        }}
                      >
                        {meal.time}
                      </span>
                      <span
                        style={{
                          background: `${T.accent}15`,
                          color: T.accent,
                          fontSize: 10,
                          padding: "3px 8px",
                          borderRadius: 4,
                          border: `1px solid ${T.accent}25`,
                        }}
                      >
                        {meal.cal} kcal
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* CTA */}
        <div
          style={{
            background: T.card,
            borderRadius: 8,
            padding: "1.5rem",
            border: `1px solid ${T.border}`,
            textAlign: "center",
            marginTop: 20,
          }}
        >
          <p style={{ color: T.text, fontSize: 14, marginBottom: 4 }}>Want to create your own meal plan?</p>
          <p style={{ color: T.textSub, fontSize: 12, marginBottom: 16 }}>
            Based on your fridge ingredients and dietary preferences
          </p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              background: T.accent,
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Try FridgeChef India
          </Link>
        </div>
      </div>
    </div>
  );
}
