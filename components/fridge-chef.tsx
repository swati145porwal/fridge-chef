"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { RecipeRating } from "./recipe-rating";
import { ShareMealPlan } from "./share-meal-plan";
import { ShoppingListScreen } from "./shopping-list";
import { NutritionTrackerScreen } from "./nutrition-tracker";
import { Onboarding } from "./onboarding";
import { useProfile } from "./profile-provider";
import {
  clearProfileData,
  getActiveProfileId,
  profileStorageKey,
} from "@/lib/profiles";
import { RecipeImageHeader, RecipeImageThumb } from "./recipe-image-header";

/* ─── Design Tokens (CSS Variables for Light/Dark support) ─── */
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
  navBg: "var(--fc-nav-bg)",
  navBorder: "var(--fc-nav-border)",
};

/* ─── Link Helpers ─── */
function openLink(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
const yt = (q: string) =>
  openLink(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`);
const ig = (q: string) =>
  openLink(`https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(q)}`);
const ytCh = (h: string) => openLink(`https://www.youtube.com/@${h}`);

/* ─── WhatsApp Helpers ─── */
function sendToWhatsApp(message: string) {
  // Opens WhatsApp contact picker with pre-filled message — no API key needed
  openLink(`https://wa.me/?text=${encodeURIComponent(message)}`);
}

function formatRecipeForWA(r: Recipe): string {
  const dietLabel = r.diet === "vegan" ? "🌱 Vegan" : r.diet === "veg" ? "🥗 Vegetarian" : r.diet === "egget" ? "🥚 Eggetarian" : "🍗 Non-Veg";
  const cuisineLabels = r.cuisines.map((c) => PREF.cuisine.find((x) => x.id === c)?.label || c).join(" · ");
  const ytLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(r.name + " recipe")}`;
  let msg = `🍛 *${r.name}*\n`;
  msg += `${dietLabel} · ${cuisineLabels}\n`;
  msg += `⏱ ${r.time}  |  🔥 ${r.cal} kcal\n`;
  if (r.steps && r.steps.length) {
    msg += `\n*Steps:*\n`;
    r.steps.forEach((step, i) => { msg += `${i + 1}. ${step}\n`; });
  }
  if (r.pairing) msg += `\n🍽 *Pairs with:* ${r.pairing}`;
  msg += `\n\n▶️ *Watch on YouTube:*\n${ytLink}`;
  msg += `\n\n_Sent via FridgeChef India_ 🍛`;
  return msg;
}

function formatPlanDayForWA(day: { full: string; breakfast: Recipe | null; lunch: Recipe | null; dinner: Recipe | null }): string {
  const date = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
  let msg = `📋 *Today's Menu — ${date}*\n\n`;
  if (day.breakfast) msg += `🌅 *Breakfast:* ${day.breakfast.name} (${day.breakfast.time})\n`;
  if (day.lunch)     msg += `☀️ *Lunch:* ${day.lunch.name} (${day.lunch.time})\n`;
  if (day.dinner)    msg += `🌙 *Dinner:* ${day.dinner.name} (${day.dinner.time})\n`;
  msg += `\n_Sent via FridgeChef India_ 🍛`;
  return msg;
}

/* ─── Quick-Commerce Links ─── */
const PLATFORMS = [
  {
    id: "blinkit",
    label: "Blinkit",
    emoji: "🟡",
    color: "#f9d000",
    bg: "#1a1600",
    url: (q: string) => `https://blinkit.com/s/?q=${encodeURIComponent(q)}`,
    home: "https://blinkit.com",
  },
  {
    id: "swiggy",
    label: "Swiggy Instamart",
    emoji: "🟠",
    color: "#fc8019",
    bg: "#1a0c00",
    url: (q: string) => `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(q)}`,
    home: "https://www.swiggy.com/instamart",
  },
  {
    id: "zepto",
    label: "Zepto",
    emoji: "🟣",
    color: "#9d4edd",
    bg: "#12001a",
    url: (q: string) => `https://www.zeptonow.com/search?query=${encodeURIComponent(q)}`,
    home: "https://www.zeptonow.com",
  },
  {
    id: "bigbasket",
    label: "BigBasket",
    emoji: "🟢",
    color: "#84cc16",
    bg: "#0a1200",
    url: (q: string) => `https://www.bigbasket.com/ps/?q=${encodeURIComponent(q)}`,
    home: "https://www.bigbasket.com",
  },
];

/* Parses a recipe's steps for known Indian ingredient keywords */
function extractGroceryItems(r: Recipe): string[] {
  const items = new Set<string>([r.core]);
  const text = r.steps.join(" ").toLowerCase();

  const keywords: [RegExp, string][] = [
    [/\bonion\b/,                "Onion"],
    [/\bginger\b/,               "Ginger"],
    [/\bgarlic\b/,               "Garlic"],
    [/\btomato/,                 "Tomato"],
    [/green chilli|green chili/, "Green Chilli"],
    [/\bghee\b/,                 "Ghee"],
    [/\boil\b/,                  "Cooking Oil"],
    [/\bcumin\b|jeera/,          "Cumin Seeds"],
    [/mustard seed/,             "Mustard Seeds"],
    [/curry leaves/,             "Curry Leaves"],
    [/coriander leaves|cilantro/,"Coriander Leaves"],
    [/turmeric|haldi/,           "Turmeric"],
    [/red chilli powder/,        "Red Chilli Powder"],
    [/garam masala/,             "Garam Masala"],
    [/coriander powder|dhania/,  "Coriander Powder"],
    [/\bsalt\b/,                 "Salt"],
    [/\blemon\b/,                "Lemon"],
    [/\byogurt\b|\bcurd\b|dahi/, "Curd / Yogurt"],
    [/\bcream\b/,                "Fresh Cream"],
    [/cashew/,                   "Cashews"],
    [/paneer/,                   "Paneer"],
    [/\begg\b/,                  "Eggs"],
    [/\bchicken\b/,              "Chicken"],
    [/\bmutton\b|\blamb\b/,      "Mutton"],
    [/\bprawn\b/,                "Prawns"],
    [/\bpotato\b|aloo/,          "Potato"],
    [/spinach|palak/,            "Spinach / Palak"],
    [/capsicum/,                 "Capsicum"],
    [/coconut milk/,             "Coconut Milk"],
    [/\bcoconut\b/,              "Coconut"],
    [/tamarind/,                 "Tamarind"],
    [/\bsugar\b/,                "Sugar"],
    [/asafoetida|hing/,          "Asafoetida (Hing)"],
    [/bay leaf/,                 "Bay Leaf"],
    [/cardamom|elaichi/,         "Cardamom"],
    [/cinnamon|dalchini/,        "Cinnamon"],
    [/clove|laung/,              "Cloves"],
    [/\brice\b/,                 "Basmati Rice"],
    [/wheat flour|atta/,         "Wheat Flour (Atta)"],
    [/\bbesan\b|gram flour/,     "Besan (Gram Flour)"],
    [/semolina|suji|rava/,       "Semolina (Suji)"],
    [/\bpoha\b/,                 "Poha"],
    [/\bmilk\b/,                 "Milk"],
    [/\bbutter\b/,               "Butter"],
  ];

  for (const [regex, name] of keywords) {
    if (regex.test(text)) items.add(name);
  }

  return Array.from(items);
}

/* ─── YouTube Channels ─── */
const YT_CHS = [
  { name: "Ranveer Brar", h: "RanveerBrar" },
  { name: "Hebbars Kitchen", h: "hebbarskitchen" },
  { name: "Kabita's Kitchen", h: "KabitasKitchen" },
  { name: "Nisha Madhulika", h: "nishamadhulika" },
  { name: "Kunal Kapur", h: "ChefKunalKapur" },
  { name: "Bong Eats", h: "BongEats" },
  { name: "Sanjyot Keer", h: "sanjyotkeer" },
  { name: "Chef Harpal Singh", h: "chefharpalsingh" },
  { name: "Your Food Lab", h: "YourFoodLab" },
  { name: "Cook With Parul", h: "CookWithParul" },
];

/* ─── Allergens ─── */
const ALLERGENS = [
  { id: "dairy", label: "Dairy", sub: "Milk, paneer, curd, butter, ghee, cream" },
  { id: "gluten", label: "Gluten", sub: "Wheat flour, bread, maida, semolina" },
  { id: "nuts", label: "Tree Nuts", sub: "Cashews, almonds, pistachios" },
  { id: "peanuts", label: "Peanuts", sub: "Groundnuts in any form" },
  { id: "eggs", label: "Eggs", sub: "Eggs in any form" },
  { id: "soy", label: "Soy", sub: "Soya chunks, soy sauce, tofu" },
  { id: "shellfish", label: "Shellfish", sub: "Prawns, crabs, lobster" },
  { id: "fish", label: "Fish", sub: "All fish varieties" },
];

/* ─── Dislikes ─── */
const DISLIKES = [
  "Onion", "Garlic", "Ginger", "Green Chilli", "Dry Red Chilli", "Mushroom",
  "Brinjal", "Bottle Gourd", "Okra", "Bitter Gourd", "Karela", "Drumstick",
  "Methi", "Curry Leaves", "Coriander Leaves", "Mint", "Dill", "Bathua",
  "Sarson Greens", "Capsicum", "Mustard Seeds", "Asafoetida", "Tamarind",
  "Coconut", "Peanuts", "Radish", "Colocasia", "Jackfruit", "Raw Banana",
  "Yam", "Zucchini", "Spring Onion", "Tomato", "Raw Mango", "Amchur",
  "Kashmiri Chilli", "Vinegar", "Beetroot", "Turnip", "Lotus Stem",
  "Ridge Gourd", "Snake Gourd", "Cluster Beans", "Kokum", "Poppy Seeds",
];

/* ─── User Preferences Options ─── */
const PREF = {
  diet: [
    { id: "veg", label: "Vegetarian" },
    { id: "vegan", label: "Vegan" },
    { id: "jain", label: "Jain" },
    { id: "egget", label: "Eggetarian" },
    { id: "nonveg", label: "Non-Veg" },
  ],
  cuisine: [
    { id: "north", label: "North Indian" },
    { id: "punjabi", label: "Punjabi" },
    { id: "south", label: "South Indian" },
    { id: "maharashtra", label: "Maharashtrian" },
    { id: "gujarati", label: "Gujarati" },
    { id: "rajasthani", label: "Rajasthani" },
    { id: "bengali", label: "Bengali" },
    { id: "mughlai", label: "Mughlai" },
    { id: "fusion", label: "Fusion" },
    { id: "hyderabadi", label: "Hyderabadi" },
    { id: "continental", label: "Continental" },
    { id: "mediterranean", label: "Mediterranean" },
  ],
  health: [
    { id: "protein", label: "High Protein" },
    { id: "lowcarb", label: "Low Carb" },
    { id: "lowoil", label: "Low Oil" },
    { id: "fiber", label: "High Fibre" },
    { id: "weight", label: "Weight Loss" },
    { id: "diabetic", label: "Diabetic-Friendly" },
    { id: "gutfriendly", label: "Gut-Friendly" },
    { id: "iron", label: "Iron-Rich" },
    { id: "calcium", label: "Calcium-Rich" },
  ],
  spice: [
    { id: "mild", label: "Mild" },
    { id: "medium", label: "Medium" },
    { id: "spicy", label: "Spicy" },
    { id: "xspicy", label: "Extra Spicy" },
  ],
  serves: [
    { id: "1", label: "1 person" },
    { id: "2", label: "2 people" },
    { id: "3", label: "3 people" },
    { id: "4", label: "4+ people" },
  ],
};

interface MacroTargets {
  goal: string;        // preset id
  calories: number;
  protein: number;     // g/day
  carbs: number;       // g/day
  fat: number;         // g/day
}

interface Prefs {
  diet: string[];
  cuisine: string[];
  health: string[];
  spice: string[];
  serves: string[];
  allergies: string[];
  dislikes: string[];
  name: string;
  macroTargets: MacroTargets;
}

const MACRO_PRESETS: Record<string, { label: string; emoji: string; desc: string } & MacroTargets> = {
  none:        { goal: "none",        label: "No Goal",       emoji: "—",  desc: "No macro tracking",        calories: 0,    protein: 0,   carbs: 0,   fat: 0   },
  balanced:    { goal: "balanced",    label: "Balanced",      emoji: "⚖️", desc: "2000 kcal, standard macros", calories: 2000, protein: 50,  carbs: 250, fat: 65  },
  weightloss:  { goal: "weightloss",  label: "Weight Loss",   emoji: "🔥", desc: "1500 kcal deficit",         calories: 1500, protein: 112, carbs: 150, fat: 50  },
  muscle:      { goal: "muscle",      label: "Muscle Gain",   emoji: "💪", desc: "2500 kcal + high protein",  calories: 2500, protein: 175, carbs: 312, fat: 70  },
  lowcarb:     { goal: "lowcarb",     label: "Low Carb",      emoji: "🥩", desc: "1800 kcal, 50g carbs",      calories: 1800, protein: 135, carbs: 50,  fat: 130 },
  highprotein: { goal: "highprotein", label: "High Protein",  emoji: "🥚", desc: "2200 kcal, 200g protein",   calories: 2200, protein: 200, carbs: 200, fat: 65  },
  diabetic:    { goal: "diabetic",    label: "Diabetic",      emoji: "🩺", desc: "1800 kcal, low-GI focus",   calories: 1800, protein: 90,  carbs: 180, fat: 60  },
  custom:      { goal: "custom",      label: "Custom",        emoji: "✏️", desc: "Set your own targets",      calories: 1800, protein: 90,  carbs: 200, fat: 60  },
};

const DEFAULT_PREFS: Prefs = {
  diet: ["veg"],
  cuisine: ["north", "punjabi"],
  health: [],
  spice: ["medium"],
  serves: ["2"],
  allergies: [],
  dislikes: [],
  name: "",
  macroTargets: { goal: "none", calories: 0, protein: 0, carbs: 0, fat: 0 },
};

/* ─── Ingredients Database ─── */
interface Ingredient {
  id: number;
  name: string;
  cat: string;
  em: string;
  q: string;
}

