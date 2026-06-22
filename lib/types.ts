// Database types for FridgeChef

export interface Recipe {
  id: number
  name: string
  core: string
  diet: 'veg' | 'vegan' | 'non-veg'
  meal: string[]
  cuisines: string[]
  allergens: string[]
  avoid: string[]
  health: string[]
  time: string
  cal: number
  description: string
  pairing: string | null
  steps: string[]
  yt_query: string | null
  protein: number
  carbs: number
  fat: number
  fiber: number
  created_at: string
}

export interface RecipeRating {
  id: string
  recipe_id: number
  device_id: string
  rating: number
  review: string | null
  created_at: string
}

export interface SharedMealPlan {
  id: string
  slug: string
  title: string | null
  plan: MealPlanData
  preferences: UserPreferences | null
  device_id: string
  views: number
  created_at: string
}

export interface ShoppingList {
  id: string
  slug: string | null
  device_id: string
  title: string | null
  items: ShoppingItem[]
  meal_plan_id: string | null
  created_at: string
  updated_at: string
}

export interface NutritionLog {
  id: string
  device_id: string
  date: string
  recipe_id: number | null
  meal_type: string
  servings: number
  created_at: string
}

// App-specific types
export interface MealPlanData {
  [day: string]: {
    breakfast?: Recipe | null
    lunch?: Recipe | null
    dinner?: Recipe | null
  }
}

export interface UserPreferences {
  diet: string
  allergies: string[]
  dislikes: string[]
  cuisines: string[]
  health: string[]
  spice: number
}

export interface ShoppingItem {
  id: string
  name: string
  category: string
  quantity: string
  checked: boolean
}

export interface DailyNutrition {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  meals: {
    type: string
    recipe: Recipe | null
    servings: number
  }[]
}

// Rating aggregation
export interface RecipeWithRating extends Recipe {
  avgRating: number
  totalRatings: number
  userRating?: number
}
