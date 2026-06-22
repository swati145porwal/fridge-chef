"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getDeviceId } from "@/hooks/use-device-id";

function sendShoppingListToWhatsApp(title: string, items: ShoppingItem[]) {
  const byCategory: Record<string, ShoppingItem[]> = {};
  items.filter((i) => !i.checked).forEach((item) => {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  });

  let msg = `🛒 *${title || "Shopping List"}*\n\n`;
  Object.entries(byCategory).forEach(([cat, its]) => {
    msg += `*${cat}*\n`;
    its.forEach((i) => { msg += `• ${i.name}${i.quantity ? ` — ${i.quantity}` : ""}\n`; });
    msg += "\n";
  });
  msg += `_Sent via FridgeChef India_ 🍛`;
  const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

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
  tealBg: "#071814",
};

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  checked: boolean;
}

interface ShoppingList {
  id: string;
  title: string | null;
  items: ShoppingItem[];
  created_at: string;
  updated_at: string;
}

interface Recipe {
  name: string;
  core: string;
}

interface DayPlan {
  breakfast: Recipe | null;
  lunch: Recipe | null;
  dinner: Recipe | null;
}

interface ShoppingListScreenProps {
  plan?: DayPlan[];
  onBack: () => void;
}

// Common Indian pantry items grouped by category
const CATEGORY_ORDER = [
  "Vegetables",
  "Protein",
  "Dal & Legumes",
  "Dairy",
  "Grains",
  "Spices",
  "Other",
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Extract ingredients from recipe core field
function extractIngredientsFromPlan(plan: DayPlan[]): ShoppingItem[] {
  const ingredientSet = new Map<string, ShoppingItem>();

  plan.forEach((day) => {
    [day.breakfast, day.lunch, day.dinner].forEach((recipe) => {
      if (!recipe) return;

      const ingredients = recipe.core.split(",").map((s) => s.trim());
      ingredients.forEach((ing) => {
        if (!ing) return;
        
        const key = ing.toLowerCase();
        if (!ingredientSet.has(key)) {
          const category = categorizeIngredient(ing);
          ingredientSet.set(key, {
            id: generateId(),
            name: ing,
            category,
            quantity: "",
            checked: false,
          });
        }
      });
    });
  });

  return Array.from(ingredientSet.values()).sort((a, b) => {
    const aIdx = CATEGORY_ORDER.indexOf(a.category);
    const bIdx = CATEGORY_ORDER.indexOf(b.category);
    if (aIdx !== bIdx) return aIdx - bIdx;
    return a.name.localeCompare(b.name);
  });
}

function categorizeIngredient(name: string): string {
  const lower = name.toLowerCase();
  
  // Vegetables
  if (/potato|tomato|onion|cauliflower|spinach|peas|carrot|brinjal|capsicum|mushroom|cabbage|okra|corn|pumpkin|broccoli|cucumber|gourd|beans|radish/.test(lower)) {
    return "Vegetables";
  }
  
  // Protein
  if (/paneer|tofu|chicken|mutton|fish|prawns|egg|soya/.test(lower)) {
    return "Protein";
  }
  
  // Dal & Legumes
  if (/dal|moong|masoor|chana|rajma|chickpea|lentil|legume|urad/.test(lower)) {
    return "Dal & Legumes";
  }
  
  // Dairy
  if (/milk|curd|dahi|butter|ghee|cream|cheese|yogurt|paneer/.test(lower)) {
    return "Dairy";
  }
  
  // Grains
  if (/rice|wheat|flour|atta|besan|semolina|suji|poha|oats|bread|roti|naan|pasta|quinoa/.test(lower)) {
    return "Grains";
  }
  
  // Spices
  if (/ginger|garlic|chilli|chili|cumin|coriander|turmeric|garam|masala|pepper|mustard|curry|tamarind|lemon/.test(lower)) {
    return "Spices";
  }
  
  return "Other";
}

export function ShoppingListScreen({ plan, onBack }: ShoppingListScreenProps) {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateFromPlan, setShowCreateFromPlan] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadLists();
  }, []);

  async function loadLists() {
    const deviceId = getDeviceId();
    if (!deviceId) return;

    setIsLoading(true);
    const { data } = await supabase
      .from("shopping_lists")
      .select("*")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false });

    setLists(data || []);
    setIsLoading(false);
  }

  async function createList(title: string, items: ShoppingItem[]) {
    const deviceId = getDeviceId();
    if (!deviceId) return;

    const { data, error } = await supabase
      .from("shopping_lists")
      .insert({
        device_id: deviceId,
        title,
        items,
        slug: generateId(),
      })
      .select()
      .single();

    if (!error && data) {
      setLists([data, ...lists]);
      setCurrentList(data);
    }
  }

  async function updateList(id: string, items: ShoppingItem[]) {
    const { error } = await supabase
      .from("shopping_lists")
      .update({ items, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      setLists(lists.map((l) => (l.id === id ? { ...l, items } : l)));
      if (currentList?.id === id) {
        setCurrentList({ ...currentList, items });
      }
    }
  }

  async function deleteList(id: string) {
    await supabase.from("shopping_lists").delete().eq("id", id);
    setLists(lists.filter((l) => l.id !== id));
    if (currentList?.id === id) {
      setCurrentList(null);
    }
  }

  function toggleItem(itemId: string) {
    if (!currentList) return;
    const newItems = currentList.items.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    updateList(currentList.id, newItems);
  }

  function addItem() {
    if (!currentList || !newItemName.trim()) return;
    const newItem: ShoppingItem = {
      id: generateId(),
      name: newItemName.trim(),
      category: categorizeIngredient(newItemName.trim()),
      quantity: "",
      checked: false,
    };
    const newItems = [...currentList.items, newItem].sort((a, b) => {
      const aIdx = CATEGORY_ORDER.indexOf(a.category);
      const bIdx = CATEGORY_ORDER.indexOf(b.category);
      if (aIdx !== bIdx) return aIdx - bIdx;
      return a.name.localeCompare(b.name);
    });
    updateList(currentList.id, newItems);
    setNewItemName("");
  }

  function removeItem(itemId: string) {
    if (!currentList) return;
    const newItems = currentList.items.filter((item) => item.id !== itemId);
    updateList(currentList.id, newItems);
  }

  function handleCreateFromPlan() {
    if (!plan) return;
    const items = extractIngredientsFromPlan(plan);
    createList("Weekly Meal Plan Shopping", items);
    setShowCreateFromPlan(false);
  }

  // List Detail View
  if (currentList) {
    const groupedItems = currentList.items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, ShoppingItem[]>);

    const checkedCount = currentList.items.filter((i) => i.checked).length;
    const totalCount = currentList.items.length;

    return (
      <div className="fa">
        <button
          onClick={() => setCurrentList(null)}
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
          Back to Lists
        </button>

        <div style={{ marginBottom: 16 }}>
          <h2
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: 22,
              fontWeight: 700,
              color: T.text,
              marginBottom: 4,
            }}
          >
            {currentList.title || "Shopping List"}
          </h2>
          <p style={{ color: T.textSub, fontSize: 12 }}>
            {checkedCount} of {totalCount} items checked
          </p>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 4,
            background: T.card2,
            borderRadius: 2,
            marginBottom: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%`,
              background: T.teal,
              borderRadius: 2,
              transition: "width 0.3s ease",
            }}
          />
        </div>

        {/* WhatsApp share */}
        <button
          onClick={() => sendShoppingListToWhatsApp(currentList.title || "Shopping List", currentList.items)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            background: "#0a1f10",
            border: "1px solid #25d36630",
            borderRadius: 8,
            padding: "10px 14px",
            color: "#25d366",
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 14,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#25d366">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          <span style={{ flex: 1 }}>Send to Cook via WhatsApp</span>
          <span style={{ fontSize: 11, opacity: 0.5 }}>↗</span>
        </button>

        {/* Add item input */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="Add item..."
            style={{
              flex: 1,
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              padding: "10px 12px",
              color: T.text,
              fontSize: 14,
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={addItem}
            disabled={!newItemName.trim()}
            style={{
              background: T.accent,
              border: "none",
              borderRadius: 6,
              padding: "10px 16px",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: newItemName.trim() ? "pointer" : "not-allowed",
              opacity: newItemName.trim() ? 1 : 0.5,
              fontFamily: "inherit",
            }}
          >
            Add
          </button>
        </div>

        {/* Items by category */}
        {CATEGORY_ORDER.map((category) => {
          const items = groupedItems[category];
          if (!items || items.length === 0) return null;

          return (
            <div key={category} style={{ marginBottom: 16 }}>
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
                {category}
              </p>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: item.checked ? T.surface : T.card,
                    borderRadius: 6,
                    padding: "10px 12px",
                    marginBottom: 4,
                    border: `1px solid ${T.border}`,
                    opacity: item.checked ? 0.6 : 1,
                  }}
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      border: `2px solid ${item.checked ? T.teal : T.border2}`,
                      background: item.checked ? T.teal : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {item.checked && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                    )}
                  </button>
                  <span
                    style={{
                      flex: 1,
                      color: T.text,
                      fontSize: 14,
                      textDecoration: item.checked ? "line-through" : "none",
                    }}
                  >
                    {item.name}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
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
              ))}
            </div>
          );
        })}

        {/* Clear checked button */}
        {checkedCount > 0 && (
          <button
            onClick={() => {
              const newItems = currentList.items.filter((i) => !i.checked);
              updateList(currentList.id, newItems);
            }}
            style={{
              width: "100%",
              background: "none",
              border: `1px solid ${T.border2}`,
              borderRadius: 6,
              padding: "10px 16px",
              color: T.textSub,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Clear {checkedCount} checked item{checkedCount !== 1 ? "s" : ""}
          </button>
        )}
      </div>
    );
  }

  // Lists Overview
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        <div>
          <h2
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: 22,
              fontWeight: 700,
              color: T.text,
            }}
          >
            Shopping Lists
          </h2>
          <p style={{ color: T.textSub, fontSize: 12, marginTop: 3 }}>
            {lists.length} list{lists.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Create from meal plan */}
      {plan && (
        <button
          onClick={() => setShowCreateFromPlan(true)}
          style={{
            width: "100%",
            background: T.tealBg,
            border: `1px solid ${T.teal}30`,
            borderRadius: 8,
            padding: "14px 16px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "left",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: `${T.teal}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <div>
            <p style={{ color: T.teal, fontSize: 14, fontWeight: 600 }}>Create from Meal Plan</p>
            <p style={{ color: T.textSub, fontSize: 11, marginTop: 2 }}>
              Auto-generate list from your weekly meals
            </p>
          </div>
        </button>
      )}

      {/* Create empty list */}
      <button
        onClick={() => createList("New Shopping List", [])}
        style={{
          width: "100%",
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          padding: "14px 16px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: T.card2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.textSub} strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <div>
          <p style={{ color: T.text, fontSize: 14, fontWeight: 500 }}>Create Empty List</p>
          <p style={{ color: T.textSub, fontSize: 11, marginTop: 2 }}>Start with a blank shopping list</p>
        </div>
      </button>

      {/* Existing lists */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: T.textSub, fontSize: 13 }}>Loading...</p>
        </div>
      ) : lists.length === 0 ? (
        <div
          style={{
            background: T.card,
            borderRadius: 8,
            padding: "2rem",
            border: `1px solid ${T.border}`,
            textAlign: "center",
          }}
        >
          <p style={{ color: T.textSub, fontSize: 13 }}>No shopping lists yet</p>
        </div>
      ) : (
        lists.map((list) => {
          const checkedCount = list.items.filter((i) => i.checked).length;
          const totalCount = list.items.length;

          return (
            <div
              key={list.id}
              style={{
                background: T.card,
                borderRadius: 8,
                padding: "12px 14px",
                marginBottom: 8,
                border: `1px solid ${T.border}`,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <button
                onClick={() => setCurrentList(list)}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                <p style={{ color: T.text, fontSize: 14, fontWeight: 500 }}>{list.title || "Shopping List"}</p>
                <p style={{ color: T.textSub, fontSize: 11, marginTop: 2 }}>
                  {checkedCount}/{totalCount} items • {new Date(list.updated_at).toLocaleDateString()}
                </p>
              </button>
              <button
                onClick={() => deleteList(list.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: T.textMut,
                  cursor: "pointer",
                  padding: 8,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3,6 5,6 21,6" />
                  <path d="M19,6v14a2,2 0 01-2,2H7a2,2 0 01-2-2V6m3,0V4a2,2 0 012-2h4a2,2 0 012,2v2" />
                </svg>
              </button>
            </div>
          );
        })
      )}

      {/* Create from plan modal */}
      {showCreateFromPlan && plan && (
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
          onClick={() => setShowCreateFromPlan(false)}
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
            <h3
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontSize: 20,
                fontWeight: 700,
                color: T.text,
                marginBottom: 8,
              }}
            >
              Create Shopping List
            </h3>
            <p style={{ color: T.textSub, fontSize: 13, marginBottom: 16 }}>
              This will extract all ingredients from your weekly meal plan and create a shopping list.
            </p>

            <div
              style={{
                background: T.surface,
                borderRadius: 6,
                padding: 12,
                marginBottom: 16,
                border: `1px solid ${T.border}`,
              }}
            >
              <p style={{ color: T.textSub, fontSize: 11, marginBottom: 8 }}>Preview ingredients:</p>
              <p style={{ color: T.text, fontSize: 12 }}>
                {extractIngredientsFromPlan(plan)
                  .slice(0, 5)
                  .map((i) => i.name)
                  .join(", ")}
                {extractIngredientsFromPlan(plan).length > 5 && ` +${extractIngredientsFromPlan(plan).length - 5} more`}
              </p>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowCreateFromPlan(false)}
                style={{
                  flex: 1,
                  background: "none",
                  border: `1px solid ${T.border2}`,
                  borderRadius: 6,
                  padding: "10px 16px",
                  color: T.textSub,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFromPlan}
                style={{
                  flex: 1,
                  background: T.accent,
                  border: "none",
                  borderRadius: 6,
                  padding: "10px 16px",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Create List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