const ING: Ingredient[] = [
  // Protein
  { id: 1, name: "Paneer", cat: "Protein", em: "🧀", q: "fresh paneer block Indian cottage cheese" },
  { id: 2, name: "Tofu", cat: "Protein", em: "🫙", q: "fresh tofu block silken" },
  { id: 3, name: "Soya Chunks", cat: "Protein", em: "🫘", q: "soya chunks textured vegetable protein dry" },
  { id: 4, name: "Tempeh", cat: "Protein", em: "🫘", q: "tempeh fermented soybean cake sliced" },
  
  // Eggs
  { id: 5, name: "Whole Eggs", cat: "Eggs", em: "🥚", q: "fresh eggs white brown whole food" },
  { id: 6, name: "Egg Whites", cat: "Eggs", em: "🥚", q: "egg whites separated clear bowl" },
  
  // Chicken
  { id: 7, name: "Chicken (pieces)", cat: "Chicken", em: "🍗", q: "fresh raw chicken pieces curry cut" },
  { id: 8, name: "Chicken Breast", cat: "Chicken", em: "🍗", q: "raw chicken breast fillet fresh" },
  { id: 9, name: "Chicken Mince", cat: "Chicken", em: "🥩", q: "raw minced chicken keema close up" },
  { id: 10, name: "Chicken Thighs", cat: "Chicken", em: "🍗", q: "raw chicken thighs boneless skinless" },
  
  // Mutton
  { id: 11, name: "Mutton / Goat", cat: "Mutton", em: "🥩", q: "fresh mutton goat meat raw curry cut" },
  { id: 12, name: "Mutton Mince", cat: "Mutton", em: "🥩", q: "raw mutton keema mince ground meat" },
  { id: 13, name: "Lamb Chops", cat: "Mutton", em: "🥩", q: "raw lamb chops mutton ribs" },
  
  // Seafood
  { id: 15, name: "Fish (River)", cat: "Seafood", em: "🐟", q: "fresh rohu catla river fish whole India" },
  { id: 16, name: "Fish (Sea)", cat: "Seafood", em: "🐠", q: "fresh pomfret surmai sea fish India" },
  { id: 17, name: "Salmon", cat: "Seafood", em: "🐟", q: "fresh salmon fillet orange pink" },
  { id: 18, name: "Prawns", cat: "Seafood", em: "🦐", q: "fresh raw prawns shrimp close up" },
  { id: 19, name: "Crab", cat: "Seafood", em: "🦀", q: "fresh crab whole mud crab seafood" },
  { id: 20, name: "Squid / Calamari", cat: "Seafood", em: "🦑", q: "fresh squid calamari rings tentacles" },
  { id: 21, name: "Mussels", cat: "Seafood", em: "🦪", q: "fresh mussels black shells seafood" },
  { id: 22, name: "Fish Fillet", cat: "Seafood", em: "🐟", q: "fresh fish fillet boneless white" },
  
  // Dal & Legumes
  { id: 30, name: "Toor Dal", cat: "Dal", em: "🫘", q: "toor dal arhar pigeon pea lentils dry" },
  { id: 31, name: "Moong Dal (split)", cat: "Dal", em: "🫘", q: "yellow moong dal split lentils close up" },
  { id: 32, name: "Moong (whole green)", cat: "Dal", em: "🫘", q: "whole green moong mung beans dry" },
  { id: 33, name: "Masoor Dal", cat: "Dal", em: "🫘", q: "red masoor lentil dal close up" },
  { id: 34, name: "Chana Dal", cat: "Dal", em: "🫘", q: "chana dal split bengal gram lentil" },
  { id: 35, name: "Urad Dal", cat: "Dal", em: "🫘", q: "urad dal black gram split white India" },
  { id: 36, name: "Rajma (Red)", cat: "Dal", em: "🫘", q: "dried red kidney beans rajma" },
  { id: 37, name: "Kabuli Chana", cat: "Dal", em: "🫘", q: "dried white chickpeas kabuli chana" },
  { id: 38, name: "Black Chana (Kala)", cat: "Dal", em: "🫘", q: "black chickpeas kala chana dry" },
  { id: 39, name: "Lobia (Black-eyed Peas)", cat: "Dal", em: "🫘", q: "black eyed peas lobia dry beans" },
  { id: 40, name: "Val Dal", cat: "Dal", em: "🫘", q: "val dal field beans Indian dry" },
  { id: 41, name: "Sabudana", cat: "Dal", em: "🫙", q: "sabudana tapioca pearls white bowl India" },
  { id: 42, name: "Moth Beans", cat: "Dal", em: "🫘", q: "moth beans matki dry brown" },
  { id: 43, name: "Horse Gram (Kulthi)", cat: "Dal", em: "🫘", q: "horse gram kulthi dry brown legume" },
  
  // Vegetables
  { id: 50, name: "Onion", cat: "Vegetables", em: "🧅", q: "fresh red onion whole cut India kitchen" },
  { id: 51, name: "Tomato", cat: "Vegetables", em: "🍅", q: "fresh red tomatoes Indian kitchen" },
  { id: 52, name: "Potato", cat: "Vegetables", em: "🥔", q: "fresh potatoes raw aloo Indian" },
  { id: 53, name: "Cauliflower", cat: "Vegetables", em: "🥦", q: "fresh cauliflower gobi white whole" },
  { id: 54, name: "Spinach", cat: "Vegetables", em: "🥬", q: "fresh spinach palak bunch leaves" },
  { id: 55, name: "Peas", cat: "Vegetables", em: "🫛", q: "fresh green peas matar shelled" },
  { id: 56, name: "Carrot", cat: "Vegetables", em: "🥕", q: "fresh orange carrots gajar bunch" },
  { id: 57, name: "Brinjal / Eggplant", cat: "Vegetables", em: "🍆", q: "fresh purple brinjal baingan eggplant" },
  { id: 58, name: "Capsicum", cat: "Vegetables", em: "🫑", q: "fresh green red yellow capsicum bell pepper" },
  { id: 59, name: "Mushroom", cat: "Vegetables", em: "🍄", q: "fresh button mushrooms close up white" },
  { id: 60, name: "Cabbage", cat: "Vegetables", em: "🥬", q: "fresh green cabbage whole head" },
  { id: 61, name: "Bottle Gourd (Lauki)", cat: "Vegetables", em: "🥒", q: "fresh bottle gourd lauki dudhi green" },
  { id: 62, name: "Ridge Gourd (Turai)", cat: "Vegetables", em: "🥒", q: "fresh ridge gourd turai green ribbed" },
  { id: 63, name: "Bitter Gourd (Karela)", cat: "Vegetables", em: "🥒", q: "fresh bitter gourd karela green bumpy" },
  { id: 64, name: "Snake Gourd", cat: "Vegetables", em: "🥒", q: "fresh snake gourd padwal long green" },
  { id: 65, name: "Ash Gourd", cat: "Vegetables", em: "🥒", q: "fresh ash gourd petha white wax gourd" },
  { id: 66, name: "Ivy Gourd (Tindora)", cat: "Vegetables", em: "🥒", q: "fresh ivy gourd tindora small green" },
  { id: 67, name: "Pointed Gourd (Parwal)", cat: "Vegetables", em: "🥒", q: "fresh pointed gourd parwal green striped" },
  { id: 68, name: "Sweet Potato", cat: "Vegetables", em: "🍠", q: "fresh sweet potato shakarkand orange" },
  { id: 69, name: "Radish (Mooli)", cat: "Vegetables", em: "🥕", q: "fresh white radish mooli daikon" },
  { id: 70, name: "Turnip (Shalgam)", cat: "Vegetables", em: "🥕", q: "fresh turnip shalgam white purple root" },
  { id: 71, name: "Beetroot", cat: "Vegetables", em: "🥕", q: "fresh beetroot chukandar red purple" },
  { id: 72, name: "Yam (Suran)", cat: "Vegetables", em: "🥔", q: "fresh yam suran elephant foot brown" },
  { id: 73, name: "Colocasia (Arbi)", cat: "Vegetables", em: "🥔", q: "fresh colocasia arbi taro root brown" },
  { id: 74, name: "Raw Banana", cat: "Vegetables", em: "🍌", q: "raw green banana kachha kela cooking" },
  { id: 75, name: "Okra / Bhindi", cat: "Vegetables", em: "🌿", q: "fresh okra bhindi lady finger green bunch" },
  { id: 76, name: "Corn / Maize", cat: "Vegetables", em: "🌽", q: "fresh sweet corn maize cob yellow" },
  { id: 77, name: "Pumpkin", cat: "Vegetables", em: "🎃", q: "fresh pumpkin kaddu orange whole cut" },
  { id: 78, name: "Zucchini", cat: "Vegetables", em: "🥒", q: "fresh zucchini courgette green" },
  { id: 79, name: "Broccoli", cat: "Vegetables", em: "🥦", q: "fresh broccoli florets green close up" },
  { id: 80, name: "French Beans", cat: "Vegetables", em: "🫛", q: "fresh french beans green string beans" },
  { id: 81, name: "Cluster Beans (Gawar)", cat: "Vegetables", em: "🫛", q: "fresh cluster beans gawar phali green" },
  { id: 82, name: "Drumstick (Moringa)", cat: "Vegetables", em: "🥒", q: "fresh drumstick moringa sahjan green long" },
  { id: 83, name: "Raw Papaya", cat: "Vegetables", em: "🥒", q: "raw green papaya unripe cooking" },
  { id: 84, name: "Raw Jackfruit", cat: "Vegetables", em: "🥒", q: "raw green jackfruit kathal cooking" },
  { id: 85, name: "Banana Stem", cat: "Vegetables", em: "🌿", q: "fresh banana stem vazhaithandu sliced" },
  { id: 86, name: "Banana Flower", cat: "Vegetables", em: "🌸", q: "fresh banana flower blossom purple" },
  { id: 87, name: "Avocado", cat: "Vegetables", em: "🥑", q: "fresh avocado halved green ripe" },
  { id: 88, name: "Cucumber", cat: "Vegetables", em: "🥒", q: "fresh cucumber kheera sliced green" },
  { id: 89, name: "Spring Onion", cat: "Vegetables", em: "🧅", q: "fresh spring onion scallion green white" },
  
  // Greens & Leafy Vegetables
  { id: 90, name: "Coriander Leaves", cat: "Greens", em: "🌿", q: "fresh coriander dhania leaves bunch green" },
  { id: 91, name: "Mint", cat: "Greens", em: "🌿", q: "fresh mint pudina leaves bunch green" },
  { id: 92, name: "Curry Leaves", cat: "Greens", em: "🌿", q: "fresh curry leaves kadi patta bunch" },
  { id: 93, name: "Methi / Fenugreek", cat: "Greens", em: "🌿", q: "fresh fenugreek methi leaves bunch green India" },
  { id: 94, name: "Amaranth Leaves (Chauli)", cat: "Greens", em: "🌿", q: "fresh amaranth leaves chauli red green" },
  { id: 95, name: "Mustard Greens (Sarson)", cat: "Greens", em: "🌿", q: "fresh mustard greens sarson leaves" },
  { id: 96, name: "Bathua Leaves", cat: "Greens", em: "🌿", q: "fresh bathua chenopodium leaves green" },
  { id: 97, name: "Dill (Suwa)", cat: "Greens", em: "🌿", q: "fresh dill suwa shepu leaves bunch" },
  { id: 98, name: "Drumstick Leaves", cat: "Greens", em: "🌿", q: "fresh moringa drumstick leaves green" },
  { id: 99, name: "Colocasia Leaves (Patra)", cat: "Greens", em: "🌿", q: "fresh colocasia leaves arbi patra large" },
  
  // Dairy
  { id: 110, name: "Milk", cat: "Dairy", em: "🥛", q: "fresh full cream milk white glass pitcher" },
  { id: 111, name: "Curd / Dahi", cat: "Dairy", em: "🥛", q: "fresh homemade curd dahi bowl white creamy" },
  { id: 112, name: "Butter", cat: "Dairy", em: "🧈", q: "fresh butter block yellow makhan India" },
  { id: 113, name: "Ghee", cat: "Dairy", em: "🫙", q: "ghee clarified butter golden jar spoon India" },
  { id: 114, name: "Cream (Fresh)", cat: "Dairy", em: "🥛", q: "fresh cream malai white thick" },
  { id: 115, name: "Khoya / Mawa", cat: "Dairy", em: "🧀", q: "khoya mawa dried milk solid Indian" },
  { id: 116, name: "Buttermilk (Chaas)", cat: "Dairy", em: "🥛", q: "buttermilk chaas lassi white glass" },
  { id: 117, name: "Cheese (Processed)", cat: "Dairy", em: "🧀", q: "processed cheese slices yellow" },
  { id: 118, name: "Coconut Milk", cat: "Dairy", em: "🥥", q: "coconut milk creamy white bowl fresh" },
  { id: 119, name: "Condensed Milk", cat: "Dairy", em: "🥛", q: "condensed milk sweet thick can" },
  
  // Grains & Flours
  { id: 120, name: "Basmati Rice", cat: "Grains", em: "🍚", q: "basmati rice grains white long grain raw" },
  { id: 121, name: "Brown Rice", cat: "Grains", em: "🍚", q: "brown rice whole grain unpolished" },
  { id: 122, name: "Wheat Flour (Atta)", cat: "Grains", em: "🌾", q: "wheat flour atta white powder close up India" },
  { id: 123, name: "Maida (All Purpose)", cat: "Grains", em: "🌾", q: "maida all purpose flour white refined" },
  { id: 124, name: "Besan (Gram Flour)", cat: "Grains", em: "🌾", q: "besan gram chickpea flour yellow powder" },
  { id: 125, name: "Semolina (Suji)", cat: "Grains", em: "🌾", q: "semolina suji rava coarse yellow grain" },
  { id: 126, name: "Poha (Flattened Rice)", cat: "Grains", em: "🍚", q: "poha flattened rice flakes white thin" },
  { id: 127, name: "Dosa Batter", cat: "Grains", em: "🫙", q: "dosa idli batter fermented bowl white India" },
  { id: 128, name: "Bread", cat: "Grains", em: "🍞", q: "sliced bread loaf white fresh" },
  { id: 129, name: "Oats", cat: "Grains", em: "🌾", q: "rolled oats raw close up textured" },
  { id: 130, name: "Rice Flour", cat: "Grains", em: "🌾", q: "rice flour white fine powder" },
  { id: 131, name: "Corn Flour", cat: "Grains", em: "🌾", q: "corn flour makki ka atta yellow" },
  { id: 132, name: "Buckwheat (Kuttu)", cat: "Grains", em: "🌾", q: "buckwheat kuttu flour seeds fasting" },
  { id: 133, name: "Water Chestnut (Singhara)", cat: "Grains", em: "🌾", q: "water chestnut singhara flour fasting" },
  { id: 134, name: "Puffed Rice (Murmura)", cat: "Grains", em: "🍚", q: "puffed rice murmura white light crispy" },
  { id: 135, name: "Quinoa", cat: "Grains", em: "🌾", q: "raw quinoa seeds white bowl close up" },
  { id: 137, name: "Pasta (Dry)", cat: "Grains", em: "🍝", q: "dry pasta penne spaghetti raw Italian" },
  { id: 148, name: "Vermicelli (Seviyan)", cat: "Grains", em: "🍜", q: "vermicelli seviyan thin noodles dry" },
  { id: 149, name: "Idiyappam Flour", cat: "Grains", em: "🌾", q: "idiyappam string hopper flour rice" },
  
  // Millets
  { id: 136, name: "Ragi (Finger Millet)", cat: "Millets", em: "🌾", q: "ragi finger millet flour brown powder India" },
  { id: 138, name: "Jowar (Sorghum)", cat: "Millets", em: "🌾", q: "jowar sorghum millet grains white India" },
  { id: 139, name: "Bajra (Pearl Millet)", cat: "Millets", em: "🌾", q: "bajra pearl millet grains grey India" },
  { id: 140, name: "Foxtail Millet", cat: "Millets", em: "🌾", q: "foxtail millet kangni grains yellow India" },
  { id: 146, name: "Little Millet (Samai)", cat: "Millets", em: "🌾", q: "little millet samai grains white India" },
  { id: 147, name: "Barnyard Millet", cat: "Millets", em: "🌾", q: "barnyard millet sanwa grains white India" },
  { id: 150, name: "Kodo Millet", cat: "Millets", em: "🌾", q: "kodo millet varagu grains India" },
  { id: 151, name: "Proso Millet", cat: "Millets", em: "🌾", q: "proso millet pani varagu grains" },
  { id: 152, name: "Browntop Millet", cat: "Millets", em: "🌾", q: "browntop millet korale grains India" },
  
  // Nuts & Seeds
  { id: 141, name: "Cashews (Kaju)", cat: "Nuts", em: "🌰", q: "raw cashew nuts kaju white India" },
  { id: 142, name: "Almonds (Badam)", cat: "Nuts", em: "🌰", q: "raw almonds badam brown skin whole" },
  { id: 143, name: "Peanuts", cat: "Nuts", em: "🥜", q: "raw peanuts groundnuts moongphali" },
  { id: 144, name: "Walnuts (Akhrot)", cat: "Nuts", em: "🌰", q: "walnuts akhrot halves brain shaped" },
  { id: 145, name: "Coconut (Fresh)", cat: "Nuts", em: "🥥", q: "fresh coconut halved white flesh India" },
  { id: 153, name: "Pistachios (Pista)", cat: "Nuts", em: "🌰", q: "pistachios pista green nuts" },
  { id: 154, name: "Raisins (Kishmish)", cat: "Nuts", em: "🍇", q: "raisins kishmish dried grapes golden" },
  { id: 155, name: "Dates (Khajoor)", cat: "Nuts", em: "🌴", q: "dates khajoor medjool brown sweet" },
  { id: 156, name: "Sesame Seeds (Til)", cat: "Nuts", em: "🌱", q: "sesame seeds til white raw" },
  { id: 157, name: "Flax Seeds (Alsi)", cat: "Nuts", em: "🌱", q: "flax seeds alsi brown omega" },
  { id: 158, name: "Chia Seeds", cat: "Nuts", em: "🌱", q: "chia seeds black small superfood" },
  { id: 159, name: "Sunflower Seeds", cat: "Nuts", em: "🌻", q: "sunflower seeds raw hulled" },
  { id: 167, name: "Poppy Seeds (Khus Khus)", cat: "Nuts", em: "🌱", q: "poppy seeds khus khus white tiny" },
  { id: 168, name: "Melon Seeds (Magaz)", cat: "Nuts", em: "🌱", q: "melon seeds magaz white flat" },
  { id: 169, name: "Fox Nuts (Makhana)", cat: "Nuts", em: "🌰", q: "fox nuts makhana lotus seeds white puffed" },
  { id: 170, name: "Dried Coconut (Copra)", cat: "Nuts", em: "🥥", q: "dried coconut copra grated brown" },
  
  // Spices & Aromatics
  { id: 160, name: "Ginger (Fresh Root)", cat: "Spices", em: "🫚", q: "fresh ginger root whole knob brown skin India" },
  { id: 161, name: "Garlic", cat: "Spices", em: "🧄", q: "fresh garlic bulb cloves white whole" },
  { id: 162, name: "Green Chilli", cat: "Spices", em: "🌶️", q: "fresh green chilli long thin Indian cooking" },
  { id: 163, name: "Red Chilli (Dry)", cat: "Spices", em: "🌶️", q: "dried red chilli whole kashmiri" },
  { id: 164, name: "Lemon / Lime", cat: "Spices", em: "🍋", q: "fresh lemon nimbu yellow cut India" },
  { id: 165, name: "Tamarind", cat: "Spices", em: "🫘", q: "tamarind imli pulp brown sour" },
  { id: 166, name: "Kokum", cat: "Spices", em: "🫐", q: "kokum dried purple sour Goan" },
  { id: 171, name: "Raw Mango (Kairi)", cat: "Spices", em: "🥭", q: "raw green mango kairi sour" },
  { id: 172, name: "Amchur (Dry Mango)", cat: "Spices", em: "🥭", q: "amchur dry mango powder tangy" },
  
  // Continental & Salad
  { id: 180, name: "Iceberg Lettuce", cat: "Continental", em: "🥬", q: "fresh iceberg lettuce head green crisp" },
  { id: 181, name: "Romaine Lettuce", cat: "Continental", em: "🥬", q: "fresh romaine lettuce cos leaves" },
  { id: 182, name: "Arugula (Rocket)", cat: "Continental", em: "🥬", q: "fresh arugula rocket leaves peppery" },
  { id: 183, name: "Feta Cheese", cat: "Continental", em: "🧀", q: "feta cheese block crumbled white Greek" },
  { id: 184, name: "Parmesan", cat: "Continental", em: "🧀", q: "parmesan cheese grated aged Italian" },
  { id: 185, name: "Mozzarella", cat: "Continental", em: "🧀", q: "fresh mozzarella ball white milky Italian" },
  { id: 186, name: "Cheddar Cheese", cat: "Continental", em: "🧀", q: "cheddar cheese block orange yellow aged" },
  { id: 187, name: "Mixed Sprouts", cat: "Continental", em: "🌱", q: "mixed sprouts bean sprouts fresh green bowl" },
  { id: 188, name: "Cherry Tomatoes", cat: "Continental", em: "🍅", q: "cherry tomatoes red small vine" },
  { id: 189, name: "Bell Peppers (Mixed)", cat: "Continental", em: "🫑", q: "bell peppers red yellow orange mixed" },
  { id: 190, name: "Asparagus", cat: "Continental", em: "🌿", q: "fresh asparagus green spears bunch" },
  { id: 191, name: "Celery", cat: "Continental", em: "🌿", q: "fresh celery stalks green crisp" },
  { id: 192, name: "Leek", cat: "Continental", em: "🧅", q: "fresh leek white green stalk" },
  { id: 193, name: "Artichoke", cat: "Continental", em: "🌿", q: "fresh artichoke globe green" },
  { id: 194, name: "Kale", cat: "Continental", em: "🥬", q: "fresh kale curly green leaves superfood" },
  { id: 195, name: "Bok Choy", cat: "Continental", em: "🥬", q: "fresh bok choy pak choi Chinese cabbage" },
  { id: 196, name: "Baby Corn", cat: "Continental", em: "🌽", q: "baby corn miniature yellow tender" },
  { id: 197, name: "Water Chestnuts", cat: "Continental", em: "🥔", q: "water chestnuts crunchy white sliced" },
  { id: 198, name: "Bamboo Shoots", cat: "Continental", em: "🌿", q: "bamboo shoots sliced Asian cooking" },
  { id: 199, name: "Bean Sprouts", cat: "Continental", em: "🌱", q: "bean sprouts fresh white crispy" },
  
  // Fruits (for cooking)
  { id: 300, name: "Banana (Ripe)", cat: "Fruits", em: "🍌", q: "ripe banana yellow sweet fruit" },
  { id: 301, name: "Apple", cat: "Fruits", em: "🍎", q: "fresh apple red green fruit" },
  { id: 302, name: "Mango (Ripe)", cat: "Fruits", em: "🥭", q: "ripe mango alphonso sweet yellow" },
  { id: 303, name: "Pineapple", cat: "Fruits", em: "🍍", q: "fresh pineapple whole cut tropical" },
  { id: 304, name: "Papaya (Ripe)", cat: "Fruits", em: "🍈", q: "ripe papaya orange sweet fruit" },
  { id: 305, name: "Pomegranate", cat: "Fruits", em: "🍎", q: "fresh pomegranate anar seeds red" },
  { id: 306, name: "Grapes", cat: "Fruits", em: "🍇", q: "fresh grapes green red bunch" },
  { id: 307, name: "Orange", cat: "Fruits", em: "🍊", q: "fresh orange citrus fruit segments" },
  { id: 308, name: "Guava", cat: "Fruits", em: "🍐", q: "fresh guava amrood green pink" },
  { id: 309, name: "Chikoo (Sapota)", cat: "Fruits", em: "🥔", q: "fresh chikoo sapota brown sweet" },
  { id: 310, name: "Custard Apple", cat: "Fruits", em: "🍏", q: "fresh custard apple sitaphal creamy" },
  { id: 311, name: "Watermelon", cat: "Fruits", em: "🍉", q: "fresh watermelon red juicy sliced" },
  { id: 312, name: "Litchi", cat: "Fruits", em: "🍇", q: "fresh litchi lychee pink sweet" },
  { id: 313, name: "Jamun", cat: "Fruits", em: "🫐", q: "fresh jamun java plum purple" },
  { id: 314, name: "Coconut (Tender)", cat: "Fruits", em: "🥥", q: "tender coconut green young nariyal" },
];

const ING_CATS = ["All", ...new Set(ING.map((i) => i.cat))];

/* ─── Recipe Database ─── */
interface Recipe {
  id: number;
  name: string;
  core: string;
  diet: string;
  meal: string[];
  cuisines: string[];
  allergens: string[];
  avoid: string[];
  health: string[];
  time: string;
  cal: number;
  desc: string;
  pairing: string;
  steps: string[];
  ytQ: string;
  score?: number;
}

