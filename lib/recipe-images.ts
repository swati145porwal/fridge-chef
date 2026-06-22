/** Curated food photos — verified Unsplash URLs (free to use). */

const U = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

const IMG = {
  dosa: U("photo-1743615467204-8fdaa85ff2db"),
  dal: U("photo-1585937421612-70a008356fbe"),
  dalRice: U("photo-1756821753095-64134f5c0c5c"),
  biryani: U("photo-1752673508949-f4aeeaef75f0"),
  biryani2: U("photo-1563379091339-03b21ab4a4f8"),
  curry: U("photo-1596797038530-2c107229654b"),
  curryPlate: U("photo-1589302168068-964664d93dc0"),
  paneer: U("photo-1517244683847-7456b63c5969"),
  thali: U("photo-1728910156510-77488f19b152"),
  rotiMeat: U("photo-1565557623262-b51c2513a641"),
  paratha: U("photo-1542367592-8849eb950fd8"),
  rice: U("photo-1625398407796-82650a8c135f"),
  chana: U("photo-1581600140682-d4e68c8cde32"),
  butterChicken: U("photo-1574484284002-952d92456975"),
  grilled: U("photo-1555939594-58d7cb561ad1"),
  vegPlate: U("photo-1694849789325-914b71ab4075"),
  vegBowl: U("photo-1668236543090-82eba5ee5976"),
  snack: U("photo-1606471191009-63994c53433b"),
  salad: U("photo-1512621776951-a57141f2eefd"),
  chaat: U("photo-1546069901-ba9599a7e63c"),
  eggs: U("photo-1525351484163-7529414344d8"),
  fish: U("photo-1467003909585-2f8a72700288"),
  prawns: U("photo-1565680018434-b513d5e5fd47"),
  mushroom: U("photo-1504674900247-0877df9cc836"),
  pasta: U("photo-1621996346565-e3dbc646d9a9"),
  coffee: U("photo-1495474472287-4d71bcdd2085"),
  tomato: U("photo-1601050690597-df0568f70950"),
  sweet: U("photo-1606787366850-de6330128bfc"),
  millet: U("photo-1628840042765-356cda07504e"),
  /** Local Wikimedia photo — potato & cauliflower sabzi */
  alooGobi: "/recipe-images/aloo-gobi.jpg?v=2",
  /** Remote fallback if local file fails to load */
  alooGobiRemote:
    "https://upload.wikimedia.org/wikipedia/commons/9/9b/Aloo_Gobi_Sabzi.jpg",
};

