-- FridgeChef India Database Schema

-- 1. Recipes Table
CREATE TABLE IF NOT EXISTS recipes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  core TEXT NOT NULL,
  diet TEXT NOT NULL,
  meal TEXT[] NOT NULL,
  cuisines TEXT[] NOT NULL,
  allergens TEXT[] NOT NULL,
  avoid TEXT[] NOT NULL,
  health TEXT[] NOT NULL,
  time TEXT NOT NULL,
  cal INTEGER NOT NULL,
  description TEXT NOT NULL,
  pairing TEXT,
  steps TEXT[] NOT NULL,
  yt_query TEXT,
  protein INTEGER DEFAULT 0,
  carbs INTEGER DEFAULT 0,
  fat INTEGER DEFAULT 0,
  fiber INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Recipe Ratings Table
CREATE TABLE IF NOT EXISTS recipe_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, device_id)
);

-- 3. Shared Meal Plans Table
CREATE TABLE IF NOT EXISTS shared_meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT,
  plan JSONB NOT NULL,
  preferences JSONB,
  device_id TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Shopping Lists Table
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE,
  device_id TEXT NOT NULL,
  title TEXT,
  items JSONB NOT NULL,
  meal_plan_id UUID REFERENCES shared_meal_plans(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Nutrition Logs Table (for daily tracking)
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
  meal_type TEXT NOT NULL, -- breakfast, lunch, dinner, snack
  servings DECIMAL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_id, date, recipe_id, meal_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ratings_recipe ON recipe_ratings(recipe_id);
CREATE INDEX IF NOT EXISTS idx_ratings_device ON recipe_ratings(device_id);
CREATE INDEX IF NOT EXISTS idx_shared_plans_slug ON shared_meal_plans(slug);
CREATE INDEX IF NOT EXISTS idx_shopping_device ON shopping_lists(device_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_device_date ON nutrition_logs(device_id, date);

-- Enable Row Level Security
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Recipes: Public read only
CREATE POLICY "Anyone can read recipes" ON recipes FOR SELECT USING (true);

-- Ratings: Public read and insert, no update/delete needed for anonymous
CREATE POLICY "Anyone can read ratings" ON recipe_ratings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert ratings" ON recipe_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update ratings" ON recipe_ratings FOR UPDATE USING (true);

-- Shared meal plans: Public read and insert
CREATE POLICY "Anyone can read shared plans" ON shared_meal_plans FOR SELECT USING (true);
CREATE POLICY "Anyone can create plans" ON shared_meal_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update plan views" ON shared_meal_plans FOR UPDATE USING (true);

-- Shopping lists: Public access (filtered by device_id in app)
CREATE POLICY "Anyone can read lists" ON shopping_lists FOR SELECT USING (true);
CREATE POLICY "Anyone can create lists" ON shopping_lists FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update lists" ON shopping_lists FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete lists" ON shopping_lists FOR DELETE USING (true);

-- Nutrition logs: Public access (filtered by device_id in app)
CREATE POLICY "Anyone can read nutrition logs" ON nutrition_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert nutrition logs" ON nutrition_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update nutrition logs" ON nutrition_logs FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete nutrition logs" ON nutrition_logs FOR DELETE USING (true);