const DB: Recipe[] = [
  { id: 1, name: "Moong Dal Chilla", core: "Moong Dal", diet: "veg", meal: ["breakfast"], cuisines: ["north"], allergens: [], avoid: ["Onion", "Green Chilli"], health: ["protein", "lowoil", "weight"], time: "15 min", cal: 180, desc: "Light savoury lentil pancakes — crispy outside, soft inside.", pairing: "Mint chutney + curd", steps: ["Soak moong dal 2h, blend smooth with ginger, cumin, salt", "Add chopped onion, chilli, coriander to batter", "Heat tawa, pour ladle of batter, spread thin", "Cook 2 min each side till golden", "Serve hot with green chutney"], ytQ: "moong dal chilla recipe" },
  { id: 2, name: "Besan Chilla", core: "Besan", diet: "veg", meal: ["breakfast"], cuisines: ["north"], allergens: [], avoid: ["Onion", "Green Chilli"], health: ["protein", "lowoil"], time: "10 min", cal: 160, desc: "Gram flour pancakes — quick, gluten-free and packed with plant protein.", pairing: "Tomato chutney + chai", steps: ["Mix besan, ajwain, haldi, salt with water to batter", "Add grated carrot, coriander, green chilli", "Heat tawa, pour batter, drizzle oil", "Cook 2 min each side till crisp", "Fold and serve hot"], ytQ: "besan chilla recipe" },
  { id: 3, name: "Kanda Batata Poha", core: "Poha", diet: "veg", meal: ["breakfast"], cuisines: ["maharashtra"], allergens: [], avoid: ["Onion", "Mustard Seeds"], health: ["lowoil", "weight"], time: "15 min", cal: 220, desc: "Flattened rice with onion and potato — beloved Maharashtrian morning staple.", pairing: "Sev + lemon + masala chai", steps: ["Rinse poha, drain, set aside to soften", "Crackle mustard, curry leaves in oil", "Add sliced onion, cook till golden", "Add boiled diced potato, haldi, salt", "Fold in poha, squeeze lemon, garnish"], ytQ: "poha recipe easy" },
  { id: 4, name: "Vegetable Upma", core: "Semolina", diet: "veg", meal: ["breakfast"], cuisines: ["south"], allergens: ["gluten"], avoid: ["Onion", "Mustard Seeds", "Asafoetida"], health: ["lowoil"], time: "15 min", cal: 240, desc: "Semolina porridge tempered with mustard and vegetables.", pairing: "Coconut chutney + filter coffee", steps: ["Dry-roast suji till aromatic", "Crackle mustard, urad dal, curry leaves in oil", "Add onion, mixed veg, cook 3 min", "Pour 2.5 cups hot water, salt", "Stir in suji, cook 3 min till thick"], ytQ: "upma recipe south indian" },
  { id: 5, name: "Idli & Sambar", core: "Dosa Batter", diet: "vegan", meal: ["breakfast"], cuisines: ["south"], allergens: [], avoid: ["Mustard Seeds", "Asafoetida", "Tamarind"], health: ["lowoil", "gutfriendly"], time: "20 min", cal: 200, desc: "Steamed rice-lentil cakes with spiced lentil soup — the gold standard South Indian breakfast.", pairing: "Coconut chutney + tomato chutney", steps: ["Grease idli moulds, pour batter 3/4 full", "Steam 10-12 min till skewer comes out clean", "Cook toor dal with tamarind, tomato, sambar powder", "Temper with mustard, curry leaves, dry chilli", "Serve idlis hot with sambar and chutneys"], ytQ: "idli sambar recipe" },
  { id: 6, name: "Plain Dosa", core: "Dosa Batter", diet: "vegan", meal: ["breakfast", "dinner"], cuisines: ["south"], allergens: [], avoid: ["Mustard Seeds"], health: ["lowoil", "weight"], time: "20 min", cal: 170, desc: "Paper-thin crispy fermented crepe — naturally gluten-free and light.", pairing: "Sambar + coconut chutney", steps: ["Heat cast-iron tawa till very hot", "Pour ladle of batter, spread in quick circular motion", "Drizzle oil on edges", "Cook till golden and crisp underneath", "Fold and serve immediately"], ytQ: "plain dosa recipe crispy" },
  { id: 7, name: "Masala Dosa", core: "Dosa Batter", diet: "veg", meal: ["breakfast", "lunch"], cuisines: ["south"], allergens: [], avoid: ["Onion", "Mustard Seeds"], health: ["fiber"], time: "25 min", cal: 290, desc: "Crispy dosa filled with spiced potato masala — a complete meal.", pairing: "Sambar + coconut chutney", steps: ["Temper mustard, urad, onion, curry leaves in oil", "Add potato masala with haldi, lemon", "Spread dosa batter thin, cook crispy", "Spoon filling, fold", "Serve with sambar and chutney"], ytQ: "masala dosa recipe" },
  { id: 8, name: "Aloo Paratha", core: "Wheat Flour", diet: "veg", meal: ["breakfast"], cuisines: ["punjabi"], allergens: ["gluten", "dairy"], avoid: ["Onion"], health: ["fiber"], time: "20 min", cal: 380, desc: "Whole wheat flatbread stuffed with spiced potato — Punjabi breakfast king.", pairing: "White butter + curd + pickle", steps: ["Knead soft dough with atta, water, salt", "Make spiced aloo filling with ajwain, aamchur", "Roll dough, stuff filling, seal, roll again", "Cook on hot tawa with generous butter", "Serve hot with white butter and curd"], ytQ: "aloo paratha punjabi" },
  { id: 30, name: "Dal Tadka", core: "Moong Dal", diet: "veg", meal: ["lunch", "dinner"], cuisines: ["north"], allergens: ["dairy"], avoid: ["Onion", "Garlic", "Tomato", "Asafoetida"], health: ["protein", "fiber"], time: "20 min", cal: 280, desc: "Yellow lentils with a sizzling ghee-spice tadka — comfort in a bowl.", pairing: "Jeera rice + papad + pickle", steps: ["Pressure cook dal with haldi, salt till soft", "Heat ghee in separate pan till smoking", "Add jeera, hing, dry red chilli, garlic — sizzle 30 sec", "Pour sizzling tadka over dal", "Add lemon, garnish coriander — serve immediately"], ytQ: "dal tadka dhaba style recipe" },
  { id: 31, name: "Dal Makhani", core: "Urad Dal", diet: "veg", meal: ["lunch", "dinner"], cuisines: ["punjabi"], allergens: ["dairy"], avoid: ["Onion", "Garlic"], health: ["protein"], time: "30 min", cal: 380, desc: "Black lentils slow-cooked with butter and cream — the king of dals.", pairing: "Butter naan + kachumber salad", steps: ["Soak urad dal + rajma overnight, pressure cook 20 min", "Sauté onion, ginger-garlic, tomato puree till oil separates", "Add cooked dal, simmer 15 min stirring", "Add butter, cream, kasuri methi", "Slow simmer 10 more min"], ytQ: "dal makhani restaurant style" },
  { id: 32, name: "Rajma Masala", core: "Rajma", diet: "vegan", meal: ["lunch", "dinner"], cuisines: ["punjabi", "north"], allergens: [], avoid: ["Onion", "Garlic", "Tomato"], health: ["protein", "fiber"], time: "30 min", cal: 320, desc: "Red kidney beans in Punjabi gravy — protein-packed and warming.", pairing: "Basmati rice + sliced onion + lemon", steps: ["Soak rajma overnight, pressure cook till very soft", "Sauté onion till golden, add tomato, cook 10 min", "Add ginger-garlic, spices till oil separates", "Add rajma with cooking water, simmer 15 min", "Mash some beans for thicker gravy"], ytQ: "rajma masala punjabi recipe" },
  { id: 33, name: "Chana Masala", core: "Kabuli Chana", diet: "vegan", meal: ["lunch", "dinner"], cuisines: ["north", "punjabi"], allergens: [], avoid: ["Onion", "Garlic", "Tomato", "Tamarind"], health: ["protein", "fiber"], time: "25 min", cal: 310, desc: "White chickpeas in tangy spiced gravy — street-food style, high protein.", pairing: "Bhature / puri + onion rings + chutney", steps: ["Soak chana overnight, pressure cook with tea bag", "Sauté onion-tomato masala with whole spices", "Add chana masala powder, amchur, anardana", "Add cooked chana, simmer 15 min", "Finish with coriander and julienne ginger"], ytQ: "chana masala recipe dhaba style" },
  { id: 50, name: "Palak Paneer", core: "Paneer", diet: "veg", meal: ["lunch", "dinner"], cuisines: ["north", "punjabi"], allergens: ["dairy"], avoid: ["Onion", "Garlic"], health: ["protein", "lowoil", "iron"], time: "25 min", cal: 340, desc: "Cottage cheese in velvety spinach gravy — rich in iron, protein and calcium.", pairing: "Butter naan / laccha paratha + onion salad", steps: ["Blanch spinach 2 min, puree smooth", "Sauté onion, ginger-garlic, tomato till oil separates", "Add spices, pour spinach puree — cook 5 min", "Add pan-fried paneer cubes, cream", "Simmer 3 min, finish with kasuri methi"], ytQ: "palak paneer restaurant style" },
  { id: 51, name: "Matar Paneer", core: "Paneer", diet: "veg", meal: ["lunch", "dinner"], cuisines: ["punjabi", "north"], allergens: ["dairy"], avoid: ["Onion", "Garlic", "Tomato"], health: ["protein"], time: "25 min", cal: 360, desc: "Cottage cheese and peas in rich Punjabi gravy — a North Indian classic.", pairing: "Butter roti / naan + raita", steps: ["Sauté onion, ginger-garlic to golden", "Add tomato puree, spices till oil separates", "Add green peas, cook 3 min", "Add fried paneer cubes, water for gravy", "Simmer 8 min, add cream and kasuri methi"], ytQ: "matar paneer dhaba style" },
  { id: 52, name: "Paneer Bhurji", core: "Paneer", diet: "veg", meal: ["breakfast", "lunch", "dinner"], cuisines: ["north"], allergens: ["dairy"], avoid: ["Onion", "Tomato", "Capsicum"], health: ["protein", "lowoil"], time: "15 min", cal: 290, desc: "Crumbled cottage cheese scrambled with spices — fast and protein-dense.", pairing: "Buttered toast / paratha + masala chai", steps: ["Heat oil, add jeera, sauté onion 3 min", "Add ginger-garlic, tomato, capsicum — cook 4 min", "Add haldi, red chilli, garam masala", "Crumble paneer directly into pan", "Toss 2 min, add lemon, fresh coriander"], ytQ: "paneer bhurji recipe" },
  { id: 53, name: "Paneer Butter Masala", core: "Paneer", diet: "veg", meal: ["lunch", "dinner"], cuisines: ["punjabi"], allergens: ["dairy", "nuts"], avoid: ["Onion", "Garlic", "Tomato"], health: ["protein"], time: "25 min", cal: 450, desc: "Cottage cheese in silky tomato-cashew gravy — India's most loved restaurant dish.", pairing: "Butter naan + kachumber + nimbu pani", steps: ["Blend boiled onion, tomato, cashews to smooth paste", "Cook paste with butter, spices till oil separates", "Add water for gravy, simmer 5 min", "Add pan-fried paneer, cream, kasuri methi", "Simmer 3 min, finish with butter"], ytQ: "paneer butter masala recipe" },
  { id: 60, name: "Aloo Gobi", core: "Cauliflower", diet: "vegan", meal: ["lunch", "dinner"], cuisines: ["north", "punjabi"], allergens: [], avoid: ["Onion"], health: ["lowoil", "weight", "fiber"], time: "20 min", cal: 220, desc: "Potato and cauliflower dry sabzi — simple, comforting and crowd-pleasing.", pairing: "Chapati + dal + raita", steps: ["Heat oil, crackle jeera, hing", "Add cauliflower florets and diced potato", "Add haldi, red chilli, dhaniya, salt", "Cover and cook on low 12-15 min", "Finish with garam masala and coriander"], ytQ: "aloo gobi dhaba style" },
  { id: 61, name: "Bhindi Masala", core: "Okra / Bhindi", diet: "vegan", meal: ["lunch", "dinner"], cuisines: ["north"], allergens: [], avoid: ["Onion", "Tomato", "Okra"], health: ["lowoil", "weight", "fiber"], time: "20 min", cal: 180, desc: "Stir-fried okra with masala — crispy, dry and flavourful.", pairing: "Chapati + dal + curd", steps: ["Dry bhindi well, chop — moisture causes sliminess", "Heat oil, fry bhindi on high heat till crisp", "Remove bhindi, sauté onion in same pan", "Add tomato, spices, cook 3 min", "Return bhindi, toss — cook 2 more min"], ytQ: "bhindi masala recipe" },
  { id: 62, name: "Mushroom Masala", core: "Mushroom", diet: "vegan", meal: ["lunch", "dinner"], cuisines: ["north", "fusion"], allergens: [], avoid: ["Onion", "Garlic", "Tomato", "Mushroom"], health: ["lowoil", "protein"], time: "20 min", cal: 210, desc: "Button mushrooms in spiced Indian gravy — meaty texture, low calories.", pairing: "Roti + raita + salad", steps: ["Slice mushrooms, sauté on high heat till dry", "Remove mushrooms, add oil — sauté onion golden", "Add ginger-garlic, tomato, spices — cook 8 min", "Add mushrooms back, simmer 5 min", "Finish with kasuri methi"], ytQ: "mushroom masala recipe" },
  { id: 80, name: "Vegetable Biryani", core: "Basmati Rice", diet: "veg", meal: ["lunch", "dinner"], cuisines: ["mughlai", "north"], allergens: ["dairy"], avoid: ["Onion", "Mint"], health: ["fiber"], time: "35 min", cal: 420, desc: "Fragrant basmati layered with spiced vegetables and saffron — festive one-pot meal.", pairing: "Raita + kachumber + papad", steps: ["Parboil soaked basmati rice till 70% cooked", "Cook vegetable masala with whole spices, ghee", "Layer rice and veg alternately in heavy pot", "Top with saffron milk, fried onion, mint, ghee", "Dum cook sealed with foil 20 min on low heat"], ytQ: "vegetable biryani recipe easy" },
  { id: 90, name: "Egg Bhurji", core: "Eggs", diet: "egget", meal: ["breakfast", "lunch", "dinner"], cuisines: ["north", "fusion"], allergens: ["eggs"], avoid: ["Onion", "Tomato", "Capsicum"], health: ["protein", "lowoil"], time: "10 min", cal: 260, desc: "Spiced scrambled eggs Indian-style — quick, protein-packed and endlessly customisable.", pairing: "Buttered bread / pav / roti + chai", steps: ["Beat eggs with salt, haldi, chilli powder", "Heat butter, sauté onion till translucent", "Add ginger-garlic, green chilli, tomato — cook 2 min", "Pour egg mixture — scramble gently on medium heat", "Add coriander, chat masala — serve immediately"], ytQ: "egg bhurji recipe" },
  { id: 91, name: "Egg Curry", core: "Eggs", diet: "egget", meal: ["lunch", "dinner"], cuisines: ["north"], allergens: ["eggs"], avoid: ["Onion", "Garlic", "Tomato"], health: ["protein"], time: "20 min", cal: 310, desc: "Hard-boiled eggs in richly spiced onion-tomato gravy — simple and satisfying.", pairing: "Rice / chapati + onion salad", steps: ["Hard boil eggs, peel, prick all over, shallow fry till golden", "Sauté onion till dark golden", "Add ginger-garlic, tomato, spices — cook 10 min", "Add water for gravy, bring to boil", "Add fried eggs, simmer 5 min to absorb flavours"], ytQ: "egg curry dhaba style" },
  { id: 100, name: "Butter Chicken", core: "Chicken", diet: "nonveg", meal: ["lunch", "dinner"], cuisines: ["punjabi"], allergens: ["dairy"], avoid: ["Onion", "Garlic"], health: ["protein"], time: "30 min", cal: 480, desc: "Tandoor-charred chicken in rich tomato-butter-cream sauce — the most famous Indian dish.", pairing: "Butter naan + onion salad + raita", steps: ["Marinate chicken in curd, spices, mustard oil overnight", "Grill/pan-fry till charred — smokiness is essential", "Blend boiled tomato, cashew, onion to paste", "Cook paste in butter till oil separates, add spices", "Add grilled chicken, cream, honey — simmer 8 min"], ytQ: "butter chicken restaurant style" },
  { id: 101, name: "Chicken Curry", core: "Chicken", diet: "nonveg", meal: ["lunch", "dinner"], cuisines: ["north"], allergens: [], avoid: ["Onion", "Garlic", "Tomato"], health: ["protein"], time: "30 min", cal: 420, desc: "Bone-in chicken in rustic onion-tomato masala — dhaba-style and deeply flavourful.", pairing: "Tandoori roti + sliced onion + chutney", steps: ["Sear chicken pieces on high heat till brown", "Fry onion deep golden in same oil", "Add ginger-garlic, tomato, whole spices — cook 10 min", "Add chicken back, coat with masala", "Add hot water, cover and cook 20 min on medium"], ytQ: "chicken curry dhaba style" },
  { id: 102, name: "Chicken Biryani", core: "Chicken", diet: "nonveg", meal: ["lunch", "dinner"], cuisines: ["mughlai", "hyderabadi"], allergens: [], avoid: ["Onion", "Mint"], health: ["protein"], time: "45 min", cal: 560, desc: "Aromatic basmati layered with marinated chicken — the crown jewel of Indian cuisine.", pairing: "Raita + kachumber + mirchi ka salan", steps: ["Marinate chicken with curd, spices, fried onion 2h", "Parboil soaked basmati to 70% with whole spices", "Layer marinated chicken and rice alternately", "Top with saffron milk, fried onion, mint, ghee", "Seal and dum cook 25 min on low"], ytQ: "chicken biryani easy recipe" },
  { id: 105, name: "Fish Curry", core: "Fish", diet: "nonveg", meal: ["lunch", "dinner"], cuisines: ["south", "bengali"], allergens: ["fish"], avoid: ["Onion", "Garlic", "Coconut", "Tamarind"], health: ["protein"], time: "25 min", cal: 340, desc: "Fish in tangy coconut-tamarind or mustard gravy — coastal India at its finest.", pairing: "Steamed rice + dal + papad", steps: ["Marinate fish with haldi, salt, lemon — 15 min", "Lightly fry fish till just golden — do not overcook", "Make gravy: coconut milk, tamarind, tomato, spices", "Bring gravy to boil, add curry leaves, mustard", "Slide fish in — simmer 5 min on low, do not stir hard"], ytQ: "fish curry recipe indian" },
  { id: 106, name: "Prawn Masala", core: "Prawns", diet: "nonveg", meal: ["lunch", "dinner"], cuisines: ["south", "fusion"], allergens: ["shellfish"], avoid: ["Onion", "Garlic", "Coconut", "Tomato"], health: ["protein"], time: "20 min", cal: 300, desc: "Prawns in tangy spiced masala — quick to cook and full of coastal flavour.", pairing: "Steamed rice / appam + raita", steps: ["Clean and devein prawns, marinate with haldi, chilli, salt", "Sauté onion golden in coconut oil", "Add ginger-garlic, tomato, spices — cook 5 min", "Add prawns — cook exactly 4-5 min only", "Finish with curry leaves, lemon"], ytQ: "prawn masala recipe indian" },
  { id: 110, name: "Kachumber Salad", core: "Tomato", diet: "vegan", meal: ["lunch", "dinner"], cuisines: ["north", "continental"], allergens: [], avoid: ["Onion"], health: ["lowoil", "weight", "diabetic"], time: "5 min", cal: 60, desc: "Classic Indian chopped salad — tomato, cucumber, onion, lemon. Zero cooking needed.", pairing: "Any dal-rice meal or grilled protein", steps: ["Finely dice tomato, cucumber, onion", "Squeeze fresh lemon juice over all", "Add chopped green chilli, coriander", "Season with chaat masala, salt, pepper", "Toss gently and serve immediately"], ytQ: "kachumber salad recipe" },
  { id: 111, name: "Sprout Chaat Salad", core: "Sprouts", diet: "vegan", meal: ["lunch"], cuisines: ["north", "fusion"], allergens: [], avoid: ["Onion", "Tomato"], health: ["protein", "lowoil", "weight", "fiber"], time: "10 min", cal: 150, desc: "Nutrient-dense sprouted lentils tossed with vegetables and chaat spices.", pairing: "Masala chai or fresh lime water", steps: ["Steam or boil sprouts lightly 3 min", "Add finely diced tomato, cucumber, onion", "Add chaat masala, roasted jeera powder, aamchur", "Squeeze lemon, add fresh coriander", "Toss well — serve at room temperature"], ytQ: "sprout chaat salad recipe" },
  { id: 120, name: "Pasta Arrabiata", core: "Pasta (Dry)", diet: "vegan", meal: ["lunch", "dinner"], cuisines: ["continental"], allergens: ["gluten"], avoid: ["Onion", "Garlic", "Tomato"], health: ["lowoil", "weight"], time: "20 min", cal: 380, desc: "Spicy tomato garlic pasta — Italian simplicity at its fiery best.", pairing: "Garlic bread + green salad", steps: ["Cook pasta al dente in salted water, reserve 1 cup pasta water", "Sauté minced garlic in olive oil till golden", "Add crushed tomatoes, dry red chilli, salt — simmer 10 min", "Toss hot pasta in sauce with pasta water to loosen", "Finish with fresh basil, black pepper, olive oil drizzle"], ytQ: "pasta arrabiata recipe easy" },
  { id: 121, name: "Creamy Mushroom Pasta", core: "Mushroom", diet: "veg", meal: ["lunch", "dinner"], cuisines: ["continental"], allergens: ["gluten", "dairy"], avoid: ["Onion", "Garlic", "Tomato", "Mushroom"], health: ["protein"], time: "25 min", cal: 460, desc: "Silky mushroom cream pasta with garlic and parmesan — restaurant quality at home.", pairing: "Garlic bread + rocket salad", steps: ["Cook pasta al dente, save pasta water", "Sauté sliced mushrooms on high heat till golden — don't stir too much", "Add minced garlic, cook 1 min", "Pour cream, reduce 3 min — add pasta water for consistency", "Toss in pasta, add parmesan, black pepper, fresh parsley"], ytQ: "creamy mushroom pasta recipe" },
  { id: 127, name: "Shakshuka", core: "Eggs", diet: "veg", meal: ["breakfast", "lunch"], cuisines: ["continental", "mediterranean"], allergens: ["eggs"], avoid: ["Onion", "Garlic", "Tomato", "Capsicum"], health: ["protein", "lowoil"], time: "20 min", cal: 280, desc: "Eggs poached in spiced tomato-pepper sauce — Middle Eastern brunch classic.", pairing: "Crusty bread / pita to scoop", steps: ["Sauté onion, capsicum in olive oil till soft", "Add garlic, cumin, paprika, chilli, cook 1 min", "Pour crushed tomatoes, simmer 10 min till thickened", "Make wells in sauce, crack eggs into each well", "Cover, cook 5-7 min till whites set but yolks runny"], ytQ: "shakshuka recipe easy" },
  { id: 128, name: "Avocado Toast with Egg", core: "Avocado", diet: "egget", meal: ["breakfast", "lunch"], cuisines: ["continental"], allergens: ["gluten", "eggs"], avoid: ["Onion"], health: ["protein", "lowoil", "weight"], time: "10 min", cal: 320, desc: "Smashed avocado on sourdough with poached or fried egg — the modern brunch icon.", pairing: "Fresh juice / black coffee", steps: ["Toast thick sourdough bread until crispy", "Smash avocado with lemon juice, salt, chilli flakes", "Fry or poach egg to your liking", "Spread avocado on toast generously", "Top with egg, everything bagel seasoning, microgreens"], ytQ: "avocado toast poached egg recipe" },
  
  // South Indian Recipes
  { id: 200, name: "Rava Dosa", core: "Semolina", diet: "vegan", meal: ["breakfast", "dinner"], cuisines: ["south"], allergens: [], avoid: ["Onion", "Green Chilli"], health: ["lowoil"], time: "15 min", cal: 180, desc: "Crispy lacy semolina crepe — no fermentation needed, quick South Indian favourite.", pairing: "Coconut chutney + sambar", steps: ["Mix rava, rice flour, maida with water to thin batter", "Add cumin, pepper, curry leaves, ginger, green chilli", "Rest batter 30 min", "Pour on hot tawa in circular motion — do not spread", "Cook till crispy golden, fold and serve"], ytQ: "rava dosa recipe crispy" },
  { id: 201, name: "Medu Vada", core: "Urad Dal", diet: "vegan", meal: ["breakfast"], cuisines: ["south"], allergens: [], avoid: ["Onion", "Green Chilli", "Curry Leaves"], health: ["protein"], time: "25 min", cal: 220, desc: "Crispy fried lentil doughnuts — golden outside, fluffy inside.", pairing: "Coconut chutney + sambar", steps: ["Soak urad dal 4 hours, grind to thick fluffy batter", "Add ginger, green chilli, curry leaves, pepper", "Wet hands, shape into doughnut with hole", "Deep fry on medium heat till golden brown", "Drain and serve hot with chutney"], ytQ: "medu vada recipe crispy" },
  { id: 202, name: "Pongal", core: "Basmati Rice", diet: "veg", meal: ["breakfast"], cuisines: ["south"], allergens: ["dairy"], avoid: ["Curry Leaves", "Pepper"], health: ["protein", "gutfriendly"], time: "25 min", cal: 280, desc: "Creamy rice-lentil porridge tempered with ghee and pepper — Tamil comfort food.", pairing: "Coconut chutney + sambar", steps: ["Dry roast moong dal till fragrant", "Pressure cook rice and dal together till mushy", "Temper ghee with cumin, pepper, curry leaves, cashews", "Pour tempering over pongal, mix well", "Serve hot with ghee on top"], ytQ: "ven pongal recipe" },
  { id: 203, name: "Pesarattu", core: "Moong Dal", diet: "vegan", meal: ["breakfast"], cuisines: ["south"], allergens: [], avoid: ["Onion", "Green Chilli", "Ginger"], health: ["protein", "lowoil", "diabetic"], time: "20 min", cal: 160, desc: "Green gram dosa from Andhra — protein-rich and naturally gluten-free.", pairing: "Ginger chutney + upma", steps: ["Soak whole green moong overnight", "Grind with ginger, green chilli, cumin to batter", "Spread thin on hot tawa like dosa", "Add chopped onion on top, drizzle oil", "Cook till crispy, fold and serve"], ytQ: "pesarattu recipe andhra" },
  { id: 204, name: "Appam", core: "Basmati Rice", diet: "vegan", meal: ["breakfast", "dinner"], cuisines: ["south", "kerala"], allergens: [], avoid: [], health: ["lowoil", "gutfriendly"], time: "20 min", cal: 150, desc: "Lacy fermented rice hoppers with soft centre — Kerala's pride.", pairing: "Coconut milk stew + egg curry", steps: ["Soak rice 4 hours, grind with coconut to smooth batter", "Add yeast or toddy, ferment overnight", "Heat appam pan, pour batter, swirl to coat sides", "Cover and cook till edges are lacy crisp", "Centre should be soft and spongy"], ytQ: "appam recipe kerala" },
  { id: 205, name: "Puttu", core: "Basmati Rice", diet: "vegan", meal: ["breakfast"], cuisines: ["south", "kerala"], allergens: [], avoid: [], health: ["lowoil", "fiber"], time: "20 min", cal: 200, desc: "Steamed rice cake cylinders layered with coconut — traditional Kerala breakfast.", pairing: "Kadala curry + banana", steps: ["Mix rice flour with water to moist crumbly texture", "Layer coconut and rice flour in puttu maker", "Steam 5-7 minutes till cooked through", "Push out cylinder, serve hot", "Best with kadala curry and ripe banana"], ytQ: "puttu recipe kerala" },
  { id: 206, name: "Uttapam", core: "Dosa Batter", diet: "vegan", meal: ["breakfast", "dinner"], cuisines: ["south"], allergens: [], avoid: ["Onion", "Tomato", "Green Chilli"], health: ["fiber", "gutfriendly"], time: "15 min", cal: 200, desc: "Thick fermented pancake topped with vegetables — South Indian pizza.", pairing: "Coconut chutney + sambar", steps: ["Pour thick dosa batter on hot tawa", "Spread slightly thick, not thin like dosa", "Top with onion, tomato, green chilli, coriander", "Press toppings gently, drizzle oil", "Cook covered till bottom is golden"], ytQ: "uttapam recipe soft" },
  { id: 207, name: "Rasam", core: "Tomato", diet: "vegan", meal: ["lunch", "dinner"], cuisines: ["south"], allergens: [], avoid: ["Tamarind", "Tomato", "Garlic"], health: ["lowoil", "gutfriendly", "diabetic"], time: "15 min", cal: 80, desc: "Tangy spiced tomato-tamarind soup — digestive and warming.", pairing: "Steamed rice + papad", steps: ["Extract tamarind juice, mix with crushed tomato", "Add rasam powder, turmeric, salt, jaggery", "Boil till frothy and aromatic", "Temper with mustard, cumin, curry leaves, dry chilli", "Pour over rice or drink as soup"], ytQ: "rasam recipe south indian" },
  { id: 208, name: "Kootu", core: "Toor Dal", diet: "vegan", meal: ["lunch", "dinner"], cuisines: ["south"], allergens: [], avoid: ["Coconut"], health: ["protein", "fiber"], time: "25 min", cal: 180, desc: "Lentils and vegetables in coconut gravy — Tamil Nadu staple.", pairing: "Steamed rice + rasam + papad", steps: ["Cook dal and vegetables together till soft", "Grind coconut, cumin, pepper to paste", "Add coconut paste to dal-vegetable mix", "Simmer 5 minutes till flavours blend", "Temper with mustard, curry leaves, dry chilli"], ytQ: "kootu recipe tamil" },
  { id: 209, name: "Aviyal", core: "Coconut (Fresh)", diet: "vegan", meal: ["lunch", "dinner"], cuisines: ["south", "kerala"], allergens: [], avoid: ["Coconut", "Curd"], health: ["fiber", "lowoil"], time: "25 min", cal: 200, desc: "Mixed vegetables in coconut-curd gravy — Kerala Onam sadya essential.", pairing: "Rice + sambar + rasam", steps: ["Cut vegetables into long strips", "Cook in minimal water with turmeric, salt", "Grind coconut, cumin, green chilli to coarse paste", "Add paste to vegetables, mix gently", "Add curd, curry leaves, drizzle coconut oil"], ytQ: "aviyal recipe kerala" },
  { id: 210, name: "Thoran", core: "Cabbage", diet: "vegan", meal: ["lunch", "dinner"], cuisines: ["south", "kerala"], allergens: [], avoid: ["Coconut", "Mustard Seeds"], health: ["fiber", "lowoil", "diabetic"], time: "15 min", cal: 120, desc: "Dry stir-fried vegetables with coconut — Kerala everyday side dish.", pairing: "Rice + sambar + fish curry", steps: ["Finely chop vegetables", "Temper mustard, urad dal, curry leaves, dry chilli", "Add vegetables, turmeric, salt — cook covered", "Add grated coconut when almost done", "Toss well, cook 2 more minutes uncovered"], ytQ: "thoran recipe kerala" },
  { id: 211, name: "Olan", core: "Coconut Milk", diet: "vegan", meal: ["lunch", "dinner"], cuisines: ["south", "kerala"], allergens: [], avoid: ["Coconut"], health: ["lowoil"], time: "20 min", cal: 180, desc: "Ash gourd and cowpeas in thin coconut milk — subtle and elegant.", pairing: "Rice + sambar + thoran", steps: ["Soak and cook cowpeas till soft", "Cut ash gourd into cubes", "Cook ash gourd in thin coconut milk with salt", "Add cooked cowpeas, green chillies slit", "Finish with thick coconut milk, curry leaves"], ytQ: "olan recipe kerala onam" },
  { id: 212, name: "Bisi Bele Bath", core: "Basmati Rice", diet: "veg", meal: ["lunch", "dinner"], cuisines: ["south", "karnataka"], allergens: ["dairy"], avoid: ["Tamarind"], health: ["protein", "fiber"], time: "30 min", cal: 350, desc: "Spiced rice-lentil-vegetable one-pot — Karnataka's beloved comfort food.", pairing: "Boondi raita + papad + pickle", steps: ["Cook rice and toor dal together till mushy", "Cook mixed vegetables separately", "Make bisi bele bath powder or use ready masala", "Mix rice-dal, vegetables, tamarind extract, spice powder", "Temper with ghee, mustard, curry leaves — serve hot"], ytQ: "bisi bele bath recipe karnataka" },
  { id: 213, name: "Puliyodarai (Tamarind Rice)", core: "Basmati Rice", diet: "vegan", meal: ["lunch"], cuisines: ["south"], allergens: ["nuts"], avoid: ["Tamarind", "Peanuts"], health: ["fiber"], time: "20 min", cal: 280, desc: "Tangy tamarind rice with aromatic spices — temple prasadam favourite.", pairing: "Papad + curd + pickle", steps: ["Cook rice and cool completely, spread out", "Make puliyodarai paste: tamarind, jaggery, spices, oil", "Temper mustard, peanuts, chana dal, curry leaves", "Mix paste and tempering with cooled rice", "Sesame oil is essential for authentic flavour"], ytQ: "puliyodarai recipe temple style" },
  { id: 214, name: "Curd Rice (Thayir Sadam)", core: "Basmati Rice", diet: "veg", meal: ["lunch", "dinner"], cuisines: ["south"], allergens: ["dairy"], avoid: ["Mustard Seeds"], health: ["gutfriendly", "lowoil"], time: "10 min", cal: 220, desc: "Cooling rice mixed with curd — South Indian summer essential and meal ender.", pairing: "Pickle + papad", steps: ["Mash cooked rice while still warm", "Add fresh curd, milk, salt — mix well", "Temper mustard, urad dal, curry leaves, ginger", "Add pomegranate, grapes, cucumber optionally", "Serve chilled or at room temperature"], ytQ: "curd rice recipe south indian" },
  { id: 215, name: "Lemon Rice", core: "Basmati Rice", diet: "vegan", meal: ["lunch"], cuisines: ["south"], allergens: ["nuts"], avoid: ["Peanuts", "Lemon"], health: ["lowoil"], time: "15 min", cal: 250, desc: "Zesty lemon-tempered rice with peanuts — quick and refreshing.", pairing: "Papad + pickle + raita", steps: ["Cook rice, cool and spread out", "Temper mustard, chana dal, peanuts, curry leaves", "Add turmeric, green chillies, asafoetida", "Squeeze fresh lemon juice over rice", "Toss with tempering, garnish coriander"], ytQ: "lemon rice recipe south indian" },
  { id: 216, name: "Coconut Rice", core: "Basmati Rice", diet: "vegan", meal: ["lunch"], cuisines: ["south"], allergens: [], avoid: ["Coconut"], health: ["fiber"], time: "15 min", cal: 280, desc: "Fragrant rice with fresh coconut and curry leaves — simple temple-style.", pairing: "Sambar + rasam + papad", steps: ["Cook rice, cool and keep aside", "Grate fresh coconut", "Temper mustard, urad dal, chana dal, curry leaves", "Add coconut, sauté 2 minutes", "Toss with rice, add salt to taste"], ytQ: "coconut rice recipe south indian" },
  { id: 217, name: "Mysore Pak", core: "Besan (Gram Flour)", diet: "veg", meal: ["breakfast"], cuisines: ["south", "karnataka"], allergens: ["dairy"], avoid: [], health: [], time: "25 min", cal: 180, desc: "Melt-in-mouth gram flour fudge — royal Mysore sweet.", pairing: "Filter coffee / milk", steps: ["Roast besan in ghee till fragrant", "Make sugar syrup of one-string consistency", "Add roasted besan to syrup, mix continuously", "Keep adding hot ghee gradually while stirring", "Pour in greased tray, cut when set"], ytQ: "mysore pak recipe soft" },
  { id: 218, name: "Filter Kaapi (South Indian Coffee)", core: "Milk", diet: "veg", meal: ["breakfast"], cuisines: ["south"], allergens: ["dairy"], avoid: [], health: [], time: "10 min", cal: 80, desc: "Strong brewed coffee with frothy milk — the iconic South Indian brew.", pairing: "Idli / dosa / vada", steps: ["Add coffee powder to filter, press gently", "Pour hot water, let decoction drip 10 min", "Heat milk, add sugar to taste", "Mix decoction and milk in dabara-tumbler", "Pour between vessels to create froth"], ytQ: "filter coffee recipe south indian" },

  // Millet Recipes
  { id: 250, name: "Ragi Mudde", core: "Ragi (Finger Millet)", diet: "vegan", meal: ["lunch", "dinner"], cuisines: ["south", "karnataka"], allergens: [], avoid: [], health: ["fiber", "diabetic", "weight", "iron"], time: "15 min", cal: 180, desc: "Traditional ragi balls — Karnataka staple, diabetic-friendly and filling.", pairing: "Sambar / saaru + greens", steps: ["Boil water with salt", "Slowly add ragi flour while stirring continuously", "Stir vigorously to avoid lumps", "Cook till mixture leaves sides of pan", "Shape into smooth balls while hot, serve with sambar"], ytQ: "ragi mudde recipe karnataka" },
  { id: 251, name: "Ragi Dosa", core: "Ragi (Finger Millet)", diet: "vegan", meal: ["breakfast", "dinner"], cuisines: ["south"], allergens: [], avoid: ["Onion"], health: ["fiber", "diabetic", "weight", "iron"], time: "20 min", cal: 150, desc: "Nutritious finger millet crepes — crispy, healthy and gluten-free.", pairing: "Coconut chutney + sambar", steps: ["Mix ragi flour with rice flour, cumin, salt", "Add water to make thin batter, rest 30 min", "Add onion, coriander, curry leaves", "Spread thin on hot tawa, cook crispy", "Serve hot with chutney"], ytQ: "ragi dosa recipe healthy" },
  { id: 252, name: "Ragi Roti", core: "Ragi (Finger Millet)", diet: "vegan", meal: ["lunch", "dinner"], cuisines: ["south", "karnataka"], allergens: [], avoid: ["Onion"], health: ["fiber", "diabetic", "weight", "iron"], time: "20 min", cal: 160, desc: "Soft finger millet flatbread — wholesome Karnataka breakfast or dinner.", pairing: "Chutney + curry + pickle", steps: ["Mix ragi flour with hot water, salt to dough", "Add chopped onion, coriander, cumin", "Pat into thin rotis on banana leaf or plastic", "Cook on hot tawa without oil", "Serve with ghee or chutney"], ytQ: "ragi roti recipe soft" },
  { id: 253, name: "Ragi Porridge", core: "Ragi (Finger Millet)", diet: "veg", meal: ["breakfast"], cuisines: ["south"], allergens: ["dairy"], avoid: [], health: ["fiber", "diabetic", "weight", "iron"], time: "15 min", cal: 180, desc: "Creamy finger millet porridge — perfect for babies, elders and fitness.", pairing: "Banana / dates / jaggery", steps: ["Mix ragi flour with cold water to avoid lumps", "Add to boiling water, stir continuously", "Cook 8-10 min till thick and cooked", "Add milk, jaggery or honey to taste", "Top with cardamom, nuts if desired"], ytQ: "ragi porridge recipe healthy" },
  { id: 254, name: "Jowar Roti", core: "Jowar (Sorghum)", diet: "vegan", meal: ["lunch", "dinner"], cuisines: ["maharashtra", "karnataka"], allergens: [], avoid: [], health: ["fiber", "diabetic", "weight", "gutfriendly"], time: "20 min", cal: 140, desc: "Soft sorghum flatbread — Maharashtra and Karnataka staple, gluten-free.", pairing: "Pitla / zunka + thecha + lasun chutney", steps: ["Knead jowar flour with hot water to soft dough", "Divide into balls, pat between palms or on plastic", "Transfer to hot tawa, cook both sides", "Press with cloth to puff slightly", "Apply ghee and serve hot"], ytQ: "jowar roti recipe soft maharashtra" },
  { id: 255, name: "Jowar Upma", core: "Jowar (Sorghum)", diet: "vegan", meal: ["breakfast"], cuisines: ["south"], allergens: [], avoid: ["Onion", "Mustard Seeds"], health: ["fiber", "diabetic", "weight"], time: "20 min", cal: 200, desc: "Savoury sorghum porridge with vegetables — healthy twist on classic upma.", pairing: "Coconut chutney + pickle", steps: ["Dry roast jowar rava till aromatic", "Temper mustard, urad dal, curry leaves, onion", "Add mixed vegetables, cook 3 min", "Add water, salt, bring to boil", "Add jowar rava, stir well, cook covered 5 min"], ytQ: "jowar upma recipe healthy" },
  { id: 256, name: "Bajra Roti", core: "Bajra (Pearl Millet)", diet: "vegan", meal: ["lunch", "dinner"], cuisines: ["rajasthani", "gujarati"], allergens: [], avoid: [], health: ["fiber", "diabetic", "weight", "iron"], time: "20 min", cal: 150, desc: "Pearl millet flatbread — Rajasthani winter staple, iron-rich and warming.", pairing: "Lehsun chutney + gur + ghee + dal", steps: ["Knead bajra flour with warm water", "Make balls, pat into thick rotis", "Cook on hot tawa on both sides", "Hold directly over flame to puff", "Apply generous ghee, serve with jaggery"], ytQ: "bajra roti recipe rajasthani" },
  { id: 257, name: "Bajra Khichdi", core: "Bajra (Pearl Millet)", diet: "veg", meal: ["lunch", "dinner"], cuisines: ["rajasthani", "gujarati"], allergens: ["dairy"], avoid: [], health: ["fiber", "diabetic", "protein"], time: "25 min", cal: 280, desc: "Pearl millet and lentil comfort meal — warming, nutritious one-pot dish.", pairing: "Kadhi + papad + pickle", steps: ["Wash bajra and moong dal together", "Pressure cook with turmeric, salt, water", "Let it be slightly mushy", "Temper ghee with cumin, hing", "Mix tempering, serve hot with ghee on top"], ytQ: "bajra khichdi recipe gujarati" },
  { id: 258, name: "Foxtail Millet Pulao", core: "Foxtail Millet", diet: "vegan", meal: ["lunch", "dinner"], cuisines: ["south"], allergens: [], avoid: ["Onion"], health: ["fiber", "diabetic", "weight"], time: "25 min", cal: 240, desc: "Fragrant millet pulao with vegetables — healthy rice alternative.", pairing: "Raita + papad", steps: ["Wash and soak foxtail millet 15 min", "Sauté whole spices, onion, ginger in oil", "Add mixed vegetables, cook 3 min", "Add millet, 2 cups water, salt", "Cook covered on low 15 min, fluff and serve"], ytQ: "foxtail millet pulao recipe" },
  { id: 259, name: "Foxtail Millet Pongal", core: "Foxtail Millet", diet: "veg", meal: ["breakfast"], cuisines: ["south"], allergens: ["dairy"], avoid: ["Pepper"], health: ["fiber", "diabetic", "protein"], time: "25 min", cal: 250, desc: "Millet version of classic pongal — creamy, peppery and nutritious.", pairing: "Coconut chutney + sambar", steps: ["Dry roast moong dal till fragrant", "Cook foxtail millet and dal together till soft", "Temper ghee with cumin, pepper, curry leaves, ginger", "Pour over millet-dal mixture, mix well", "Serve hot topped with more ghee"], ytQ: "foxtail millet pongal recipe" },
  { id: 260, name: "Little Millet Rice (Samai)", core: "Little Millet (Samai)", diet: "vegan", meal: ["lunch", "dinner"], cuisines: ["south"], allergens: [], avoid: [], health: ["fiber", "diabetic", "weight"], time: "20 min", cal: 180, desc: "Simple steamed little millet — perfect low-glycemic rice substitute.", pairing: "Any curry + rasam + sambar", steps: ["Wash little millet 2-3 times", "Soak 15 minutes, drain", "Add 2 cups water per cup millet, salt", "Cook covered on low 15 min", "Fluff with fork, serve like rice"], ytQ: "little millet rice recipe samai" },
  { id: 261, name: "Millet Idli", core: "Little Millet (Samai)", diet: "vegan", meal: ["breakfast"], cuisines: ["south"], allergens: [], avoid: [], health: ["fiber", "diabetic", "gutfriendly"], time: "25 min", cal: 140, desc: "Soft fermented millet idlis — healthier version of the South Indian classic.", pairing: "Sambar + coconut chutney", steps: ["Soak little millet and urad dal separately 4 hours", "Grind urad dal fluffy, then grind millet coarse", "Mix both, ferment overnight", "Grease idli moulds, pour batter", "Steam 12-15 min till done"], ytQ: "millet idli recipe soft" },
  { id: 262, name: "Barnyard Millet Kheer", core: "Barnyard Millet", diet: "veg", meal: ["breakfast"], cuisines: ["north", "south"], allergens: ["dairy"], avoid: [], health: ["fiber", "diabetic"], time: "25 min", cal: 220, desc: "Creamy millet pudding — festive yet diabetic-friendly dessert.", pairing: "As dessert after any meal", steps: ["Dry roast barnyard millet lightly", "Cook in milk on low heat stirring often", "Add jaggery or sugar when millet is soft", "Add cardamom, saffron, nuts", "Serve warm or chilled"], ytQ: "millet kheer recipe healthy" },
  { id: 263, name: "Millet Biryani", core: "Foxtail Millet", diet: "veg", meal: ["lunch", "dinner"], cuisines: ["mughlai", "fusion"], allergens: ["dairy"], avoid: ["Onion", "Mint"], health: ["fiber", "diabetic", "protein"], time: "35 min", cal: 320, desc: "Aromatic layered millet biryani — healthy twist on the classic.", pairing: "Raita + kachumber", steps: ["Soak foxtail millet 20 min", "Make vegetable masala with whole spices, curd", "Par-cook millet to 70%", "Layer millet and masala in pot", "Dum cook 15 min on low heat"], ytQ: "millet biryani recipe healthy" },
];

