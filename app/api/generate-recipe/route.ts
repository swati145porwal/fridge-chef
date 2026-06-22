import { generateText, Output } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

const recipeSchema = z.object({
  name: z.string().describe("The name of the recipe"),
  time: z.number().describe("Cooking time in minutes"),
  cal: z.number().describe("Calories per serving"),
  servings: z.number().describe("Number of servings"),
  ingredients: z
    .array(
      z.object({
        name: z.string(),
        qty: z.string(),
      })
    )
    .describe("List of ingredients with quantities"),
  steps: z.array(z.string()).describe("Cooking steps"),
  diet: z
    .enum(["veg", "nonveg", "vegan", "eggetarian"])
    .describe("Dietary category"),
  cuisines: z
    .array(z.string())
    .describe("List of cuisine types"),
  allergens: z
    .array(z.string())
    .describe("List of common allergens present"),
  meal: z
    .array(z.enum(["breakfast", "lunch", "dinner", "snack"]))
    .describe("Meal types this recipe works for"),
  difficulty: z
    .enum(["easy", "medium", "hard"])
    .describe("Difficulty level"),
});

export async function POST(req: Request) {
  try {
    const { ingredients, preferences, apiKey } = await req.json();

    if (!ingredients || ingredients.length === 0) {
      return Response.json(
        { error: "Please select at least one ingredient" },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return Response.json(
        { error: "Please add your OpenAI API key in the Profile section to use AI recipe generation." },
        { status: 400 }
      );
    }

    const ingredientsList = ingredients.join(", ");
    const dietaryRestrictions = preferences.diet
      ? preferences.diet.join(", ")
      : "no specific restrictions";
    const dislikedFlavors = preferences.dislike
      ? preferences.dislike.join(", ")
      : "none";

    // Create OpenAI instance with user's API key
    const userOpenAI = createOpenAI({ apiKey });

    const { output } = await generateText({
      model: userOpenAI("gpt-4o-mini"),
      output: Output.object({
        schema: recipeSchema,
      }),
      prompt: `You are a creative Indian cuisine chef. Generate a unique, delicious Indian recipe using these ingredients: ${ingredientsList}.

Dietary preferences: ${dietaryRestrictions}
Disliked flavors/ingredients to avoid: ${dislikedFlavors}

Be creative! Don't just suggest common recipes - think of interesting combinations and regional dishes. The recipe should:
- Be feasible with the given ingredients
- Respect dietary restrictions
- Be authentic to Indian cuisine
- Provide clear, step-by-step instructions
- Be delicious and exciting

Generate the complete recipe in JSON format.`,
    });

    return Response.json({
      recipe: {
        ...output,
        id: Math.random().toString(36).substring(7),
        isGenerated: true,
      },
    });
  } catch (error: unknown) {
    console.error("Recipe generation error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorString = JSON.stringify(error);
    
    // Check for quota exceeded error
    if (
      errorMessage.includes("exceeded your current quota") ||
      errorMessage.includes("insufficient_quota") ||
      errorString.includes("insufficient_quota")
    ) {
      return Response.json(
        {
          error:
            "Your OpenAI API key has no credits remaining. Please add credits at platform.openai.com/account/billing or use a different API key.",
        },
        { status: 402 }
      );
    }
    
    // Check for invalid API key
    if (
      errorMessage.includes("invalid_api_key") ||
      errorMessage.includes("Incorrect API key") ||
      errorString.includes("invalid_api_key")
    ) {
      return Response.json(
        {
          error:
            "Invalid OpenAI API key. Please check your API key in the Profile section.",
        },
        { status: 401 }
      );
    }

    // Check for AI Gateway credit card requirement
    if (
      errorMessage.includes("credit card") ||
      errorMessage.includes("customer_verification_required")
    ) {
      return Response.json(
        {
          error:
            "AI features require Vercel AI Gateway setup. Please add a credit card to your Vercel account to unlock free AI credits.",
        },
        { status: 403 }
      );
    }

    return Response.json(
      { error: "Failed to generate recipe. Please try again." },
      { status: 500 }
    );
  }
}