/** Recipe name → image URL */
const BY_NAME: Record<string, string> = {
  "Moong Dal Chilla": IMG.dal,
  "Besan Chilla": IMG.snack,
  "Kanda Batata Poha": IMG.snack,
  "Vegetable Upma": IMG.rice,
  "Idli & Sambar": IMG.dosa,
  "Plain Dosa": IMG.dosa,
  "Masala Dosa": IMG.dosa,
  "Aloo Paratha": IMG.paratha,
  "Dal Tadka": IMG.dal,
  "Dal Makhani": IMG.curry,
  "Rajma Masala": IMG.curry,
  "Chana Masala": IMG.chana,
  "Palak Paneer": IMG.paneer,
  "Matar Paneer": IMG.paneer,
  "Paneer Bhurji": IMG.paneer,
  "Paneer Butter Masala": IMG.butterChicken,
  "Aloo Gobi": IMG.alooGobi,
  "Bhindi Masala": IMG.vegBowl,
  "Mushroom Masala": IMG.mushroom,
  "Vegetable Biryani": IMG.biryani,
  "Egg Bhurji": IMG.eggs,
  "Egg Curry": IMG.curry,
  "Butter Chicken": IMG.butterChicken,
  "Chicken Curry": IMG.rotiMeat,
  "Chicken Biryani": IMG.biryani2,
  "Fish Curry": IMG.fish,
  "Prawn Masala": IMG.prawns,
  "Kachumber Salad": IMG.salad,
  "Sprout Chaat Salad": IMG.chaat,
  "Pasta Arrabiata": IMG.pasta,
  "Creamy Mushroom Pasta": IMG.mushroom,
  "Shakshuka": IMG.eggs,
  "Avocado Toast with Egg": IMG.eggs,
  "Rava Dosa": IMG.dosa,
  "Medu Vada": IMG.snack,
  "Pongal": IMG.rice,
  "Pesarattu": IMG.dosa,
  "Appam": IMG.dosa,
  "Puttu": IMG.rice,
  "Uttapam": IMG.dosa,
  "Rasam": IMG.dalRice,
  "Kootu": IMG.dal,
  "Aviyal": IMG.vegPlate,
  "Thoran": IMG.vegBowl,
  "Olan": IMG.curry,
  "Bisi Bele Bath": IMG.rice,
  "Puliyodarai (Tamarind Rice)": IMG.rice,
  "Curd Rice (Thayir Sadam)": IMG.rice,
  "Lemon Rice": IMG.rice,
  "Coconut Rice": IMG.rice,
  "Mysore Pak": IMG.sweet,
  "Filter Kaapi (South Indian Coffee)": IMG.coffee,
  "Ragi Mudde": IMG.millet,
  "Ragi Dosa": IMG.dosa,
  "Ragi Roti": IMG.paratha,
  "Ragi Porridge": IMG.millet,
  "Jowar Roti": IMG.paratha,
  "Jowar Upma": IMG.rice,
  "Bajra Roti": IMG.paratha,
  "Bajra Khichdi": IMG.dalRice,
  "Foxtail Millet Pulao": IMG.rice,
  "Foxtail Millet Pongal": IMG.rice,
  "Little Millet Rice (Samai)": IMG.rice,
  "Millet Idli": IMG.dosa,
  "Barnyard Millet Kheer": IMG.sweet,
  "Millet Biryani": IMG.biryani,
};

/** Core ingredient fallback */
const BY_CORE: Record<string, string> = {
  "Moong Dal": IMG.dal,
  Besan: IMG.snack,
  "Besan (Gram Flour)": IMG.sweet,
  Poha: IMG.snack,
  Semolina: IMG.rice,
  "Dosa Batter": IMG.dosa,
  "Wheat Flour": IMG.paratha,
  "Urad Dal": IMG.curry,
  Rajma: IMG.curry,
  "Kabuli Chana": IMG.chana,
  Paneer: IMG.paneer,
  Cauliflower: IMG.alooGobi,
  "Okra / Bhindi": IMG.vegBowl,
  Mushroom: IMG.mushroom,
  "Basmati Rice": IMG.biryani,
  Eggs: IMG.eggs,
  Chicken: IMG.butterChicken,
  Fish: IMG.fish,
  Prawns: IMG.prawns,
  Tomato: IMG.salad,
  Sprouts: IMG.chaat,
  "Pasta (Dry)": IMG.pasta,
  Avocado: IMG.eggs,
  "Coconut (Fresh)": IMG.vegPlate,
  "Coconut Milk": IMG.curry,
  "Toor Dal": IMG.dal,
  Cabbage: IMG.vegBowl,
  Milk: IMG.coffee,
  "Ragi (Finger Millet)": IMG.millet,
  "Jowar (Sorghum)": IMG.paratha,
  "Bajra (Pearl Millet)": IMG.paratha,
  "Foxtail Millet": IMG.rice,
  "Little Millet (Samai)": IMG.rice,
  "Barnyard Millet": IMG.sweet,
};

const DIET_DEFAULT: Record<string, string> = {
  veg: IMG.thali,
  vegan: IMG.curry,
  nonveg: IMG.grilled,
  egget: IMG.eggs,
};

export interface RecipeImageSource {
  name: string;
  core: string;
  diet?: string;
}

export function getRecipeImageUrl(r: RecipeImageSource): string {
  return (
    BY_NAME[r.name] ||
    BY_CORE[r.core] ||
    DIET_DEFAULT[r.diet || "veg"] ||
    IMG.thali
  );
}

/** Alternate URL when the primary image fails (e.g. cached 404). */
export function getRecipeImageFallbackUrl(r: RecipeImageSource): string | null {
  if (r.name === "Aloo Gobi" || r.core === "Cauliflower") {
    return IMG.alooGobiRemote;
  }
  return null;
}