/* ─── Weekdays ─── */
const WD = [
  { day: "Mon", full: "Monday" },
  { day: "Tue", full: "Tuesday" },
  { day: "Wed", full: "Wednesday" },
  { day: "Thu", full: "Thursday" },
  { day: "Fri", full: "Friday" },
  { day: "Sat", full: "Saturday" },
  { day: "Sun", full: "Sunday" },
];
const DAY_COL = ["#cf4a17", "#b8852a", "#2a9d8f", "#2980b9", "#8e44ad", "#d44c1a", "#27ae60"];

/* ─── Engine Functions ─── */
function dietOk(r: Recipe, d: string[]) {
  const p = d[0] || "veg";
  if (p === "nonveg") return true;
  if (p === "egget") return ["veg", "vegan", "egget"].includes(r.diet);
  if (p === "vegan") return r.diet === "vegan";
  if (p === "jain") return ["veg", "vegan"].includes(r.diet);
  return ["veg", "vegan"].includes(r.diet);
}

function filterDB(prefs: Prefs): Recipe[] {
  const diet = prefs.diet || ["veg"];
  const cuisine = prefs.cuisine || [];
  const health = prefs.health || [];
  const allergies = prefs.allergies || [];
  const dislikes = prefs.dislikes || [];
  const macros = prefs.macroTargets || { goal: "none", calories: 0, protein: 0, carbs: 0, fat: 0 };
  return DB.filter((r) => {
    if (!dietOk(r, diet)) return false;
    if (r.allergens.some((a) => allergies.includes(a))) return false;
    if (r.avoid.some((a) => dislikes.includes(a))) return false;
    return true;
  })
    .map((r) => ({
      ...r,
      score:
        cuisine.filter((c) => r.cuisines.includes(c)).length * 2 +
        health.filter((h) => r.health.includes(h)).length +
        macroFitScore(r, macros),
    }))
    .sort((a, b) => (b.score || 0) - (a.score || 0));
}

function matchFridge(selNames: string[], prefs: Prefs): Recipe[] {
  const allergies = prefs.allergies || [];
  const dislikes = prefs.dislikes || [];
  const cuisine = prefs.cuisine || [];
  const health = prefs.health || [];
  const macros = prefs.macroTargets || { goal: "none", calories: 0, protein: 0, carbs: 0, fat: 0 };

  const has = (t: string) =>
    selNames.some(
      (s) =>
        s.toLowerCase().includes(t.toLowerCase()) ||
        t.toLowerCase().includes(s.toLowerCase())
    );
  
  return DB.filter((r) => {
    if (r.allergens.some((a) => allergies.includes(a))) return false;
    if (r.avoid.some((a) => dislikes.includes(a))) return false;
    return has(r.core);
  })
    .map((r) => {
      const coreMatch    = has(r.core) ? 5 : 0;
      const cuisineScore = cuisine.filter((c) => r.cuisines.includes(c)).length * 2;
      const healthScore  = health.filter((h) => r.health.includes(h)).length;
      const macroScore   = macroFitScore(r, macros);
      return {
        ...r,
        score: coreMatch + cuisineScore + healthScore + macroScore,
      };
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0));
}

/* ─── Recipe Visuals: Emoji + Gradient ─── */
function getRecipeEmoji(r: Recipe): string {
  const core = r.core.toLowerCase();
  if (/chicken|murgh/.test(core))                     return "🍗";
  if (/mutton|lamb|gosht/.test(core))                 return "🥩";
  if (/prawn|shrimp/.test(core))                      return "🦐";
  if (/fish/.test(core))                              return "🐟";
  if (/\begg\b/.test(core))                           return "🥚";
  if (/paneer/.test(core))                            return "🧀";
  if (/rajma|kidney/.test(core))                      return "🫘";
  if (/chana|chickpea|chole/.test(core))              return "🫘";
  if (/dal|lentil|moong|toor|masoor|urad/.test(core)) return "🫘";
  if (/rice|biryani|pulao/.test(core))                return "🍚";
  if (/dosa|batter/.test(core))                       return "🥞";
  if (/wheat|atta|paratha|roti|naan|bread/.test(core))return "🫓";
  if (/potato|aloo/.test(core))                       return "🥔";
  if (/spinach|palak/.test(core))                     return "🥬";
  if (/tomato/.test(core))                            return "🍅";
  if (/carrot/.test(core))                            return "🥕";
  if (/cauliflower|gobi/.test(core))                  return "🥦";
  if (/pumpkin|gourd/.test(core))                     return "🎃";
  if (/mushroom/.test(core))                          return "🍄";
  if (/banana/.test(core))                            return "🍌";
  if (/mango/.test(core))                             return "🥭";
  if (/coconut/.test(core))                           return "🥥";
  if (/peas|matar/.test(core))                        return "🫛";
  if (/milk|cream|curd|yogurt/.test(core))            return "🥛";
  if (/besan|gram/.test(core))                        return "🥣";
  if (/semolina|suji|rava|upma/.test(core))           return "🥣";
  if (/poha/.test(core))                              return "🌾";
  if (/oats/.test(core))                              return "🥣";
  if (/tofu|soya/.test(core))                         return "🫘";
  if (/corn|maize/.test(core))                        return "🌽";
  if (/halwa|kheer|sweet|barfi|ladoo/.test(core))     return "🍮";
  if (/chai|tea/.test(core))                          return "🍵";
  if (/coffee/.test(core))                            return "☕";
  return "🍛";
}

function getRecipeGradient(r: Recipe): { g1: string; g2: string; dot: string } {
  if (r.diet === "nonveg") {
    const c = r.core.toLowerCase();
    if (/chicken/.test(c))     return { g1: "#2d0e0e", g2: "#1a0606", dot: "#ef4444" };
    if (/mutton|lamb/.test(c)) return { g1: "#2d1205", g2: "#1a0a03", dot: "#dc2626" };
    if (/prawn|fish/.test(c))  return { g1: "#0a1a2d", g2: "#051015", dot: "#3b82f6" };
    return { g1: "#2d0e0e", g2: "#1a0606", dot: "#ef4444" };
  }
  if (r.diet === "vegan")  return { g1: "#0a1f0a", g2: "#051205", dot: "#22c55e" };
  if (r.diet === "egget")  return { g1: "#2a1f00", g2: "#1a1300", dot: "#eab308" };
  // veg — by cuisine
  const c = r.cuisines[0] || "";
  if (c === "south")          return { g1: "#0d1a0a", g2: "#051005", dot: "#16a34a" };
  if (c === "punjabi")        return { g1: "#2a1200", g2: "#1a0800", dot: "#ea580c" };
  if (c === "north")          return { g1: "#1a0d00", g2: "#100800", dot: "#f97316" };
  if (c === "gujarati")       return { g1: "#1a1600", g2: "#100e00", dot: "#eab308" };
  if (c === "maharashtra")    return { g1: "#0a1400", g2: "#050a00", dot: "#84cc16" };
  if (c === "bengali")        return { g1: "#1a0800", g2: "#100500", dot: "#f59e0b" };
  if (c === "rajasthani")     return { g1: "#1f0d00", g2: "#140800", dot: "#f97316" };
  if (c === "mughlai")        return { g1: "#1a0a1a", g2: "#100510", dot: "#a855f7" };
  if (c === "hyderabadi")     return { g1: "#1a1200", g2: "#100b00", dot: "#d97706" };
  if (c === "continental")    return { g1: "#0a0a1a", g2: "#050510", dot: "#6366f1" };
  if (c === "mediterranean")  return { g1: "#001a1a", g2: "#001010", dot: "#06b6d4" };
  return { g1: "#1a0d00", g2: "#100800", dot: "#ea580c" };
}

/* ─── Macro Estimation (per serving) ─── */
function estimateMacros(r: Recipe): { protein: number; carbs: number; fat: number } {
  const cal = r.cal;
  let pPct: number, cPct: number, fPct: number;

  const isHighProtein = r.health.includes("protein") || r.diet === "nonveg" || r.diet === "egget";
  const isLowCarb     = r.health.includes("lowcarb");
  const isDal         = /moong|toor|masoor|chana|rajma|urad|lobia|chickpea|soya|tofu|paneer/.test(r.core.toLowerCase());
  const isGrain       = /rice|wheat|atta|semolina|suji|poha|dosa|batter|bread|pasta|ragi|jowar|bajra|millet/.test(r.core.toLowerCase());

  if (isHighProtein) {
    [pPct, cPct, fPct] = [0.35, 0.35, 0.30];
  } else if (isLowCarb) {
    [pPct, cPct, fPct] = [0.30, 0.20, 0.50];
  } else if (isDal) {
    [pPct, cPct, fPct] = [0.25, 0.55, 0.20];
  } else if (isGrain) {
    [pPct, cPct, fPct] = [0.10, 0.70, 0.20];
  } else {
    [pPct, cPct, fPct] = [0.15, 0.55, 0.30];
  }

  return {
    protein: Math.round((cal * pPct) / 4),
    carbs:   Math.round((cal * cPct) / 4),
    fat:     Math.round((cal * fPct) / 9),
  };
}

/* Returns 0–3 bonus points for how well a recipe fits macro targets */
function macroFitScore(r: Recipe, targets: MacroTargets): number {
  if (!targets || targets.goal === "none" || targets.calories === 0) return 0;
  const m = estimateMacros(r);
  // Targets per meal = daily / 3
  const tCal = targets.calories / 3;
  const tPro = targets.protein / 3;
  const tCarb = targets.carbs / 3;
  const tFat  = targets.fat / 3;

  const within = (val: number, target: number, tolerance: number) =>
    target > 0 && Math.abs(val - target) / target <= tolerance;

  let score = 0;
  if (within(r.cal,    tCal,  0.25)) score++;
  if (within(m.protein, tPro,  0.30)) score++;
  if (within(m.carbs,   tCarb, 0.30)) score++;
  if (within(m.fat,     tFat,  0.35)) score++;
  return score;
}

function isoWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  return Math.round((d.getTime() - new Date(d.getFullYear(), 0, 4).getTime()) / 604800000);
}

function generatePlan(prefs: Prefs, extraSeed = 0) {
  const safePrefs = {
    diet: ["veg"],
    cuisine: [],
    health: [],
    allergies: [],
    dislikes: [],
    ...prefs,
    allergies: prefs.allergies || [],
    dislikes: prefs.dislikes || [],
  };
  const pool = filterDB(safePrefs);
  const breakfasts = pool.filter((r) => r.meal.includes("breakfast"));
  const lunches = pool.filter((r) => r.meal.includes("lunch"));
  const dinners = pool.filter((r) => r.meal.includes("dinner"));

  const weekSeed = isoWeek() * 100 + extraSeed;
  const sh = (arr: Recipe[], s: number) => {
    if (!arr.length) return arr;
    const a = [...arr];
    let h = s;
    for (let i = a.length - 1; i > 0; i--) {
      h = (h ^ (h << 13)) ^ (h >> 17);
      h = (h ^ (h << 5)) >>> 0;
      const j = Math.abs(h) % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const sb = sh(breakfasts, weekSeed + 1);
  const sl = sh(lunches, weekSeed + 2);
  const sd = sh(dinners, weekSeed + 3);
  const pick = (arr: Recipe[], i: number) => (arr.length ? arr[i % arr.length] : null);

  return WD.map((d, i) => ({
    ...d,
    color: DAY_COL[i],
    breakfast: pick(sb, i),
    lunch: pick(sl, i),
    dinner: pick(sd, i),
  }));
}

/* ─── UI Components ─── */
const Lbl = ({ c = T.textSub, children }: { c?: string; children: React.ReactNode }) => (
  <span
    style={{
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: c,
    }}
  >
    {children}
  </span>
);

const Tag = ({
  bg = T.card2,
  color = T.textSub,
  bd = T.border2,
  children,
}: {
  bg?: string;
  color?: string;
  bd?: string;
  children: React.ReactNode;
}) => (
  <span
    style={{
      background: bg,
      color,
      fontSize: 11,
      fontWeight: 500,
      padding: "4px 10px",
      borderRadius: 6,
      border: `1px solid ${bd}`,
      whiteSpace: "nowrap",
      lineHeight: 1.9,
    }}
  >
    {children}
  </span>
);

const Div = () => <div style={{ height: 1, background: T.border, margin: "20px 0" }} />;

const BackBtn = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="tap"
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      color: T.textSub,
      fontSize: 13,
      fontWeight: 500,
      cursor: "pointer",
      marginBottom: 20,
      padding: "8px 14px",
      fontFamily: "inherit",
      boxShadow: "var(--fc-shadow-sm)",
    }}
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12,19 5,12 12,5" />
    </svg>
    Back
  </button>
);

const YTBtn = ({ query, label }: { query: string; label: string }) => (
  <button
    onClick={() => yt(query)}
    className="tap"
    style={{
      display: "flex",
      alignItems: "center",
      gap: 9,
      width: "100%",
      background: "#180808",
      border: "1px solid #c0000022",
      borderRadius: 5,
      padding: "9px 12px",
      color: "#e05040",
      fontSize: 12,
      fontWeight: 500,
      marginBottom: 5,
      fontFamily: "inherit",
      cursor: "pointer",
    }}
  >
    <svg width="13" height="13" viewBox="0 0 24 24" fill="#e05040">
      <path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.1 2.8 12 2.8 12 2.8s-4.1 0-6.8.1C4.6 3 3.3 3 2.2 4.2 1.3 5 1 7 1 7S.7 9.3.7 11.5v2.1c0 2.2.3 4.4.3 4.4s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.3 22.2 12 22.2 12 22.2s4.1 0 6.8-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.2.3-4.4v-2.1C23.3 9.3 23 7 23 7zM9.7 15.5V8.4l8.1 3.6-8.1 3.5z" />
    </svg>
    <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
    <span style={{ color: "#e0504044", fontSize: 10 }}>↗</span>
  </button>
);

