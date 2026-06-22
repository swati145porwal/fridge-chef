import { createClient } from '@/lib/supabase/client'
import type { 
  Recipe, 
  RecipeRating, 
  SharedMealPlan, 
  ShoppingList, 
  NutritionLog,
  MealPlanData,
  UserPreferences,
  ShoppingItem 
} from '@/lib/types'

const supabase = createClient()

// ============ RECIPES ============

export async function fetchRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data || []
}

export async function fetchRecipeById(id: number): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) return null
  return data
}

// ============ RATINGS ============

export async function fetchRecipeRatings(recipeId: number): Promise<RecipeRating[]> {
  const { data, error } = await supabase
    .from('recipe_ratings')
    .select('*')
    .eq('recipe_id', recipeId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function fetchUserRating(recipeId: number, deviceId: string): Promise<RecipeRating | null> {
  const { data, error } = await supabase
    .from('recipe_ratings')
    .select('*')
    .eq('recipe_id', recipeId)
    .eq('device_id', deviceId)
    .single()
  
  if (error) return null
  return data
}

export async function upsertRating(
  recipeId: number, 
  deviceId: string, 
  rating: number, 
  review?: string
): Promise<RecipeRating> {
  const { data, error } = await supabase
    .from('recipe_ratings')
    .upsert({
      recipe_id: recipeId,
      device_id: deviceId,
      rating,
      review: review || null
    }, {
      onConflict: 'recipe_id,device_id'
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function fetchAverageRating(recipeId: number): Promise<{ avg: number; count: number }> {
  const { data, error } = await supabase
    .from('recipe_ratings')
    .select('rating')
    .eq('recipe_id', recipeId)
  
  if (error || !data || data.length === 0) {
    return { avg: 0, count: 0 }
  }
  
  const sum = data.reduce((acc, r) => acc + r.rating, 0)
  return { avg: sum / data.length, count: data.length }
}

// ============ SHARED MEAL PLANS ============

function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let slug = ''
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return slug
}

export async function createSharedMealPlan(
  plan: MealPlanData,
  deviceId: string,
  title?: string,
  preferences?: UserPreferences
): Promise<SharedMealPlan> {
  const slug = generateSlug()
  
  const { data, error } = await supabase
    .from('shared_meal_plans')
    .insert({
      slug,
      title: title || 'My Meal Plan',
      plan,
      preferences,
      device_id: deviceId
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function fetchSharedMealPlan(slug: string): Promise<SharedMealPlan | null> {
  const { data, error } = await supabase
    .from('shared_meal_plans')
    .select('*')
    .eq('slug', slug)
    .single()
  
  if (error) return null
  
  // Increment views
  await supabase
    .from('shared_meal_plans')
    .update({ views: (data.views || 0) + 1 })
    .eq('id', data.id)
  
  return data
}

// ============ SHOPPING LISTS ============

export async function createShoppingList(
  deviceId: string,
  items: ShoppingItem[],
  title?: string,
  mealPlanId?: string
): Promise<ShoppingList> {
  const slug = generateSlug()
  
  const { data, error } = await supabase
    .from('shopping_lists')
    .insert({
      slug,
      device_id: deviceId,
      title: title || 'Shopping List',
      items,
      meal_plan_id: mealPlanId || null
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function fetchShoppingLists(deviceId: string): Promise<ShoppingList[]> {
  const { data, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function updateShoppingList(
  id: string,
  items: ShoppingItem[]
): Promise<ShoppingList> {
  const { data, error } = await supabase
    .from('shopping_lists')
    .update({ 
      items,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteShoppingList(id: string): Promise<void> {
  const { error } = await supabase
    .from('shopping_lists')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// ============ NUTRITION LOGS ============

export async function logMeal(
  deviceId: string,
  recipeId: number,
  mealType: string,
  servings: number = 1,
  date?: string
): Promise<NutritionLog> {
  const { data, error } = await supabase
    .from('nutrition_logs')
    .upsert({
      device_id: deviceId,
      recipe_id: recipeId,
      meal_type: mealType,
      servings,
      date: date || new Date().toISOString().split('T')[0]
    }, {
      onConflict: 'device_id,date,recipe_id,meal_type'
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function fetchNutritionLogs(
  deviceId: string,
  startDate: string,
  endDate: string
): Promise<NutritionLog[]> {
  const { data, error } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('device_id', deviceId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function deleteMealLog(id: string): Promise<void> {
  const { error } = await supabase
    .from('nutrition_logs')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

export async function fetchTodayNutrition(deviceId: string): Promise<NutritionLog[]> {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('device_id', deviceId)
    .eq('date', today)
  
  if (error) throw error
  return data || []
}
