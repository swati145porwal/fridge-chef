import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { SharedPlanView } from "./shared-plan-view";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SharedPlanPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: plan, error } = await supabase
    .from("shared_meal_plans")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !plan) {
    notFound();
  }

  // Increment view count
  await supabase
    .from("shared_meal_plans")
    .update({ views: (plan.views || 0) + 1 })
    .eq("id", plan.id);

  return <SharedPlanView plan={plan} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("shared_meal_plans")
    .select("title")
    .eq("slug", slug)
    .single();

  return {
    title: plan?.title || "Shared Meal Plan - FridgeChef India",
    description: "View this shared weekly meal plan created with FridgeChef India",
  };
}