const WA_SVG = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const WABtn = ({ message, label = "Send to Cook" }: { message: string; label?: string }) => (
  <button
    onClick={() => sendToWhatsApp(message)}
    className="tap"
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "100%",
      background: "#25d366",
      border: "none",
      borderRadius: 14,
      padding: "14px 18px",
      color: "#fff",
      fontSize: 14,
      fontWeight: 700,
      marginBottom: 5,
      fontFamily: "inherit",
      cursor: "pointer",
      boxShadow: "0 4px 18px -4px rgba(37,211,102,0.45)",
    }}
  >
    {WA_SVG}
    <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" opacity={0.7}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>
  </button>
);

const ToggleChip = ({
  label,
  on,
  onClick,
  sub,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  sub?: string;
}) => (
  <button
    onClick={onClick}
    className="tap ring-selection"
    style={{
      background: on ? T.accent : T.card,
      color: on ? "#fff" : T.text,
      border: `1.5px solid ${on ? T.accent : T.border}`,
      borderRadius: 10,
      padding: sub ? "10px 14px" : "8px 14px",
      fontSize: 13,
      fontWeight: 500,
      cursor: "pointer",
      fontFamily: "inherit",
      textAlign: "left",
      boxShadow: on ? "var(--fc-shadow-glow)" : "var(--fc-shadow-sm)",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {on && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20,6 9,17 4,12" />
        </svg>
      )}
      <span>{label}</span>
    </div>
    {sub && (
      <div style={{ fontSize: 11, color: on ? "rgba(255,255,255,.7)" : T.textSub, marginTop: 4, lineHeight: 1.4 }}>
        {sub}
      </div>
    )}
  </button>
);

/* ─── Nav Icons ─── */
const NAV_ICONS: Record<string, JSX.Element> = {
  home: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  ),
  fridge: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="4" y1="10" x2="20" y2="10" />
      <line x1="9" y1="6" x2="9" y2="8" />
      <line x1="9" y1="13" x2="9" y2="18" />
    </svg>
  ),
  plan: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  profile: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  grocery: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  ),
};

/* ─── Category Card Styles (Theme-aware with CSS vars) ─── */
const CAT_STYLE: Record<string, { g1: string; g2: string; dot: string }> = {
  Protein: { g1: "var(--cat-protein-g1, #3d1a08)", g2: "var(--cat-protein-g2, #1a0a04)", dot: "#e86820" },
  Eggs: { g1: "var(--cat-eggs-g1, #3a2808)", g2: "var(--cat-eggs-g2, #1a1204)", dot: "#d4a020" },
  Chicken: { g1: "var(--cat-chicken-g1, #3d0c0c)", g2: "var(--cat-chicken-g2, #1a0606)", dot: "#e83030" },
  Mutton: { g1: "var(--cat-mutton-g1, #3d0c0c)", g2: "var(--cat-mutton-g2, #1a0606)", dot: "#d82828" },
  Seafood: { g1: "var(--cat-seafood-g1, #083050)", g2: "var(--cat-seafood-g2, #041828)", dot: "#20a0e8" },
  Dal: { g1: "var(--cat-dal-g1, #3a2008)", g2: "var(--cat-dal-g2, #1a0e04)", dot: "#e88030" },
  Vegetables: { g1: "var(--cat-veg-g1, #103010)", g2: "var(--cat-veg-g2, #081808)", dot: "#30c830" },
  Greens: { g1: "var(--cat-greens-g1, #0c2c0c)", g2: "var(--cat-greens-g2, #061606)", dot: "#40d840" },
  Dairy: { g1: "var(--cat-dairy-g1, #181840)", g2: "var(--cat-dairy-g2, #0c0c24)", dot: "#7070f0" },
  Grains: { g1: "var(--cat-grains-g1, #302008)", g2: "var(--cat-grains-g2, #181004)", dot: "#d09030" },
  Nuts: { g1: "var(--cat-nuts-g1, #2a1808)", g2: "var(--cat-nuts-g2, #140c04)", dot: "#c06828" },
  Pantry: { g1: "var(--cat-pantry-g1, #301008)", g2: "var(--cat-pantry-g2, #180804)", dot: "#e05030" },
  Continental: { g1: "var(--cat-cont-g1, #081828)", g2: "var(--cat-cont-g2, #040c18)", dot: "#3080e0" },
  Sweeteners: { g1: "var(--cat-sweet-g1, #2a1600)", g2: "var(--cat-sweet-g2, #140b00)", dot: "#e8a010" },
  Spices: { g1: "var(--cat-spice-g1, #2e0e00)", g2: "var(--cat-spice-g2, #160700)", dot: "#e04018" },
};

/* ─── Ingredient Card ─── */
function IngCard({
  ing,
  sel,
  onToggle,
}: {
  ing: Ingredient;
  sel: boolean;
  onToggle: () => void;
}) {
  const cs = CAT_STYLE[ing.cat] || { g1: T.card2, g2: T.card, dot: T.accent };

  return (
    <button
      onClick={onToggle}
      className="tap"
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        fontFamily: "inherit",
        display: "block",
        width: "100%",
        borderRadius: 12,
        overflow: "hidden",
        outline: sel ? `2.5px solid ${T.accent}` : `1.5px solid ${T.border2}`,
        boxShadow: sel
          ? `0 0 0 3px ${T.accent}50, 0 8px 28px -8px ${T.accent}60, 0 2px 8px rgba(0,0,0,0.2)`
          : `0 2px 8px rgba(0,0,0,0.15)`,
        transform: sel ? "scale(1.03)" : "scale(1)",
        transition: "outline .12s, box-shadow .25s, transform .2s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <div
        style={{
          width: "100%",
          paddingTop: "90%",
          position: "relative",
          overflow: "hidden",
          borderRadius: "11px 11px 0 0",
          background: `linear-gradient(145deg, ${cs.g1}, ${cs.g2})`,
        }}
      >
        {/* Dot pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: `radial-gradient(circle, ${cs.dot}20 1px, transparent 1px)`,
            backgroundSize: "12px 12px",
          }}
        />
        {/* Main glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `radial-gradient(ellipse at 55% 40%, ${cs.dot}${sel ? "55" : "30"} 0%, transparent 60%)`,
            transition: "background .2s",
          }}
        />
        {/* Emoji container */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
            lineHeight: 1,
            userSelect: "none",
            transform: sel ? "scale(1.15) translateY(-2px)" : "scale(1)",
            filter: sel
              ? `drop-shadow(0 0 16px ${cs.dot}ee) drop-shadow(0 4px 8px rgba(0,0,0,.7))`
              : `drop-shadow(0 3px 10px rgba(0,0,0,.5))`,
            transition: "transform .15s, filter .2s",
          }}
        >
          {ing.em}
        </div>
        {/* Category badge */}
        <div
          style={{
            position: "absolute",
            bottom: 6,
            left: 6,
            background: `${cs.dot}30`,
            backdropFilter: "blur(4px)",
            padding: "2px 6px",
            borderRadius: 4,
            fontSize: 8,
            fontWeight: 600,
            color: cs.dot,
            textTransform: "uppercase",
            letterSpacing: 0.3,
          }}
        >
          {ing.cat}
        </div>
        {/* Selection glow at bottom */}
        {sel && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: `radial-gradient(ellipse at 50% 100%, ${T.accent}35 0%, transparent 55%)`,
            }}
          />
        )}
        {/* Check badge */}
        {sel && (
          <div
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${T.accent}, #ff6a30)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 2px 12px ${T.accent}80`,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          </div>
        )}
      </div>
      {/* Name section */}
      <div
        style={{
          padding: "8px 6px 9px",
          background: sel ? `${T.accent}15` : T.card,
          borderTop: `1px solid ${sel ? T.accent + "50" : T.border}`,
          transition: "background .15s",
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: sel ? 600 : 500,
            color: sel ? T.accent : T.text,
            margin: 0,
            textAlign: "center",
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            padding: "0 2px",
            transition: "color .15s",
          }}
        >
          {ing.name}
        </p>
      </div>
    </button>
  );
}

/* ─── Profile Screen ─── */
function ProfileScreen({
  prefs,
  setPrefs,
  onClearHistory,
  onClearAll,
  onSwitchProfile,
  onSignOut,
  onDeleteProfile,
}: {
  prefs: Prefs;
  setPrefs: React.Dispatch<React.SetStateAction<Prefs>>;
  onClearHistory: () => void;
  onClearAll: () => void;
  onSwitchProfile: () => void;
  onSignOut: () => void;
  onDeleteProfile: () => void;
}) {
  const { activeProfile, profiles, switchProfile, deleteProfile } = useProfile();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    if (!activeProfile) return;
    const savedKey = localStorage.getItem(profileStorageKey(activeProfile.id, "openai_api_key"));
    if (savedKey) {
      setApiKey(savedKey);
      setApiKeySaved(true);
    } else {
      setApiKey("");
      setApiKeySaved(false);
    }
  }, [activeProfile?.id]);

  const saveApiKey = () => {
    if (apiKey.trim() && activeProfile) {
      localStorage.setItem(profileStorageKey(activeProfile.id, "openai_api_key"), apiKey.trim());
      setApiKeySaved(true);
      setTimeout(() => setApiKeySaved(false), 2000);
    }
  };

  const clearApiKey = () => {
    if (activeProfile) localStorage.removeItem(profileStorageKey(activeProfile.id, "openai_api_key"));
    setApiKey("");
    setApiKeySaved(false);
  };

  const toggle = (key: keyof Prefs, id: string, single: boolean) =>
    setPrefs((p) => {
      const cur = (p[key] as string[]) || [];
      if (single) return { ...p, [key]: [id] };
      return { ...p, [key]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
    });
  const toggleItem = (key: keyof Prefs, item: string) =>
    setPrefs((p) => {
      const cur = (p[key] as string[]) || [];
      return { ...p, [key]: cur.includes(item) ? cur.filter((x) => x !== item) : [...cur, item] };
    });
  const dietLabel = PREF.diet.find((x) => x.id === (prefs.diet || [])[0])?.label || "Vegetarian";
  const allergyCount = (prefs.allergies || []).length;
  const dislikeCount = (prefs.dislikes || []).length;

  return (
    <div className="fa">
      {/* Active profile + switch */}
      <div style={{ background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 32 }}>{activeProfile?.emoji ?? "👤"}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>{activeProfile?.name || prefs.name || "Profile"}</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: T.textSub }}>
              {activeProfile?.kind === "account" ? activeProfile.email || "Cloud account" : "This device · separate data"}
            </p>
          </div>
        </div>
        {profiles.filter((p) => p.id !== activeProfile?.id).length > 0 && (
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border}` }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: "uppercase", letterSpacing: 0.6 }}>
              Switch profile
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {profiles.filter((p) => p.id !== activeProfile?.id).map((p) => (
                <button
                  key={p.id}
                  onClick={() => switchProfile(p.id)}
                  className="tap"
                  style={{
                    background: T.card2,
                    border: `1.5px solid ${T.border}`,
                    borderRadius: 20,
                    padding: "8px 14px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: T.text,
                  }}
                >
                  <span>{p.emoji}</span> {p.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ padding: "10px 16px", display: "flex", gap: 8 }}>
          <button onClick={onSwitchProfile} className="tap" style={{ flex: 1, background: T.accent, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Add / switch login
          </button>
          <button onClick={onSignOut} className="tap" style={{ background: T.card2, color: T.textSub, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "11px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Sign out
          </button>
        </div>
      </div>

      <div
        style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          padding: "1.25rem",
          marginBottom: 22,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: `${T.accent}18`,
              border: `1px solid ${T.accent}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: 20,
            }}
          >
            🍽
          </div>
          <div>
            <p
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontSize: 17,
                fontWeight: 700,
                color: T.text,
                marginBottom: 4,
              }}
            >
              Taste Profile
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              <Tag bg={`${T.accent}18`} color={T.accent} bd={`${T.accent}30`}>
                {dietLabel}
              </Tag>
              {allergyCount > 0 && (
                <Tag bg="#1a0808" color="#e05040" bd="#c0000025">
                  {allergyCount} allerg{allergyCount > 1 ? "ies" : "y"}
                </Tag>
              )}
              {dislikeCount > 0 && (
                <Tag bg="#1a1408" color={T.gold} bd={`${T.gold}25`}>
                  {dislikeCount} avoided
                </Tag>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {(prefs.cuisine || []).map((c, i) => (
            <Tag key={i}>{PREF.cuisine.find((x) => x.id === c)?.label || c}</Tag>
          ))}
          {(prefs.health || []).map((h, i) => (
            <Tag key={i} bg={T.tealBg} color={T.teal} bd={`${T.teal}30`}>
              {PREF.health.find((x) => x.id === h)?.label || h}
            </Tag>
          ))}
        </div>
      </div>

      {/* Name Section */}
      <div
        style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          padding: "1rem 1.25rem",
          marginBottom: 16,
        }}
      >
        <Lbl>Your Name</Lbl>
        <p style={{ color: T.textSub, fontSize: 12, margin: "4px 0 10px", lineHeight: 1.5 }}>
          Used for personalised greetings on the Home screen.
        </p>
        <input
          type="text"
          value={prefs.name || ""}
          onChange={(e) => setPrefs((p) => ({ ...p, name: e.target.value }))}
          placeholder="e.g. Swati"
          autoComplete="given-name"
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 10,
            border: `1.5px solid ${T.border}`,
            fontSize: 16,
            outline: "none",
            background: T.card2,
            color: T.text,
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = T.accent;
            e.target.style.boxShadow = `0 0 0 3px ${T.accent}15`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = T.border;
            e.target.style.boxShadow = "none";
          }}
        />
      </div>

      {/* AI API Key Section */}
      <div
        style={{
          background: T.card,
          border: `1.5px solid ${T.border}`,
          borderRadius: 14,
          padding: "1.25rem",
          marginBottom: 22,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px -4px rgba(139, 92, 246, 0.5)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <div>
            <p style={{ color: T.text, fontSize: 15, fontWeight: 600, marginBottom: 2 }}>
              OpenAI API Key
            </p>
            <p style={{ color: T.textSub, fontSize: 12 }}>
              For AI recipe generation
            </p>
          </div>
        </div>
        
        <p style={{ color: T.textSub, fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
          Add your OpenAI API key to enable AI-powered recipe generation. Get your key from{" "}
          <a 
            href="https://platform.openai.com/api-keys" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: T.accent, textDecoration: "underline" }}
          >
            OpenAI Platform
          </a>
          .
        </p>

        <div style={{ position: "relative", marginBottom: 12 }}>
          <input
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            style={{
              width: "100%",
              padding: "10px 40px 10px 14px",
              borderRadius: 10,
              border: `1.5px solid ${T.border}`,
              fontSize: 16,
              outline: "none",
              background: T.card2,
              color: T.text,
              fontFamily: "monospace",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = T.accent;
              e.target.style.boxShadow = "0 0 0 3px " + T.accent + "15";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = T.border;
              e.target.style.boxShadow = "none";
            }}
          />
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            className="tap"
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: T.textSub,
              cursor: "pointer",
              padding: 4,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {showApiKey ? (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              ) : (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={saveApiKey}
            disabled={!apiKey.trim()}
            className="tap"
            style={{
              flex: 1,
              background: apiKey.trim() ? "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)" : T.card2,
              color: apiKey.trim() ? "#fff" : T.textSub,
              border: "none",
              borderRadius: 10,
              padding: "10px",
              fontSize: 13,
              fontWeight: 600,
              cursor: apiKey.trim() ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              boxShadow: apiKey.trim() ? "0 4px 12px -4px rgba(139, 92, 246, 0.5)" : "none",
            }}
          >
            {apiKeySaved ? "✓ Saved!" : "Save Key"}
          </button>
          {apiKey && (
            <button
              onClick={clearApiKey}
              className="tap"
              style={{
                background: T.card2,
                color: T.textSub,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Theme Toggle */}
      <div
        style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          padding: "1rem 1.25rem",
          marginBottom: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>{mounted && theme === "dark" ? "🌙" : "☀️"}</span>
          <div>
            <p style={{ color: T.text, fontSize: 14, fontWeight: 500 }}>Appearance</p>
            <p style={{ color: T.textSub, fontSize: 12 }}>
              {mounted ? (theme === "dark" ? "Dark mode" : "Light mode") : "Loading..."}
            </p>
          </div>
        </div>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="tap"
          style={{
            background: theme === "dark" ? T.accent : T.teal,
            border: "none",
            borderRadius: 20,
            padding: "8px 16px",
            color: "#fff",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {mounted ? (theme === "dark" ? "Switch to Light" : "Switch to Dark") : "..."}
        </button>
      </div>

      {/* ── Macro / Nutrition Goals ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <Lbl>Daily Nutrition Goal</Lbl>
          {(prefs.macroTargets?.goal || "none") !== "none" && (
            <span
              style={{
                background: `${T.accent}18`,
                color: T.accent,
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 9px",
                borderRadius: 6,
              }}
            >
              {MACRO_PRESETS[prefs.macroTargets.goal]?.emoji} {MACRO_PRESETS[prefs.macroTargets.goal]?.label}
            </span>
          )}
        </div>
        <p style={{ color: T.textSub, fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}>
          Recipes will be ranked and labelled by how well they fit your daily targets.
        </p>

        {/* Preset grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {Object.values(MACRO_PRESETS).map((preset) => {
            const active = (prefs.macroTargets?.goal || "none") === preset.goal;
            return (
              <button
                key={preset.goal}
                onClick={() => {
                  if (preset.goal === "custom") {
                    setPrefs((p) => ({ ...p, macroTargets: { ...p.macroTargets, goal: "custom" } }));
                  } else {
                    setPrefs((p) => ({ ...p, macroTargets: { goal: preset.goal, calories: preset.calories, protein: preset.protein, carbs: preset.carbs, fat: preset.fat } }));
                  }
                }}
                className="tap"
                style={{
                  background: active ? `${T.accent}15` : T.card2,
                  border: `1.5px solid ${active ? T.accent : T.border}`,
                  borderRadius: 10,
                  padding: "10px 12px",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 14 }}>{preset.emoji}</span>
                  <span style={{ color: active ? T.accent : T.text, fontSize: 13, fontWeight: 600 }}>{preset.label}</span>
                </div>
                <p style={{ color: T.textMut, fontSize: 10, margin: 0, lineHeight: 1.4 }}>{preset.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Custom inputs — shown when custom or any preset is active */}
        {(prefs.macroTargets?.goal || "none") !== "none" && (
          <div
            style={{
              background: T.card2,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              padding: "14px",
            }}
          >
            <p style={{ color: T.textSub, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>
              Daily Targets
            </p>
            {(
              [
                { key: "calories" as const, label: "Calories",      unit: "kcal", color: T.gold,  min: 800,  max: 4000, step: 50  },
                { key: "protein"  as const, label: "Protein",       unit: "g",    color: "#ef4444", min: 20, max: 300, step: 5   },
                { key: "carbs"    as const, label: "Carbohydrates", unit: "g",    color: T.accent, min: 20,   max: 500, step: 5   },
                { key: "fat"      as const, label: "Fat",           unit: "g",    color: T.teal,  min: 10,   max: 200, step: 5   },
              ] as const
            ).map(({ key, label, unit, color, min, max, step }) => {
              const val = prefs.macroTargets?.[key] ?? 0;
              return (
                <div key={key} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                    <span style={{ color: T.textSub, fontSize: 12 }}>{label}</span>
                    <span style={{ color, fontSize: 14, fontWeight: 700 }}>
                      {val} <span style={{ fontSize: 10, color: T.textMut }}>{unit}</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={val}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        macroTargets: { ...(p.macroTargets || DEFAULT_PREFS.macroTargets), goal: p.macroTargets?.goal || "custom", [key]: Number(e.target.value) },
                      }))
                    }
                    style={{ width: "100%", accentColor: color, cursor: "pointer" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: T.textMut, fontSize: 9 }}>{min}</span>
                    <span style={{ color: T.textMut, fontSize: 9 }}>{max}</span>
                  </div>
                </div>
              );
            })}
            {/* Per-meal breakdown */}
            {(prefs.macroTargets?.calories ?? 0) > 0 && (
              <div
                style={{
                  background: T.card,
                  borderRadius: 8,
                  padding: "10px 12px",
                  marginTop: 4,
                  border: `1px solid ${T.border}`,
                }}
              >
                <p style={{ color: T.textMut, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
                  Per Meal (÷3)
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                  {[
                    { label: "Kcal", val: Math.round((prefs.macroTargets.calories || 0) / 3), color: T.gold },
                    { label: "Protein", val: Math.round((prefs.macroTargets.protein || 0) / 3), color: "#ef4444" },
                    { label: "Carbs", val: Math.round((prefs.macroTargets.carbs || 0) / 3), color: T.accent },
                    { label: "Fat", val: Math.round((prefs.macroTargets.fat || 0) / 3), color: T.teal },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <p style={{ color, fontSize: 15, fontWeight: 700, margin: 0 }}>{val}</p>
                      <p style={{ color: T.textMut, fontSize: 9, marginTop: 1 }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Div />

      <div style={{ marginBottom: 20 }}>
        <Lbl>Dietary Preference</Lbl>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {PREF.diet.map((o) => (
            <ToggleChip
              key={o.id}
              label={o.label}
              on={(prefs.diet || []).includes(o.id)}
              onClick={() => toggle("diet", o.id, true)}
            />
          ))}
        </div>
      </div>
      <Div />

      <div style={{ marginBottom: 20 }}>
        <Lbl c="#e05040">Allergies & Intolerances</Lbl>
        <p style={{ color: T.textSub, fontSize: 12, marginTop: 3, marginBottom: 8 }}>
          Recipes containing these are excluded from all suggestions.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {ALLERGENS.map((o) => (
            <ToggleChip
              key={o.id}
              label={o.label}
              sub={o.sub}
              on={(prefs.allergies || []).includes(o.id)}
              onClick={() => toggleItem("allergies", o.id)}
            />
          ))}
        </div>
      </div>
      <Div />

      <div style={{ marginBottom: 20 }}>
        <Lbl c={T.gold}>Ingredients I Avoid</Lbl>
        <p style={{ color: T.textSub, fontSize: 12, marginTop: 3, marginBottom: 8 }}>
          Recipes using these will be filtered out.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {DISLIKES.map((d) => (
            <ToggleChip
              key={d}
              label={d}
              on={(prefs.dislikes || []).includes(d)}
              onClick={() => toggleItem("dislikes", d)}
            />
          ))}
        </div>
      </div>
      <Div />

      <div style={{ marginBottom: 20 }}>
        <Lbl>Cuisine Preferences</Lbl>
        <p style={{ color: T.textSub, fontSize: 12, marginTop: 3, marginBottom: 8 }}>
          Prioritised in your weekly plan.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {PREF.cuisine.map((o) => (
            <ToggleChip
              key={o.id}
              label={o.label}
              on={(prefs.cuisine || []).includes(o.id)}
              onClick={() => toggle("cuisine", o.id, false)}
            />
          ))}
        </div>
      </div>
      <Div />

      <div style={{ marginBottom: 20 }}>
        <Lbl>Health Goals</Lbl>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {PREF.health.map((o) => (
            <ToggleChip
              key={o.id}
              label={o.label}
              on={(prefs.health || []).includes(o.id)}
              onClick={() => toggle("health", o.id, false)}
            />
          ))}
        </div>
      </div>
      <Div />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <Lbl>Spice Level</Lbl>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
            {PREF.spice.map((o) => (
              <ToggleChip
                key={o.id}
                label={o.label}
                on={(prefs.spice || []).includes(o.id)}
                onClick={() => toggle("spice", o.id, true)}
              />
            ))}
          </div>
        </div>
        <div>
          <Lbl>Serves</Lbl>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
            {PREF.serves.map((o) => (
              <ToggleChip
                key={o.id}
                label={o.label}
                on={(prefs.serves || []).includes(o.id)}
                onClick={() => toggle("serves", o.id, true)}
              />
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 18, background: T.card, borderRadius: 6, padding: "11px 14px", border: `1px solid ${T.border}`, marginBottom: 20 }}>
        <p style={{ color: T.textSub, fontSize: 12, lineHeight: 1.6 }}>
          Changes apply immediately — your weekly plan updates automatically.
        </p>
      </div>

      {/* ── Clear Data ── */}
      <div style={{ background: T.card, borderRadius: 14, border: `1.5px solid ${T.border}`, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>Data & Privacy</p>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: T.textSub }}>Manage your stored data</p>
        </div>
        {[
          {
            label: "Clear Search History",
            desc: "Remove your ingredient search log",
            icon: "🕓",
            action: onClearHistory,
            danger: false,
          },
          {
            label: "Reset All Preferences",
            desc: "Restore diet, cuisine & health defaults",
            icon: "↩️",
            action: () => setPrefs(DEFAULT_PREFS),
            danger: false,
          },
          {
            label: "Clear Everything",
            desc: "Wipe this profile's data & restart onboarding",
            icon: "🗑️",
            action: onClearAll,
            danger: true,
          },
          {
            label: "Delete This Profile",
            desc: "Remove profile and all its saved data",
            icon: "❌",
            action: onDeleteProfile,
            danger: true,
          },
        ].map(({ label, desc, icon, action, danger }) => (
          <button
            key={label}
            onClick={action}
            className="tap"
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: `1px solid ${T.border}`,
              padding: "13px 16px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: danger ? "#ef4444" : T.text }}>{label}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: T.textSub }}>{desc}</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={danger ? "#ef4444" : T.textMut} strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12,5 19,12 12,19" />
            </svg>
          </button>
        ))}
        <div style={{ padding: "10px 16px" }}>
          <p style={{ margin: 0, color: T.textMut, fontSize: 11 }}>All data is stored locally on your device only.</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Fridge Screen ─── */
function FridgeScreen({
  selected,
  setSelected,
  prefs,
  onResults,
}: {
  selected: number[];
  setSelected: React.Dispatch<React.SetStateAction<number[]>>;
  prefs: Prefs;
  onResults: (matched: Recipe[], names: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  const toggle = (id: number) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  // Hide non-veg categories based on diet preference (prefs.diet is an array like ["veg"])
  const userDiet = prefs.diet[0] || "nonveg";
  const NON_VEG_CATS = new Set(["Chicken", "Mutton", "Seafood"]);
  const EGG_CATS     = new Set(["Eggs"]);
  const DAIRY_CATS   = new Set(["Dairy"]);

  const visibleING = ING.filter((i) => {
    if (userDiet === "veg"   && (NON_VEG_CATS.has(i.cat) || EGG_CATS.has(i.cat))) return false;
    if (userDiet === "vegan" && (NON_VEG_CATS.has(i.cat) || EGG_CATS.has(i.cat) || DAIRY_CATS.has(i.cat))) return false;
    if (userDiet === "egget" && NON_VEG_CATS.has(i.cat)) return false;
    return true;
  });

  const visibleCats = ["All", ...new Set(visibleING.map((i) => i.cat))];

  const rows = visibleING.filter(
    (i) => i.name.toLowerCase().includes(q.toLowerCase()) && (cat === "All" || i.cat === cat)
  );
  // Auto-clear any selected ingredients now hidden by diet pref
  const visibleIds = new Set(visibleING.map((i) => i.id));
  const cleanSelected = selected.filter((id) => visibleIds.has(id));

  const selNames = visibleING.filter((i) => cleanSelected.includes(i.id)).map((i) => i.name);

  return (
    <div className="fa">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <p
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: 26,
            fontWeight: 600,
            color: T.text,
            marginBottom: 6,
            letterSpacing: "-0.02em",
          }}
        >
          {"What's in your fridge?"}
        </p>
        <p style={{ color: T.textSub, fontSize: 14, lineHeight: 1.5 }}>
          Select ingredients and we&apos;ll find recipes that match your taste profile.
        </p>
      </div>

      {/* Selected Ingredients Pills */}
      {cleanSelected.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 16,
            padding: "12px 14px",
            background: T.card,
            borderRadius: 14,
            border: `1.5px solid ${T.accent}25`,
            boxShadow: "var(--fc-shadow-sm)",
          }}
        >
          {visibleING.filter((i) => cleanSelected.includes(i.id)).map((ing) => (
            <button
              key={ing.id}
              onClick={() => toggle(ing.id)}
              className="tap"
              style={{
                background: `linear-gradient(135deg, ${T.accent} 0%, #78350f 100%)`,
                color: "#fff",
                fontSize: 12,
                fontWeight: 500,
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 2px 8px -2px rgba(234, 88, 12, 0.4)",
              }}
            >
              <span style={{ fontSize: 14 }}>{ing.em}</span>
              {ing.name}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.7 }}>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ))}
          <button
            onClick={() => setSelected([])}
            className="tap"
            style={{
              background: T.card2,
              color: T.textSub,
              fontSize: 12,
              padding: "6px 12px",
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 500,
            }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Search Input */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={T.textMut}
          strokeWidth="2"
          style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search ingredients..."
          style={{
            width: "100%",
            padding: "12px 14px 12px 44px",
            borderRadius: 12,
            border: `1.5px solid ${T.border}`,
            fontSize: 16,
            outline: "none",
            background: T.card,
            color: T.text,
            boxShadow: "var(--fc-shadow-sm)",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = T.accent;
            e.target.style.boxShadow = "0 0 0 3px " + T.accent + "15";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = T.border;
            e.target.style.boxShadow = "var(--fc-shadow-sm)";
          }}
        />
      </div>

      {/* Category Filter Pills */}
      <div className="scroll-x" style={{ display: "flex", gap: 6, paddingBottom: 12, marginBottom: 16 }}>
        {visibleCats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className="tap"
            style={{
              background: cat === c ? T.accent : T.card,
              color: cat === c ? "#fff" : T.textSub,
              border: `1.5px solid ${cat === c ? T.accent : T.border}`,
              borderRadius: 10,
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontFamily: "inherit",
              boxShadow: cat === c ? "0 4px 12px -4px rgba(234, 88, 12, 0.4)" : "var(--fc-shadow-sm)",
            }}
          >
            {c}
            {cat === c && rows.length < ING.length ? ` (${rows.length})` : ""}
          </button>
        ))}
      </div>

      {/* Ingredient Grid */}
      <div className="ing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 10, marginBottom: 20 }}>
        {rows.map((ing) => (
          <IngCard key={ing.id} ing={ing} sel={cleanSelected.includes(ing.id)} onToggle={() => toggle(ing.id)} />
        ))}
      </div>

      {rows.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem", color: T.textSub, fontSize: 13 }}>
          No ingredients found for &quot;{q}&quot;
        </div>
      )}

      {/* Find Recipes CTA */}
      <button
        onClick={() => selNames.length && onResults(matchFridge(selNames, prefs), selNames)}
        className="tap card-hover"
        style={{
          width: "100%",
          background: selNames.length 
            ? `linear-gradient(135deg, ${T.accent} 0%, #78350f 100%)` 
            : T.card2,
          color: selNames.length ? "#fff" : T.textSub,
          border: "none",
          borderRadius: 14,
          padding: "16px 20px",
          fontSize: 15,
          fontWeight: 600,
          cursor: selNames.length ? "pointer" : "not-allowed",
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          boxShadow: selNames.length 
            ? "0 8px 24px -8px rgba(234, 88, 12, 0.5)" 
            : "var(--fc-shadow-sm)",
        }}
      >
        {selNames.length ? (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Find Recipes
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </>
        ) : (
          "Select at least one ingredient"
        )}
      </button>
    </div>
  );
}

/* ─── Recipe Detail ─── */
function RecipeDetail({ r, onBack, prefs, cookList, onToggleCook }: { r: Recipe; onBack: () => void; prefs: Prefs; cookList: number[]; onToggleCook: (id: number) => void }) {
  const allergy = ALLERGENS.filter((a) => (r.allergens ?? []).includes(a.id));
  const cuisineLabels = (r.cuisines ?? [])
    .map((c) => PREF.cuisine.find((x) => x.id === c)?.label || c)
    .join(" · ");
  const mealTags = r.meal ?? [];

  const inCookList = cookList.includes(r.id);
  const detailGrad = getRecipeGradient(r);
  const detailEmoji = getRecipeEmoji(r);

  return (
    <div className="su">
      {/* Hero image */}
      <RecipeImageHeader
        recipe={r}
        variant="hero"
        emoji={detailEmoji}
        gradient={detailGrad}
        borderRadius={20}
        marginBottom={16}
        boxShadow={`0 12px 40px -12px ${detailGrad.dot}40`}
      >
        <div style={{ position: "absolute", bottom: 12, left: 14, display: "flex", gap: 6, alignItems: "center", zIndex: 2 }}>
          <span style={{ background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 6, backdropFilter: "blur(8px)" }}>
            {r.diet === "vegan" ? "🌱 Vegan" : r.diet === "veg" ? "🥬 Veg" : r.diet === "egget" ? "🥚 Egget" : "🍗 Non-Veg"}
          </span>
          {mealTags.map((m) => (
            <span key={m} style={{ background: "rgba(0,0,0,0.55)", color: "#ccc", fontSize: 9, fontWeight: 500, padding: "4px 8px", borderRadius: 5, textTransform: "capitalize" }}>{m}</span>
          ))}
        </div>
      </RecipeImageHeader>

      {/* Action bar: back + cook-this */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <BackBtn onClick={onBack} />
        <button
          onClick={() => onToggleCook(r.id)}
          className="tap"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: inCookList
              ? `linear-gradient(135deg, ${T.accent}, #78350f)`
              : `linear-gradient(135deg, ${T.accent}, #78350f)`,
            color: "#fff",
            border: "none",
            borderRadius: 22,
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: `0 4px 16px -4px ${T.accent}60`,
            opacity: inCookList ? 0.85 : 1,
          }}
        >
          <span style={{ fontSize: 16 }}>{inCookList ? "✓" : "🛒"}</span>
          {inCookList ? "Added to Grocery" : "Add to Grocery"}
        </button>
      </div>

      <div
        style={{
          background: T.card,
          boxShadow: "var(--fc-shadow-lg)",
          borderRadius: 8,
          padding: "1.4rem",
          border: `1px solid ${T.border}`,
          marginBottom: 12,
          borderLeft: `3px solid ${T.accent}`,
        }}
      >
        <Lbl c={T.accent}>{cuisineLabels}</Lbl>
        <button
          onClick={() => yt(r.ytQ || `${r.name} recipe`)}
          className="tap"
          style={{
            background: "none",
            border: "none",
            padding: 0,
            textAlign: "left",
            cursor: "pointer",
            fontFamily: "inherit",
            width: "100%",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: 26,
              fontWeight: 700,
              color: T.text,
              margin: "6px 0 4px",
              lineHeight: 1.15,
              textDecoration: "underline",
              textDecorationColor: `${T.accent}55`,
              textUnderlineOffset: 4,
            }}
          >
            {r.name} ↗
          </h2>
        </button>
        {r.desc && (
          <p style={{ color: T.textSub, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{r.desc}</p>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: allergy.length ? 10 : 0 }}>
          <div
            style={{
              background: T.card2,
              borderRadius: 5,
              padding: "6px 10px",
              border: `1px solid ${T.border2}`,
              textAlign: "center",
              minWidth: 64,
            }}
          >
            <p
              style={{
                color: T.textSub,
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Time
            </p>
            <p style={{ color: T.text, fontSize: 14, fontWeight: 600, marginTop: 1 }}>{r.time}</p>
          </div>
          {r.cal && (
            <div
              style={{
                background: T.card2,
                borderRadius: 5,
                padding: "6px 10px",
                border: `1px solid ${T.border2}`,
                textAlign: "center",
                minWidth: 64,
              }}
            >
              <p
                style={{
                  color: T.textSub,
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                Calories
              </p>
              <p style={{ color: T.accent, fontSize: 14, fontWeight: 600, marginTop: 1 }}>~{r.cal} kcal</p>
            </div>
          )}
          {r.allergens.length === 0 && (
            <div
              style={{
                background: T.card2,
                borderRadius: 5,
                padding: "6px 10px",
                border: `1px solid ${T.border}`,
                textAlign: "center",
              }}
            >
              <p style={{ color: T.textSub, fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
                Allergens
              </p>
              <p style={{ color: T.teal, fontSize: 13, fontWeight: 600, marginTop: 1 }}>✓ None</p>
            </div>
          )}
          {r.health.slice(0, 2).map((h, i) => (
            <Tag key={i} bg={T.tealBg} color={T.teal} bd={`${T.teal}30`}>
              {PREF.health.find((x) => x.id === h)?.label || h}
            </Tag>
          ))}
        </div>
        {allergy.length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {allergy.map((a) => (
              <Tag key={a.id} bg="#1a0808" color="#e05040" bd="#c0000025">
                ⚠ Contains {a.label}
              </Tag>
            ))}
          </div>
        )}
      </div>

      {/* Recipe Rating Section */}
      <RecipeRating recipeId={r.id} recipeName={r.name} />

      {r.pairing && (
        <div
          style={{
            background: T.card,
            borderRadius: 14,
            padding: "14px 16px",
            border: `1.5px solid ${T.border}`,
            borderLeft: `4px solid ${T.teal}`,
            marginBottom: 12,
          }}
        >
          <Lbl c={T.teal}>🍽 Complete Meal Idea</Lbl>
          <p style={{ color: T.text, fontSize: 14, marginTop: 6, fontWeight: 600 }}>
            {r.name} + {r.pairing}
          </p>
          {r.cal && (
            <p style={{ color: T.textSub, fontSize: 12, marginTop: 4 }}>
              Estimated total meal: ~{r.cal + 80}–{r.cal + 150} kcal per person
            </p>
          )}
        </div>
      )}

      {r.steps?.length > 0 && (
        <div
          style={{
            background: T.card,
            borderRadius: 8,
            padding: "1rem",
            border: `1px solid ${T.border}`,
            marginBottom: 12,
          }}
        >
          <Lbl>How to Make It</Lbl>
          <div style={{ marginTop: 10 }}>
            {r.steps.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    minWidth: 22,
                    borderRadius: "50%",
                    background: T.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    marginTop: 1,
                  }}
                >
                  {i + 1}
                </div>
                <p style={{ color: T.textSub, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Macro Breakdown ── */}
      {(() => {
        const m = estimateMacros(r);
        const hasGoal = (prefs?.macroTargets?.goal || "none") !== "none" && (prefs?.macroTargets?.calories ?? 0) > 0;
        const targets = prefs?.macroTargets;
        const perMeal = hasGoal ? {
          calories: Math.round((targets?.calories ?? 0) / 3),
          protein:  Math.round((targets?.protein  ?? 0) / 3),
          carbs:    Math.round((targets?.carbs    ?? 0) / 3),
          fat:      Math.round((targets?.fat      ?? 0) / 3),
        } : null;

        return (
          <div
            style={{
              background: T.card,
              borderRadius: 8,
              padding: "1rem",
              border: `1px solid ${T.border}`,
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Lbl>Nutrition per serving</Lbl>
              {hasGoal && (
                <span style={{ color: T.textMut, fontSize: 10 }}>
                  goal: {MACRO_PRESETS[targets!.goal]?.label ?? "Custom"}
                </span>
              )}
            </div>

            {/* Macro grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
              {([
                { label: "Calories", val: r.cal,     unit: "kcal", color: T.gold,    goal: perMeal?.calories },
                { label: "Protein",  val: m.protein,  unit: "g",    color: "#ef4444", goal: perMeal?.protein  },
                { label: "Carbs",    val: m.carbs,    unit: "g",    color: T.accent,  goal: perMeal?.carbs    },
                { label: "Fat",      val: m.fat,      unit: "g",    color: T.teal,    goal: perMeal?.fat      },
              ] as const).map(({ label, val, unit, color, goal }) => {
                const pct = goal && goal > 0 ? Math.min(100, Math.round((val / goal) * 100)) : null;
                return (
                  <div
                    key={label}
                    style={{
                      background: T.card2,
                      borderRadius: 8,
                      padding: "10px 8px",
                      border: `1px solid ${T.border}`,
                      textAlign: "center",
                    }}
                  >
                    <p style={{ color, fontSize: 17, fontWeight: 700, margin: 0, lineHeight: 1 }}>{val}</p>
                    <p style={{ color: T.textMut, fontSize: 8, margin: "2px 0 0", textTransform: "uppercase", letterSpacing: 0.4 }}>{unit}</p>
                    <p style={{ color: T.textMut, fontSize: 9, margin: "3px 0 0" }}>{label}</p>
                    {pct !== null && (
                      <p style={{ color: pct > 85 ? "#4ade80" : pct > 50 ? T.gold : T.textMut, fontSize: 9, margin: "4px 0 0", fontWeight: 600 }}>
                        {pct}% of meal
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress bars vs goal */}
            {perMeal && (
              <div style={{ marginTop: 4 }}>
                {([
                  { label: "Calories", val: r.cal,    goal: perMeal.calories, color: T.gold    },
                  { label: "Protein",  val: m.protein, goal: perMeal.protein,  color: "#ef4444" },
                  { label: "Carbs",    val: m.carbs,   goal: perMeal.carbs,    color: T.accent  },
                  { label: "Fat",      val: m.fat,     goal: perMeal.fat,      color: T.teal    },
                ] as const).map(({ label, val, goal, color }) => {
                  const pct = goal > 0 ? Math.min(100, Math.round((val / goal) * 100)) : 0;
                  const over = val > goal * 1.15;
                  return (
                    <div key={label} style={{ marginBottom: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ color: T.textSub, fontSize: 10 }}>{label}</span>
                        <span style={{ color: over ? "#f87171" : color, fontSize: 10, fontWeight: 600 }}>
                          {val} / {goal}{label === "Calories" ? " kcal" : "g"}
                        </span>
                      </div>
                      <div style={{ height: 4, background: T.card2, borderRadius: 2, overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: over ? "#f87171" : color,
                            borderRadius: 2,
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p style={{ color: T.textMut, fontSize: 10, marginTop: 6, textAlign: "right" }}>
                  ~based on per-meal target (daily ÷ 3)
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* WhatsApp Share */}
      <div
        style={{
          background: "#06140a",
          borderRadius: 8,
          padding: "1rem",
          border: "1px solid #25d36620",
          marginBottom: 12,
        }}
      >
        <Lbl c="#25d366">Send to Your Cook</Lbl>
        <p style={{ color: "#4a7a5a", fontSize: 12, margin: "5px 0 10px", lineHeight: 1.5 }}>
          Share this recipe via WhatsApp — steps, ingredients &amp; pairing included.
        </p>
        <WABtn message={formatRecipeForWA(r)} label={`Send "${r.name}" to Cook`} />
      </div>

      {/* ── YouTube Thumbnail Cards ── */}
      <div
        style={{
          background: T.card,
          borderRadius: 16,
          padding: "14px 14px 14px",
          border: `1px solid ${T.border}`,
          marginBottom: 12,
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Lbl>Watch on YouTube</Lbl>
          <span style={{ background: "#ff000015", color: "#ff4444", border: "1px solid #ff000030", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>
            ▶ Video
          </span>
        </div>

        {/* Scrollable thumbnail cards */}
        <div className="scroll-x" style={{ display: "flex", gap: 10, paddingBottom: 4, marginBottom: 12 }}>
          {[
            { query: r.ytQ || `${r.name} recipe`,              label: "Full Recipe",        sub: "Complete guide" },
            { query: `${r.name} step by step`,           label: "Step by Step",       sub: "Beginner friendly" },
            { query: `${r.name} restaurant style`,       label: "Restaurant Style",   sub: "Pro technique" },
            { query: `${r.name} Hebbars Kitchen`,        label: "Hebbars Kitchen",    sub: "Popular channel" },
            { query: `${r.name} Ranveer Brar`,           label: "Ranveer Brar",       sub: "Chef's version" },
          ].map(({ query, label, sub }) => (
            <button
              key={label}
              onClick={() => yt(query)}
              className="tap"
              style={{
                flexShrink: 0,
                width: 150,
                borderRadius: 10,
                overflow: "hidden",
                border: "1px solid #ff000025",
                cursor: "pointer",
                padding: 0,
                fontFamily: "inherit",
                background: "none",
              }}
            >
              {/* Thumbnail — real dish photo + play overlay */}
              <div style={{ position: "relative" }}>
                <RecipeImageThumb recipe={r} label={`${r.name} — ${label}`} />
                <div style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: "#ff0000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(255,0,0,0.45)",
                  pointerEvents: "none",
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                </div>
                <div style={{ position: "absolute", bottom: 5, right: 5, background: "rgba(0,0,0,0.75)", borderRadius: 3, padding: "1px 5px", pointerEvents: "none" }}>
                  <span style={{ color: "#fff", fontSize: 8, fontWeight: 600 }}>YOUTUBE</span>
                </div>
              </div>
              {/* Card info */}
              <div style={{ background: "#0f0f0f", padding: "7px 8px", textAlign: "left" }}>
                <p style={{ color: "#f1f1f1", fontSize: 10, fontWeight: 600, margin: 0, lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                  {r.name} — {label}
                </p>
                <p style={{ color: "#aaa", fontSize: 8, margin: "3px 0 0" }}>{sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Instagram Reels */}
        <button
          onClick={() => ig(r.name)}
          className="tap"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            background: "linear-gradient(135deg, #0d1520 0%, #121c2c 100%)",
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            padding: "10px 12px",
            color: "#ce93d8",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: 16 }}>📸</span>
          <span style={{ flex: 1 }}>Search Instagram Reels for "{r.name}"</span>
          <span style={{ fontSize: 10, opacity: 0.4 }}>↗</span>
        </button>
      </div>

      {/* ── Indian Food Creators ── */}
      <div
        style={{
          background: T.card,
          borderRadius: 16,
          padding: "14px",
          border: `1px solid ${T.border}`,
        }}
      >
        <Lbl>Indian Food Creators</Lbl>
        <div className="scroll-x" style={{ display: "flex", gap: 8, marginTop: 10, paddingBottom: 4 }}>
          {YT_CHS.map((ch) => (
            <button
              key={ch.h}
              onClick={() => ytCh(ch.h)}
              className="tap"
              style={{
                flexShrink: 0,
                background: T.card2,
                color: T.text,
                fontSize: 11,
                fontWeight: 500,
                padding: "8px 12px",
                borderRadius: 8,
                border: `1px solid ${T.border}`,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: "#ff0000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </span>
              {ch.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Results Screen ─── */
const TIME_FILTERS = [
  { id: "all", label: "All times" },
  { id: "quick", label: "< 20 min" },
  { id: "medium", label: "20-40 min" },
  { id: "long", label: "40+ min" },
];

const CAL_FILTERS = [
  { id: "all", label: "All calories" },
  { id: "low", label: "< 250 cal" },
  { id: "medium", label: "250-400 cal" },
  { id: "high", label: "400+ cal" },
];

const MEAL_FILTERS = [
  { id: "all", label: "All meals" },
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snack", label: "Snack" },
];

function parseTime(t: string): number {
  const match = t.match(/(\d+)/);
  return match ? parseInt(match[1]) : 30;
}

function ResultsScreen({
  matched,
  ingNames,
  prefs,
  onOpen,
  onBack,
  cookList,
  onToggleCook,
  onGrocery,
}: {
  matched: Recipe[];
  ingNames: string[];
  prefs: Prefs;
  onOpen: (r: Recipe) => void;
  onBack: () => void;
  cookList: number[];
  onToggleCook: (id: number) => void;
  onGrocery: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [calFilter, setCalFilter] = useState("all");
  const [mealFilter, setMealFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationCount, setGenerationCount] = useState(0);

  const generateAIRecipe = async () => {
    if (generationCount >= 2) {
      setGenerationError("You've reached the limit of 2 AI recipes per session.");
      return;
    }
    
    // Get API key from localStorage
    const activeId = getActiveProfileId();
    const apiKey = activeId
      ? localStorage.getItem(profileStorageKey(activeId, "openai_api_key"))
      : null;
    if (!apiKey) {
      setGenerationError("Please add your OpenAI API key in the Profile section first.");
      return;
    }
    
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      const response = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: ingNames,
          preferences: prefs,
          apiKey,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setGenerationError(data.error || "Failed to generate recipe. Please try again.");
        return;
      }
      
      if (data.recipe) {
        const raw = data.recipe;
        const aiRecipe: Recipe = {
          id: Date.now(),
          name: raw.name,
          core: raw.ingredients?.[0]?.name || raw.name,
          diet: raw.diet === "eggetarian" ? "egget" : raw.diet === "nonveg" ? "nonveg" : raw.diet,
          meal: raw.meal ?? ["lunch"],
          cuisines: raw.cuisines ?? ["north"],
          allergens: raw.allergens ?? [],
          avoid: [],
          health: [],
          time: typeof raw.time === "number" ? `${raw.time} min` : String(raw.time || "30 min"),
          cal: raw.cal ?? 300,
          desc: raw.steps?.[0] ? `AI-generated recipe using your ingredients.` : "",
          pairing: null,
          steps: raw.steps ?? [],
          ytQ: `${raw.name} recipe`,
          score: 5,
          isGenerated: true,
        } as Recipe & { isGenerated?: boolean };
        setGeneratedRecipes((prev) => [aiRecipe, ...prev]);
        setGenerationCount((c) => c + 1);
      }
    } catch {
      setGenerationError("Failed to generate recipe. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Combine matched recipes with AI-generated recipes
  const allRecipes = [...generatedRecipes, ...matched];

  // Apply filters
  const filteredRecipes = allRecipes.filter((r) => {
    // Search filter
    if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Time filter
    const mins = parseTime(r.time);
    if (timeFilter === "quick" && mins >= 20) return false;
    if (timeFilter === "medium" && (mins < 20 || mins > 40)) return false;
    if (timeFilter === "long" && mins <= 40) return false;
    // Calorie filter
    if (calFilter === "low" && r.cal >= 250) return false;
    if (calFilter === "medium" && (r.cal < 250 || r.cal > 400)) return false;
    if (calFilter === "high" && r.cal <= 400) return false;
    // Meal filter
    if (mealFilter !== "all" && !r.meal.includes(mealFilter)) return false;
    return true;
  });

  const activeFilters = [timeFilter, calFilter, mealFilter].filter((f) => f !== "all").length;

  if (!matched.length)
    return (
      <div className="fa">
        <BackBtn onClick={onBack} />
        <div
          style={{
            background: T.card,
            borderRadius: 8,
            padding: "2rem 1.5rem",
            border: `1px solid ${T.border}`,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: 20,
              fontWeight: 700,
              color: T.text,
              marginBottom: 8,
            }}
          >
            No recipes found
          </p>
          <p style={{ color: T.textSub, fontSize: 13, lineHeight: 1.7, marginBottom: 18 }}>
            No recipes match your selection and dietary profile. Try adjusting your allergies or dislikes in
            Profile.
          </p>
          <button
            onClick={() => yt(ingNames.join(" ") + " recipe")}
            className="tap"
            style={{
              background: "#180808",
              color: "#e05040",
              border: "1px solid #c0000025",
              borderRadius: 5,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Search on YouTube instead
          </button>
        </div>
      </div>
    );

  return (
    <div className="fa">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <p
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: 22,
              fontWeight: 700,
              color: T.text,
            }}
          >
            {matched.length} recipe{matched.length > 1 ? "s" : ""} found
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5 }}>
            {ingNames.map((n, i) => (
              <Tag key={i} bg={`${T.accent}10`} color={T.accent} bd={`${T.accent}20`}>
                {n}
              </Tag>
            ))}
          </div>
        </div>
        <button
          onClick={onBack}
          className="tap"
          style={{
            background: "none",
            border: `1px solid ${T.border2}`,
            color: T.textSub,
            borderRadius: 3,
            padding: "5px 10px",
            fontSize: 11,
            cursor: "pointer",
            fontFamily: "inherit",
            flexShrink: 0,
          }}
        >
          Change
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipes..."
            style={{
              flex: 1,
              padding: "9px 12px",
              borderRadius: 5,
              border: `1px solid ${T.border2}`,
              fontSize: 16,
              outline: "none",
              background: T.card,
              color: T.text,
            }}
            onFocus={(e) => (e.target.style.borderColor = T.accent)}
            onBlur={(e) => (e.target.style.borderColor = T.border2)}
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="tap"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: showFilters || activeFilters > 0 ? `${T.accent}18` : T.card,
              color: showFilters || activeFilters > 0 ? T.accent : T.textSub,
              border: `1px solid ${showFilters || activeFilters > 0 ? T.accent + "40" : T.border2}`,
              borderRadius: 5,
              padding: "9px 12px",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            {activeFilters > 0 ? `Filters (${activeFilters})` : "Filter"}
          </button>
        </div>

        {/* Filter Chips */}
        {showFilters && (
          <div className="sl" style={{ background: T.card, borderRadius: 6, padding: "12px", border: `1px solid ${T.border}`, marginBottom: 10 }}>
            <div style={{ marginBottom: 10 }}>
              <p style={{ color: T.textSub, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Cook Time</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {TIME_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTimeFilter(f.id)}
                    className="tap"
                    style={{
                      background: timeFilter === f.id ? T.accent : T.card2,
                      color: timeFilter === f.id ? "#fff" : T.textSub,
                      border: `1px solid ${timeFilter === f.id ? T.accent : T.border}`,
                      borderRadius: 3,
                      padding: "4px 10px",
                      fontSize: 11,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <p style={{ color: T.textSub, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Calories</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {CAL_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setCalFilter(f.id)}
                    className="tap"
                    style={{
                      background: calFilter === f.id ? T.teal : T.card2,
                      color: calFilter === f.id ? "#fff" : T.textSub,
                      border: `1px solid ${calFilter === f.id ? T.teal : T.border}`,
                      borderRadius: 3,
                      padding: "4px 10px",
                      fontSize: 11,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ color: T.textSub, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Meal Type</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {MEAL_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setMealFilter(f.id)}
                    className="tap"
                    style={{
                      background: mealFilter === f.id ? T.gold : T.card2,
                      color: mealFilter === f.id ? "#fff" : T.textSub,
                      border: `1px solid ${mealFilter === f.id ? T.gold : T.border}`,
                      borderRadius: 3,
                      padding: "4px 10px",
                      fontSize: 11,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            {activeFilters > 0 && (
              <button
                onClick={() => { setTimeFilter("all"); setCalFilter("all"); setMealFilter("all"); }}
                className="tap"
                style={{
                  marginTop: 10,
                  background: "none",
                  color: T.textSub,
                  border: `1px solid ${T.border2}`,
                  borderRadius: 3,
                  padding: "5px 10px",
                  fontSize: 11,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Results count */}
        {(searchQuery || activeFilters > 0) && (
          <p style={{ color: T.textSub, fontSize: 12 }}>
            Showing {filteredRecipes.length} of {allRecipes.length} recipes
          </p>
        )}
      </div>

      {/* AI Recipe Generation - Premium Card */}
      <div
        style={{
          background: T.card,
          border: `1.5px solid ${T.border}`,
          borderRadius: 16,
          padding: "18px",
          marginBottom: 18,
          boxShadow: "var(--fc-shadow-md)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gradient accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "linear-gradient(90deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%)",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px -4px rgba(139, 92, 246, 0.5)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <p style={{ color: T.text, fontSize: 15, fontWeight: 600, marginBottom: 2 }}>
                  AI Recipe Generator
                </p>
                <p style={{ color: T.textSub, fontSize: 12 }}>
                  {2 - generationCount} generations remaining
                </p>
              </div>
            </div>
            <p style={{ color: T.textSub, fontSize: 13, lineHeight: 1.5 }}>
              Create a unique recipe tailored to your ingredients and preferences.
            </p>
          </div>
          <button
            onClick={generateAIRecipe}
            disabled={isGenerating || generationCount >= 2}
            className="tap"
            style={{
              background: isGenerating ? T.card2 : "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "12px 20px",
              fontSize: 13,
              fontWeight: 600,
              cursor: isGenerating || generationCount >= 2 ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: generationCount >= 2 ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: isGenerating ? "none" : "0 4px 16px -4px rgba(139, 92, 246, 0.5)",
              flexShrink: 0,
            }}
          >
            {isGenerating ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Generate
              </>
            )}
          </button>
        </div>
        {generationError && (
          <p style={{ color: "#ef4444", fontSize: 12, marginTop: 12, padding: "8px 12px", background: "#fef2f2", borderRadius: 8 }}>{generationError}</p>
        )}
      </div>

      {/* Cook-list banner */}
      {cookList.length > 0 && (
        <button
          onClick={onGrocery}
          className="tap"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            background: `linear-gradient(135deg, ${T.accent}15 0%, ${T.accent}08 100%)`,
            border: `1.5px solid ${T.accent}40`,
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 14,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🛒</span>
            <div style={{ textAlign: "left" }}>
              <p style={{ color: T.accent, fontSize: 13, fontWeight: 700, margin: 0 }}>
                {cookList.length} recipe{cookList.length > 1 ? "s" : ""} in your grocery list
              </p>
              <p style={{ color: T.textSub, fontSize: 11, margin: 0, marginTop: 1 }}>
                Tap to order on Blinkit, Swiggy, Zepto →
              </p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12,5 19,12 12,19" />
          </svg>
        </button>
      )}

      {filteredRecipes.length === 0 && (searchQuery || activeFilters > 0) && (
        <div style={{ textAlign: "center", padding: "2rem", color: T.textSub, fontSize: 13 }}>
          No recipes match your filters. Try adjusting your criteria.
        </div>
      )}

      <div className="recipe-list">
      {filteredRecipes.map((r, idx) => {
        const isBest = (r.score || 0) > 2;
        const isAI = (r as Recipe & { isGenerated?: boolean }).isGenerated;
        const cuisineLabel = r.cuisines.map((c) => PREF.cuisine.find((x) => x.id === c)?.label || c).join(" · ");
        const dietIcon = r.diet === "vegan" ? "🌱" : r.diet === "veg" ? "🥬" : r.diet === "nonveg" ? "🍗" : "🥚";
        const macros = estimateMacros(r);
        const hasGoal = (prefs.macroTargets?.goal || "none") !== "none" && (prefs.macroTargets?.calories ?? 0) > 0;
        const macroFit = hasGoal ? macroFitScore(r, prefs.macroTargets) : 0;
        const inCook = cookList.includes(r.id);
        const dietClass = r.diet === "veg" ? "diet-veg" : r.diet === "vegan" ? "diet-vegan" : r.diet === "nonveg" ? "diet-nonveg" : "diet-egget";
        const cardGrad = getRecipeGradient(r);
        const cardEmoji = getRecipeEmoji(r);
        return (
          <div
            key={r.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(r)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen(r);
              }
            }}
            className={`tap card-hover ${dietClass}`}
            style={{
              display: "block",
              width: "100%",
              background: T.card,
              borderRadius: 16,
              border: `1.5px solid ${isAI ? "#8b5cf640" : isBest ? T.accent + "40" : T.border}`,
              padding: 0,
              marginBottom: 14,
              textAlign: "left",
              fontFamily: "inherit",
              cursor: "pointer",
              overflow: "hidden",
              boxShadow: inCook
                ? "0 0 0 2px #4ade8050, var(--fc-shadow-md)"
                : "var(--fc-shadow-md)",
            }}
          >
            {/* Recipe photo header */}
            <RecipeImageHeader recipe={r} variant="card" emoji={cardEmoji} gradient={cardGrad}>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 14px", zIndex: 2 }}>
                <p style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>{r.name}</p>
                <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
                  {r.meal.slice(0, 2).map((m) => (
                    <span key={m} style={{ background: "rgba(0,0,0,0.45)", color: "#e5e5e5", fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4, textTransform: "capitalize" }}>{m}</span>
                  ))}
                  {inCook && <span style={{ background: "rgba(74,222,128,0.2)", color: "#4ade80", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>🛒 Added</span>}
                </div>
              </div>
            </RecipeImageHeader>

            {/* Card Body — compact single section */}
            <div style={{ padding: "10px 14px 0" }}>
              {/* Row 1: cuisine + match badge */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ color: T.textSub, fontSize: 12, margin: 0, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {cuisineLabel}
                </p>
                {isAI ? (
                  <span style={{ background: "#8b5cf6", color: "#fff", fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 5, letterSpacing: 0.3, flexShrink: 0, marginLeft: 8 }}>AI</span>
                ) : isBest ? (
                  <span style={{ background: T.accent, color: "#fff", fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 5, flexShrink: 0, marginLeft: 8 }}>Best match</span>
                ) : null}
              </div>
              {/* Row 2: stats + arrow */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ color: T.textSub, fontSize: 13 }}>⏱ <strong style={{ color: T.text }}>{r.time}</strong></span>
                <span style={{ color: T.gold, fontSize: 13, fontWeight: 600 }}>🔥 {r.cal} kcal</span>
                {r.health[0] && <span style={{ color: T.teal, fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{PREF.health.find((x) => x.id === r.health[0])?.label || r.health[0]}</span>}
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: isBest ? T.accent : T.card2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isBest ? "#fff" : T.textSub} strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12,5 19,12 12,19" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Macro mini-bar + Cook This */}
            <div style={{ padding: "10px 16px 14px" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* P / C / F pills */}
                {[
                  { label: "P", val: macros.protein, color: "#ef4444" },
                  { label: "C", val: macros.carbs,   color: T.accent  },
                  { label: "F", val: macros.fat,     color: T.teal    },
                ].map(({ label, val, color }) => (
                  <span
                    key={label}
                    style={{
                      background: `${color}18`,
                      color,
                      border: `1px solid ${color}30`,
                      borderRadius: 6,
                      padding: "2px 7px",
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {label} {val}g
                  </span>
                ))}
                {/* Macro-fit badge */}
                {hasGoal && macroFit >= 2 && (
                  <span
                    style={{
                      background: `${T.accent}15`,
                      color: T.accent,
                      border: `1px solid ${T.accent}40`,
                      borderRadius: 6,
                      padding: "2px 8px",
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {macroFit >= 4 ? "✦ Goal fit" : macroFit >= 3 ? "✓ Fits goal" : "≈ Near goal"}
                  </span>
                )}
                {/* Cook This toggle — div to avoid nested <button> */}
                <div
                  onClick={(e) => { e.stopPropagation(); onToggleCook(r.id); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && (e.stopPropagation(), onToggleCook(r.id))}
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: inCook ? `${T.accent}15` : T.card2,
                    color: inCook ? T.accent : T.textSub,
                    border: `1px solid ${inCook ? `${T.accent}50` : T.border}`,
                    borderRadius: 20,
                    padding: "4px 10px",
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                    flexShrink: 0,
                    userSelect: "none",
                  }}
                >
                  {inCook ? "✓ Added" : "🛒 Cook"}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      </div>

      <div
        style={{
          background: T.card,
          borderRadius: 12,
          padding: "12px 14px",
          border: `1.5px solid ${T.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 4,
        }}
      >
        <p style={{ color: T.textSub, fontSize: 13 }}>Search on YouTube</p>
        <button
          onClick={() => yt(ingNames.slice(0, 2).join(" ") + " recipe")}
          className="tap"
          style={{
            background: "#ff0000",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "7px 14px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
            <path d="M23 7s-.3-2-1.2-2.8C20.7 3 19.4 3 18.8 2.9 16.1 2.8 12 2.8 12 2.8s-4.1 0-6.8.1C4.6 3 3.3 3 2.2 4.2 1.3 5 1 7 1 7S.7 9.3.7 11.5v2.1c0 2.2.3 4.4.3 4.4s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.3 22.2 12 22.2 12 22.2s4.1 0 6.8-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.2.3-4.4v-2.1C23.3 9.3 23 7 23 7zM9.7 15.5V8.4l8.1 3.6-8.1 3.5z"/>
          </svg>
          YouTube ↗
        </button>
      </div>
    </div>
  );
}

/* ─── Plan Screen ─── */
function PlanScreen({ prefs }: { prefs: Prefs }) {
  const [extraSeed, setExtraSeed] = useState(0);
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [showShare, setShowShare] = useState(false);
  const todayIdx = ((new Date().getDay() + 6) % 7);

  const safePrefs = {
    diet: ["veg"],
    cuisine: [],
    health: [],
    allergies: [],
    dislikes: [],
    ...prefs,
    allergies: prefs.allergies || [],
    dislikes: prefs.dislikes || [],
  };
  const pool = filterDB(safePrefs);
  const plan = generatePlan(prefs, extraSeed);
  const hasAny = plan.some((d) => d.breakfast || d.lunch || d.dinner);

  if (!hasAny)
    return (
      <div className="fa">
        <div
          style={{
            background: T.card,
            borderRadius: 8,
            padding: "2rem 1.5rem",
            border: `1px solid ${T.border}`,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: 20,
              fontWeight: 700,
              color: T.text,
              marginBottom: 8,
            }}
          >
            No recipes match your profile
          </p>
          <p style={{ color: T.textSub, fontSize: 13, lineHeight: 1.7 }}>
            {pool.length === 0
              ? "Your allergy and dislike filters are excluding everything. Relax them in Profile."
              : `${pool.length} recipes in pool but none match the meal slots. Try adjusting your cuisine or dietary preferences.`}
          </p>
        </div>
      </div>
    );

  if (openDay !== null) {
    const d = plan[openDay];
    return (
      <div className="sl">
        <BackBtn onClick={() => setOpenDay(null)} />
        <div style={{ borderLeft: `3px solid ${d.color}`, paddingLeft: 12, marginBottom: 16 }}>
          <Lbl c={openDay === todayIdx ? T.accent : T.textSub}>
            {openDay === todayIdx ? "Today" : d.full}
          </Lbl>
          <p
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: 24,
              fontWeight: 700,
              color: T.text,
              marginTop: 4,
            }}
          >
            {d.full}
          </p>
        </div>
        {/* WhatsApp share for the whole day's plan */}
        <WABtn
          message={formatPlanDayForWA({ full: d.full, breakfast: d.breakfast ?? null, lunch: d.lunch ?? null, dinner: d.dinner ?? null })}
          label={`Send ${openDay === todayIdx ? "Today's" : d.full + "'s"} Menu to Cook`}
        />
        <div style={{ marginBottom: 12 }} />
        {[
          { slot: "Breakfast", key: "breakfast" as const },
          { slot: "Lunch", key: "lunch" as const },
          { slot: "Dinner", key: "dinner" as const },
        ].map(({ slot, key }) => {
          const r = d[key];
          if (!r)
            return (
              <div
                key={key}
                style={{
                  background: T.card,
                  borderRadius: 6,
                  padding: "1rem",
                  marginBottom: 8,
                  border: `1px solid ${T.border}`,
                  opacity: 0.5,
                }}
              >
                <Lbl>{slot}</Lbl>
                <p style={{ color: T.textSub, fontSize: 13, marginTop: 6 }}>
                  No matching recipe — adjust your profile.
                </p>
              </div>
            );
          return (
            <div
              key={key}
              style={{
                background: T.card,
                borderRadius: 6,
                padding: "1rem 1.1rem",
                marginBottom: 10,
                border: `1px solid ${T.border}`,
              }}
            >
              <Lbl>{slot}</Lbl>
              <p
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: T.text,
                  margin: "5px 0 6px",
                }}
              >
                {r.name}
              </p>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                <Tag>{r.time}</Tag>
                {r.health.slice(0, 2).map((h, i) => (
                  <Tag key={i} bg={T.tealBg} color={T.teal} bd={`${T.teal}25`}>
                    {PREF.health.find((x) => x.id === h)?.label || h}
                  </Tag>
                ))}
                {r.allergens.length === 0 && (
                  <Tag bg="#0a180a" color="#4ade80" bd="#1a3d1a22">
                    Allergen-free
                  </Tag>
                )}
              </div>
              <YTBtn query={r.ytQ} label={`Watch "${r.name}" recipe`} />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="fa">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
        <div>
          <p
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: 22,
              fontWeight: 700,
              color: T.text,
            }}
          >
            Weekly Meal Plan
          </p>
          <p style={{ color: T.textSub, fontSize: 12, marginTop: 3 }}>
            Generated from your profile. Tap any day.
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setShowShare(true)}
            className="tap"
            style={{
              background: T.accent,
              border: "none",
              color: "#fff",
              borderRadius: 4,
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Share
          </button>
          <button
            onClick={() => setExtraSeed((s) => s + 1)}
            className="tap"
            style={{
              background: "none",
              border: `1px solid ${T.border2}`,
              color: T.textSub,
              borderRadius: 4,
              padding: "6px 12px",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            ↻ Shuffle
          </button>
        </div>
      </div>

      <div
        style={{
          background: T.card,
          borderRadius: 6,
          padding: "9px 12px",
          border: `1px solid ${T.border}`,
          marginBottom: 14,
          display: "flex",
          gap: 5,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Tag bg={`${T.accent}14`} color={T.accent} bd={`${T.accent}25`}>
          {PREF.diet.find((x) => x.id === (prefs.diet || [])[0])?.label || "Veg"}
        </Tag>
        {(prefs.allergies || []).map((a) => (
          <Tag key={a} bg="#1a0808" color="#e05040" bd="#c0000020">
            No {ALLERGENS.find((x) => x.id === a)?.label || a}
          </Tag>
        ))}
        {(prefs.cuisine || []).slice(0, 3).map((c, i) => (
          <Tag key={i}>{PREF.cuisine.find((x) => x.id === c)?.label || c}</Tag>
        ))}
        <span style={{ marginLeft: "auto", color: T.textMut, fontSize: 10 }}>{pool.length} recipes in pool</span>
      </div>

      {plan.map((d, i) => {
        const isToday = i === todayIdx;
        return (
          <button
            key={i}
            onClick={() => setOpenDay(i)}
            className="tap"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              width: "100%",
              background: isToday ? T.card2 : T.card,
              borderRadius: 6,
              padding: "12px 14px",
              marginBottom: 6,
              border: `1px solid ${isToday ? d.color + "55" : T.border}`,
              textAlign: "left",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            <div style={{ minWidth: 30, textAlign: "center", paddingTop: 1 }}>
              <p
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontSize: 14,
                  fontWeight: 700,
                  color: d.color,
                  lineHeight: 1,
                }}
              >
                {d.day}
              </p>
              {isToday && (
                <p
                  style={{
                    fontSize: 7,
                    color: d.color,
                    opacity: 0.7,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    marginTop: 1,
                  }}
                >
                  today
                </p>
              )}
            </div>
            <div style={{ width: 1, background: `${d.color}30`, alignSelf: "stretch", minHeight: 40 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {[
                { s: "B", r: d.breakfast },
                { s: "L", r: d.lunch },
                { s: "D", r: d.dinner },
              ].map(
                ({ s, r }) =>
                  r && (
                    <p
                      key={s}
                      style={{
                        color: T.text,
                        fontSize: 12,
                        margin: "1px 0",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      <span style={{ color: T.textSub, marginRight: 5, fontSize: 10 }}>{s}</span>
                      {r.name}
                    </p>
                  )
              )}
            </div>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.textMut} strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12,5 19,12 12,19" />
            </svg>
          </button>
        );
      })}

      {/* Share Modal */}
      {showShare && (
        <ShareMealPlan
          plan={plan}
          prefs={prefs}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

/* ─── Home Screen ─── */
function HomeScreen({
  prefs,
  history,
  onFridge,
  onPlan,
  onShopping,
  onNutrition,
  cookList,
  onGrocery,
}: {
  prefs: Prefs;
  history: { ingredients: string[]; count: number; ts: number }[];
  onFridge: () => void;
  onPlan: () => void;
  onShopping: () => void;
  onNutrition: () => void;
  cookList: number[];
  onGrocery: () => void;
}) {
  const now = new Date();
  const hour = now.getHours();
  const todayIdx = ((now.getDay() + 6) % 7);
  const todayPlan = generatePlan(prefs, 0)[todayIdx];
  const lastSess = history[history.length - 1];
  const dietLabel = PREF.diet.find((x) => x.id === (prefs.diet || [])[0])?.label || "Vegetarian";
  const firstName = (prefs.name || "").split(" ")[0];

  // Time-aware greeting
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const greetingEmoji = hour < 12 ? "🌅" : hour < 17 ? "☀️" : "🌙";

  // Current meal slot
  const mealSlot = hour < 11 ? "breakfast" : hour < 15 ? "lunch" : "dinner";
  const mealSlotLabel = mealSlot === "breakfast" ? "Breakfast" : mealSlot === "lunch" ? "Lunch" : "Dinner";
  const mealSlotEmoji = mealSlot === "breakfast" ? "🌅" : mealSlot === "lunch" ? "☀️" : "🌙";
  const currentMeal = todayPlan?.[mealSlot as keyof typeof todayPlan] as Recipe | null | undefined;

  // Mood chips
  const MOODS = [
    { id: "quick", label: "⚡ Quick", desc: "Under 15 min", filter: (r: Recipe) => parseInt(r.time) <= 15 },
    { id: "comfort", label: "🫶 Comfort", desc: "Dal, curry, khichdi", filter: (r: Recipe) => ["Dal", "Moong Dal", "Basmati Rice", "Toor Dal", "Urad Dal"].some(c => r.core.includes(c)) },
    { id: "protein", label: "💪 Protein", desc: "High protein", filter: (r: Recipe) => r.health.includes("protein") },
    { id: "light", label: "🥗 Light", desc: "Under 250 kcal", filter: (r: Recipe) => r.cal <= 250 },
  ];

  // History insight — day-of-week pattern
  const dayName = WD[todayIdx].full;
  const sameDayHistory = history.filter((h) => {
    const d = new Date(h.ts);
    return ((d.getDay() + 6) % 7) === todayIdx;
  });
  const topIngredient = sameDayHistory.length >= 2
    ? sameDayHistory[sameDayHistory.length - 1].ingredients[0]
    : null;

  return (
    <div className="fa">
      {/* ── Grocery Order Banner (when recipes queued) ── */}
      {cookList.length > 0 && (
        <button
          onClick={onGrocery}
          className="tap"
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
          background: "linear-gradient(135deg, #071a1a 0%, #0a2424 100%)",
          border: "1.5px solid #2dd4bf35",
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 14,
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 4px 20px -8px #4ade8040",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "#4ade8020",
              border: "1px solid #4ade8040",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              flexShrink: 0,
              marginRight: 12,
            }}
          >
            🛒
          </div>
          <div style={{ flex: 1, textAlign: "left" }}>
            <p style={{ color: "#4ade80", fontSize: 13, fontWeight: 700, margin: 0 }}>
              {cookList.length} recipe{cookList.length > 1 ? "s" : ""} ready to order
            </p>
            <p style={{ color: "#86efac", fontSize: 11, margin: "2px 0 0" }}>
              Order ingredients on Blinkit, Swiggy or Zepto →
            </p>
          </div>
          <span style={{ color: "#4ade80", fontSize: 18, marginLeft: 8 }}>›</span>
        </button>
      )}

      {/* ── Hero + Greeting ── */}
      <div
        style={{
          borderRadius: 20,
          overflow: "hidden",
          marginBottom: 16,
          background: `linear-gradient(145deg, ${T.accent}18 0%, ${T.accent}0a 50%, ${T.accent}18 100%)`,
          border: `1px solid ${T.accent}30`,
          boxShadow: `0 12px 40px -12px ${T.accent}35`,
        }}
      >
        {/* Decorative spice dots */}
        <div
          style={{
            position: "relative",
            padding: "22px 20px 0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -20,
              right: -20,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${T.accent}18 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 10,
              fontSize: 60,
              opacity: 0.07,
              lineHeight: 1,
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            🍛
          </div>
          <p style={{ color: T.textSub, fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
            {greetingEmoji} {greeting}{firstName ? `, ${firstName}` : ""}!
          </p>
          <p
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: 30,
              fontWeight: 700,
              color: T.text,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              marginBottom: 16,
            }}
          >
            {"What's cooking"}
            <br />
            <span style={{ color: T.accent }}>today?</span>
          </p>
        </div>

        {/* Cook for Me Now card */}
        {currentMeal ? (
          <button
            onClick={onPlan}
            className="tap"
            style={{
              width: "100%",
              background: `${T.accent}18`,
              border: "none",
              borderTop: `1px solid ${T.accent}25`,
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              fontFamily: "inherit",
              gap: 10,
            }}
          >
            <div style={{ textAlign: "left" }}>
              <p style={{ color: T.textSub, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>
                {mealSlotEmoji} Time for {mealSlotLabel}
              </p>
              <p style={{ color: T.text, fontSize: 15, fontWeight: 600 }}>{(currentMeal as Recipe).name}</p>
              <p style={{ color: T.textSub, fontSize: 11, marginTop: 2 }}>{(currentMeal as Recipe).time} · {(currentMeal as Recipe).cal} kcal</p>
            </div>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: T.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </div>
          </button>
        ) : (
          <button
            onClick={onFridge}
            className="tap"
            style={{
              width: "100%",
              background: `${T.accent}18`,
              border: "none",
              borderTop: `1px solid ${T.accent}25`,
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <p style={{ color: T.text, fontSize: 14, fontWeight: 500 }}>
              Open your fridge and find recipes →
            </p>
          </button>
        )}
      </div>

      {/* ── Mood Chips (compact horizontal scroll) ── */}
      <div className="scroll-x stagger" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {MOODS.map((mood) => (
          <button
            key={mood.id}
            onClick={onFridge}
            className="tap fa"
            style={{
              background: T.card,
              border: `1.5px solid ${T.border}`,
              borderRadius: 20,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 500,
              color: T.text,
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              boxShadow: "var(--fc-shadow-sm)",
            }}
          >
            {mood.label}
          </button>
        ))}
      </div>

      {/* ── Primary CTA ── */}
      <button
        onClick={onFridge}
        className="tap card-hover"
        style={{
          width: "100%",
          background: `linear-gradient(135deg, ${T.accent} 0%, #78350f 100%)`,
          color: "#fff",
          border: "none",
          borderRadius: 16,
          padding: "18px 20px",
          fontSize: 16,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          boxShadow: `0 8px 28px -8px ${T.accent}60`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>🧑‍🍳</span>
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>What's in your fridge?</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, opacity: 0.85, fontWeight: 400 }}>Pick ingredients → get recipes</p>
          </div>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>
      </button>

      {/* ── Secondary quick actions ── */}
      <div className="stagger" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Weekly Plan", icon: "📅", onClick: onPlan, color: T.accent },
          { label: "Shopping", icon: "🛍️", onClick: onShopping, color: T.teal },
          { label: "Nutrition", icon: "📊", onClick: onNutrition, color: T.gold },
        ].map(({ label, icon, onClick, color }) => (
          <button
            key={label}
            onClick={onClick}
            className="tap fa"
            style={{
              background: T.card,
              border: `1.5px solid ${T.border}`,
              borderRadius: 12,
              padding: "12px 8px",
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 5,
              boxShadow: "var(--fc-shadow-sm)",
            }}
          >
            <span style={{ fontSize: 22 }}>{icon}</span>
            <span style={{ color, fontSize: 11, fontWeight: 600 }}>{label}</span>
          </button>
        ))}
      </div>


      {/* ── Today's Meals (compact) ── */}
      <div style={{ background: T.card, borderRadius: 14, border: `1.5px solid ${T.border}`, overflow: "hidden", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px 8px" }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>Today · {WD[todayIdx].full}</p>
          <button onClick={onPlan} className="tap" style={{ background: "none", border: "none", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>View plan →</button>
        </div>
        {[
          { slot: "Breakfast", emoji: "🌅", r: todayPlan?.breakfast },
          { slot: "Lunch",     emoji: "☀️",  r: todayPlan?.lunch },
          { slot: "Dinner",    emoji: "🌙",  r: todayPlan?.dinner },
        ].map(({ slot, emoji, r }, i) => (
          <div key={slot} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? "transparent" : `${T.accent}04` }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{emoji}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.textSub, width: 72, flexShrink: 0 }}>{slot}</span>
            <span style={{ fontSize: 14, color: r ? T.text : T.textMut, fontWeight: r ? 500 : 400, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r ? r.name : "Not set"}</span>
            {r && <button onClick={() => yt(r.ytQ)} className="tap" style={{ background: "none", border: "none", color: "#e05040", fontSize: 11, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, padding: "4px 0" }}>▶</button>}
          </div>
        ))}
      </div>

      {/* ── History / insight ── */}
      {(lastSess || topIngredient) && (
        <div style={{ background: T.card, borderRadius: 14, border: `1.5px solid ${T.border}`, padding: "12px 14px", marginBottom: 12 }}>
          {topIngredient && (
            <p style={{ color: T.textSub, fontSize: 13, margin: "0 0 4px" }}>
              You often cook with <span style={{ color: T.accent, fontWeight: 600 }}>{topIngredient}</span> on {dayName}s
              <button onClick={onFridge} className="tap" style={{ background: "none", border: "none", color: T.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginLeft: 4 }}>→</button>
            </p>
          )}
          {lastSess && (
            <p style={{ color: T.textMut, fontSize: 12, margin: 0 }}>
              Last search: <span style={{ color: T.text }}>{lastSess.ingredients.slice(0, 3).join(", ")}{lastSess.ingredients.length > 3 ? ` +${lastSess.ingredients.length - 3}` : ""}</span> · {lastSess.count} recipes
            </p>
          )}
        </div>
      )}

      {/* ── YouTube Channels ── */}
      <div style={{ background: T.card, borderRadius: 14, border: `1.5px solid ${T.border}`, padding: "12px 14px" }}>
        <Lbl>Indian Cooking Channels</Lbl>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 10 }}>
          {YT_CHS.map((ch) => (
            <button
              key={ch.h}
              onClick={() => ytCh(ch.h)}
              className="tap"
              style={{
                background: T.card2,
                color: T.text,
                fontSize: 11,
                padding: "8px 10px",
                borderRadius: 4,
                border: `1px solid ${T.border}`,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span style={{ color: "#e05040", fontSize: 11 }}>▶</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Navigation ─── */
const NAV = [
  { s: "home",    label: "Home",    icon: "home"    },
  { s: "fridge",  label: "Cook",    icon: "fridge"  },
  { s: "results", label: "Recipes", icon: "fridge"  },
  { s: "grocery", label: "Grocery", icon: "grocery" },
  { s: "plan",    label: "Plan",    icon: "plan"    },
  { s: "profile", label: "Profile", icon: "profile" },
];

/* ─── Grocery Order Screen ─── */
function GroceryOrderScreen({
  cookList,
  onToggleCook,
  onClear,
  onBack,
}: {
  cookList: number[];
  onToggleCook: (id: number) => void;
  onClear: () => void;
  onBack: () => void;
}) {
  const [activePlatform, setActivePlatform] = useState("blinkit");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const selectedRecipes = DB.filter((r) => cookList.includes(r.id));

  // Aggregate all grocery items across selected recipes (deduplicated)
  const allItems = Array.from(
    new Set(selectedRecipes.flatMap((r) => extractGroceryItems(r)))
  ).sort();

  const platform = PLATFORMS.find((p) => p.id === activePlatform) || PLATFORMS[0];

  const toggleCheck = (item: string) =>
    setChecked((s) => {
      const n = new Set(s);
      n.has(item) ? n.delete(item) : n.add(item);
      return n;
    });

  const uncheckedItems = allItems.filter((i) => !checked.has(i));

  return (
    <div className="su" style={{ paddingBottom: 8 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <BackBtn onClick={onBack} />
        {cookList.length > 0 && (
          <button
            onClick={onClear}
            className="tap"
            style={{
              background: "none",
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              padding: "6px 12px",
              color: T.textSub,
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Clear all
          </button>
        )}
      </div>

      <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 28, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>
        Grocery Order
      </h2>
      <p style={{ color: T.textSub, fontSize: 13, marginBottom: 20 }}>
        {selectedRecipes.length} recipe{selectedRecipes.length !== 1 ? "s" : ""} · {allItems.length} ingredients
      </p>

      {selectedRecipes.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem 1rem",
            background: T.card,
            borderRadius: 16,
            border: `1px solid ${T.border}`,
          }}
        >
          <p style={{ fontSize: 40, margin: "0 0 12px" }}>🛒</p>
          <p style={{ color: T.text, fontWeight: 600, fontSize: 15, margin: "0 0 6px" }}>No recipes added yet</p>
          <p style={{ color: T.textSub, fontSize: 12 }}>
            Tap "Cook This" on any recipe card or detail page to add it here.
          </p>
        </div>
      ) : (
        <>
          {/* Selected recipes chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
            {selectedRecipes.map((r) => (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 20,
                  padding: "6px 10px 6px 12px",
                }}
              >
                <span style={{ color: T.text, fontSize: 12, fontWeight: 500 }}>{r.name}</span>
                <button
                  onClick={() => onToggleCook(r.id)}
                  className="tap"
                  style={{
                    background: T.card2,
                    border: "none",
                    borderRadius: "50%",
                    width: 18,
                    height: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: T.textSub,
                    fontSize: 10,
                    padding: 0,
                    fontFamily: "inherit",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Platform selector */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: T.textMut, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
              Order on
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {PLATFORMS.map((pl) => {
                const active = activePlatform === pl.id;
                return (
                  <button
                    key={pl.id}
                    onClick={() => setActivePlatform(pl.id)}
                    className="tap"
                    style={{
                      background: active ? pl.bg : T.card2,
                      border: `1.5px solid ${active ? pl.color + "50" : T.border}`,
                      borderRadius: 10,
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{pl.emoji}</span>
                    <span style={{ color: active ? pl.color : T.text, fontSize: 12, fontWeight: 600 }}>
                      {pl.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ingredient list */}
          <div
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ color: T.text, fontSize: 13, fontWeight: 600, margin: 0 }}>
                Ingredients ({uncheckedItems.length} remaining)
              </p>
              <button
                onClick={() => setChecked(new Set(allItems))}
                className="tap"
                style={{ background: "none", border: "none", color: T.textSub, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
              >
                Check all
              </button>
            </div>
            {allItems.map((item) => {
              const done = checked.has(item);
              return (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "11px 16px",
                    borderBottom: `1px solid ${T.border}`,
                    background: done ? T.card2 : "transparent",
                  }}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleCheck(item)}
                    className="tap"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      border: `2px solid ${done ? "#4ade80" : T.border2}`,
                      background: done ? "#4ade8020" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      flexShrink: 0,
                      padding: 0,
                      fontFamily: "inherit",
                    }}
                  >
                    {done && <span style={{ color: "#4ade80", fontSize: 12 }}>✓</span>}
                  </button>

                  {/* Item name */}
                  <span
                    style={{
                      flex: 1,
                      color: done ? T.textMut : T.text,
                      fontSize: 13,
                      fontWeight: 500,
                      textDecoration: done ? "line-through" : "none",
                    }}
                  >
                    {item}
                  </span>

                  {/* Quick order button */}
                  {!done && (
                    <button
                      onClick={() => openLink(platform.url(item))}
                      className="tap"
                      style={{
                        background: platform.bg,
                        border: `1px solid ${platform.color}40`,
                        borderRadius: 8,
                        padding: "4px 10px",
                        color: platform.color,
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        flexShrink: 0,
                      }}
                    >
                      {platform.emoji} Order
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Open platform app button */}
          <button
            onClick={() => openLink(platform.home)}
            className="tap"
            style={{
              width: "100%",
              background: `linear-gradient(135deg, ${platform.color}20 0%, ${platform.color}08 100%)`,
              border: `1.5px solid ${platform.color}40`,
              borderRadius: 14,
              padding: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              cursor: "pointer",
              fontFamily: "inherit",
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 22 }}>{platform.emoji}</span>
            <span style={{ color: platform.color, fontSize: 15, fontWeight: 700 }}>
              Open {platform.label}
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={platform.color} strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12,5 19,12 12,19" />
            </svg>
          </button>

          {/* WhatsApp grocery list */}
          <button
            onClick={() => {
              const msg =
                `🛒 *Grocery List — FridgeChef*\n\n` +
                `Recipes: ${selectedRecipes.map((r) => r.name).join(", ")}\n\n` +
                `*Ingredients:*\n` +
                allItems.map((i) => `• ${i}`).join("\n") +
                `\n\n_Sent via FridgeChef India_ 🍛`;
              sendToWhatsApp(msg);
            }}
            className="tap"
            style={{
              width: "100%",
              background: "#06140a",
              border: "1px solid #25d36630",
              borderRadius: 14,
              padding: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#25d366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span style={{ color: "#25d366", fontSize: 13, fontWeight: 700 }}>
              Send grocery list to Cook
            </span>
          </button>
        </>
      )}
    </div>
  );
}

/* ─── Main App Component ─── */
export default function FridgeChef() {
  const { activeProfile, updateActiveProfile, signOut, deleteProfile } = useProfile();
  const profileId = activeProfile?.id ?? "";

  const [screen, setScreen] = useState("home");
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [selected, setSelected] = useState<number[]>([]);
  const [matched, setMatched] = useState<Recipe[]>([]);
  const [ingNames, setIngNames] = useState<string[]>([]);
  const [history, setHistory] = useState<{ ingredients: string[]; count: number; ts: number }[]>([]);
  const [detail, setDetail] = useState<Recipe | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [cookList, setCookList] = useState<number[]>([]);

  // Load persisted state for the active profile
  useEffect(() => {
    if (!profileId) return;
    setIsLoaded(false);
    try {
      const onboarded = localStorage.getItem(profileStorageKey(profileId, "onboarded"));
      const savedPrefs = localStorage.getItem(profileStorageKey(profileId, "prefs"));
      const savedSel = localStorage.getItem(profileStorageKey(profileId, "sel"));
      const savedHist = localStorage.getItem(profileStorageKey(profileId, "hist"));
      const savedCook = localStorage.getItem(profileStorageKey(profileId, "cook"));

      setShowOnboarding(onboarded !== "true" && !activeProfile?.onboarded);
      setPrefs(savedPrefs ? { ...DEFAULT_PREFS, ...JSON.parse(savedPrefs) } : DEFAULT_PREFS);
      setSelected(savedSel ? JSON.parse(savedSel) : []);
      setHistory(savedHist ? JSON.parse(savedHist) : []);
      setCookList(savedCook ? JSON.parse(savedCook) : []);
      setMatched([]);
      setIngNames([]);
      setDetail(null);
      setScreen("home");
    } catch {
      setPrefs(DEFAULT_PREFS);
      setSelected([]);
      setHistory([]);
      setCookList([]);
    }
    setIsLoaded(true);
  }, [profileId, activeProfile?.onboarded]);

  useEffect(() => {
    if (!profileId) return;
    try {
      localStorage.setItem(profileStorageKey(profileId, "prefs"), JSON.stringify(prefs));
    } catch {}
  }, [prefs, profileId]);

  useEffect(() => {
    if (!profileId) return;
    try {
      localStorage.setItem(profileStorageKey(profileId, "sel"), JSON.stringify(selected));
    } catch {}
  }, [selected, profileId]);

  useEffect(() => {
    if (!profileId) return;
    try {
      localStorage.setItem(profileStorageKey(profileId, "hist"), JSON.stringify(history));
    } catch {}
  }, [history, profileId]);

  useEffect(() => {
    if (!profileId) return;
    try {
      localStorage.setItem(profileStorageKey(profileId, "cook"), JSON.stringify(cookList));
    } catch {}
  }, [cookList, profileId]);

  const toggleCookList = (id: number) =>
    setCookList((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const goResults = (m: Recipe[], names: string[]) => {
    setMatched(m);
    setIngNames(names);
    setHistory((h) => [...h.slice(-9), { ingredients: names, count: m.length, ts: Date.now() }]);
    setScreen("results");
  };

  const navTo = (s: string) => {
    if (s === "results" && !matched.length) {
      setScreen("fridge");
      return;
    }
    setDetail(null);
    setScreen(s);
  };

  // Generate plan for shopping list
  const plan = generatePlan(prefs, 0);

  let content;
  if (detail) {
    content = <RecipeDetail r={detail} onBack={() => setDetail(null)} prefs={prefs} cookList={cookList} onToggleCook={toggleCookList} />;
  } else if (screen === "home") {
    content = <HomeScreen prefs={prefs} history={history} onFridge={() => navTo("fridge")} onPlan={() => navTo("plan")} onShopping={() => navTo("shopping")} onNutrition={() => navTo("nutrition")} cookList={cookList} onGrocery={() => navTo("grocery")} />;
  } else if (screen === "fridge") {
    content = <FridgeScreen selected={selected} setSelected={setSelected} prefs={prefs} onResults={goResults} />;
  } else if (screen === "results") {
    content = <ResultsScreen matched={matched} ingNames={ingNames} prefs={prefs} onOpen={setDetail} onBack={() => navTo("fridge")} cookList={cookList} onToggleCook={toggleCookList} onGrocery={() => navTo("grocery")} />;
  } else if (screen === "plan") {
    content = <PlanScreen prefs={prefs} />;
  } else if (screen === "profile") {
    content = <ProfileScreen
      prefs={prefs}
      setPrefs={setPrefs}
      onClearHistory={() => {
        setHistory([]);
        if (profileId) localStorage.removeItem(profileStorageKey(profileId, "hist"));
      }}
      onClearAll={() => {
        setHistory([]);
        setCookList([]);
        setSelected([]);
        setPrefs(DEFAULT_PREFS);
        if (profileId) clearProfileData(profileId);
        setShowOnboarding(true);
      }}
      onSwitchProfile={() => signOut()}
      onSignOut={() => signOut()}
      onDeleteProfile={() => {
        if (profileId) deleteProfile(profileId);
      }}
    />;
  } else if (screen === "shopping") {
    content = <ShoppingListScreen plan={plan} onBack={() => navTo("home")} />;
  } else if (screen === "nutrition") {
    content = <NutritionTrackerScreen plan={plan} onBack={() => navTo("home")} />;
  } else if (screen === "grocery") {
    content = <GroceryOrderScreen cookList={cookList} onToggleCook={toggleCookList} onClear={() => setCookList([])} onBack={() => navTo("home")} />;
  }

  const handleOnboardingComplete = (onboardingPrefs: {
    diet: string[];
    cuisine: string[];
    allergies: string[];
    spice: string[];
    name: string;
  }) => {
    setPrefs((prev) => ({
      ...prev,
      ...onboardingPrefs,
    }));
    if (profileId) {
      localStorage.setItem(profileStorageKey(profileId, "onboarded"), "true");
    }
    updateActiveProfile({ onboarded: true, name: onboardingPrefs.name || activeProfile?.name || "Me" });
    setShowOnboarding(false);
  };

  // Show loading state until preferences are loaded
  if (!isLoaded) {
    return (
      <div
        style={{
          fontFamily: "var(--font-dm-sans), sans-serif",
          maxWidth: 480,
          margin: "0 auto",
          minHeight: "100vh",
          background: T.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🍛</div>
          <p style={{ color: T.textSub, fontSize: 14 }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Show onboarding for new users
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div
      style={{
        fontFamily: "var(--font-dm-sans), sans-serif",
        maxWidth: 480,
        margin: "0 auto",
        minHeight: "100dvh",
        background: T.bg,
        paddingBottom: "var(--nav-height, 72px)",
      }}
    >
      {/* Header - Premium Sticky with safe-area top */}
      <div
        className="glass"
        style={{
          paddingTop: "calc(14px + env(safe-area-inset-top, 0px))",
          paddingBottom: 12,
          paddingLeft: 18,
          paddingRight: 18,
          borderBottom: `1px solid var(--fc-nav-border)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--fc-nav-bg)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${T.accent} 0%, #78350f 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px -4px rgba(234, 88, 12, 0.4)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="4" y1="10" x2="20" y2="10" />
            </svg>
          </div>
          <div>
            <span
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontSize: 19,
                fontWeight: 600,
                color: T.text,
                letterSpacing: "-0.01em",
                display: "block",
              }}
            >
              FridgeChef
            </span>
            {activeProfile && (
              <span style={{ fontSize: 11, color: T.textSub, fontWeight: 500 }}>
                {activeProfile.emoji} {activeProfile.name}
              </span>
            )}
          </div>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: 0.8,
            color: T.textMut,
            textTransform: "uppercase",
            background: T.card2,
            padding: "4px 10px",
            borderRadius: 6,
          }}
        >
          {ING.length} items
        </span>
      </div>

      <div style={{ padding: "16px" }}>
        {content}
      </div>

      {/* Bottom Navigation - Premium Glass Effect with safe-area bottom */}
      <nav
        className="glass"
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 480,
          background: "var(--fc-nav-bg)",
          borderTop: `1px solid var(--fc-nav-border)`,
          display: "flex",
          zIndex: 100,
          paddingTop: 6,
          paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))",
          paddingLeft: 8,
          paddingRight: 8,
          gap: 4,
        }}
      >
        {NAV.filter((tab) => tab.s !== "results" || matched.length > 0).map((tab) => {
          const active = !detail && (screen === tab.s || (tab.s === "fridge" && screen === "fridge"));
          const isGrocery = tab.s === "grocery";
          const groceryCount = isGrocery ? cookList.length : 0;
          const isRecipes = tab.s === "results";
          const recipesCount = isRecipes ? matched.length : 0;
          return (
            <button
              key={tab.s}
              onClick={() => navTo(tab.s)}
              className="tap"
              style={{
                flex: 1,
                padding: "8px 0 6px",
                border: "none",
                background: active ? `${T.accent}12` : "transparent",
                borderRadius: 12,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                color: active ? T.accent : T.textSub,
                fontSize: 10,
                fontWeight: active ? 600 : 500,
                fontFamily: "inherit",
                position: "relative",
              }}
            >
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: active ? T.accent : "transparent",
                    color: active ? "#fff" : T.textSub,
                    transition: "all 0.2s ease",
                  }}
                >
                  {NAV_ICONS[tab.icon]}
                </div>
                {/* Grocery count badge */}
                {isGrocery && groceryCount > 0 && (
                  <span style={{ position: "absolute", top: -4, right: -4, background: T.accent, color: "#fff", fontSize: 8, fontWeight: 800, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${T.bg}` }}>
                    {groceryCount}
                  </span>
                )}
                {/* Recipes count badge */}
                {isRecipes && recipesCount > 0 && !active && (
                  <span style={{ position: "absolute", top: -4, right: -4, background: T.accent, color: "#fff", fontSize: 8, fontWeight: 800, borderRadius: "50%", minWidth: 16, height: 16, padding: "0 3px", display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${T.bg}` }}>
                    {recipesCount}
                  </span>
                )}
              </div>
              <span style={{ letterSpacing: 0.2 }}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
