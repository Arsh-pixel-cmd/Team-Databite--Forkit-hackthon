import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Analysis result type from AI providers
interface AnalysisResult {
    isFood: boolean;
    dishName?: string;
    type?: 'packaged' | 'prepared';
    ingredients?: string[];
    freshness?: 'fresh' | 'caution' | 'spoiled';
    calories?: number;
    protein?: number;
    fat?: number;
    reason?: string;
    error?: string;
}

// Force use of local Deno proxy port for now (bypassing potentially stale .env)
const SUPABASE_URL = 'http://127.0.0.1:8000';
// const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:8000';
const PROXY_ENDPOINT = `${SUPABASE_URL}/api-proxy`; // Direct path when running standalone


/**
 * Proxy-based Dish Audit with Hybrid Intelligence
 * 1. Gemini: Visual Analysis (Is it food? What is it? Is it packaged?)
 * 2. RecipeDB/FlavorDB: Scientific Data (Ingredients, Nutrition) for PREPARED food.
 * 3. Gemini Fallback: For PACKAGED food (Kurkure, Lays), trust Gemini's reading of the label/brand knowledge.
 */
export async function POST(req: Request) {
    try {
        const { orderId, photoUrls } = await req.json();

        // Basic validation
        if (!orderId && (!photoUrls || photoUrls.length < 1)) {
            // Relaxed validation for testing
        }

        console.log("Audit received for:", orderId);

        // --- REAL LOGIC ---

        let dishName = "Detected Dish";
        let _isFood = true;
        let analysisResult: AnalysisResult | null = null;

        // 1. GEMINI ANALYSIS (The "Brain")
        if (photoUrls && photoUrls[0]) {
            console.log("Running Gemini Analysis with Indian Context...");
            analysisResult = await analyzeImageWithGemini(photoUrls[0]);

            if (analysisResult) {
                console.log("Gemini Result:", analysisResult);
                if (analysisResult.isFood === false) {
                    return NextResponse.json({
                        status: 'error',
                        reason: analysisResult.reason || analysisResult.error || 'Image does not appear to be food.',
                        refundAmount: 0
                    });
                }
                dishName = analysisResult.dishName || dishName;
                _isFood = true;
            }
        } else {
            console.warn("Skipping Gemini: No Photo");
        }

        // 2. HYBRID DATA FETCHING
        let recipe = null;
        let flavorData = null;
        let useGeminiIngredients = false;

        // DECISION LOGIC:
        // If it's a PACKAGED snack (Kurkure, Chips), RecipeDB won't have it. Use Gemini.
        // If it's a PREPARED dish (Dal, Roti), RecipeDB is better.

        if (analysisResult?.type === 'packaged') {
            console.log("Identified as PACKAGED/BRANDED food. Trusting Gemini for ingredients.");
            useGeminiIngredients = true;
        }
        else {
            // It's likely a prepared dish. Try RecipeDB/FlavorDB.
            console.log(`Identified as PREPARED/COOKED food. Querying databases for: ${dishName}`);

            const searchPath = `/recipedb/recipe2-api/recipe/search?q=${encodeURIComponent(dishName)}`;

            try {
                // A. Search RecipeDB
                console.log(`Searching RecipeDB Proxy...`);
                const searchResp = await fetch(`${PROXY_ENDPOINT}${searchPath}`, {
                    headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}` }
                });

                if (searchResp.ok) {
                    const searchData = await searchResp.json();
                    const recipes = searchData.payload?.data || searchData;

                    if (Array.isArray(recipes) && recipes.length > 0) {
                        recipe = recipes[0];
                        console.log("RecipeDB Match Found:", recipe.Recipe_title);
                    } else {
                        console.log("RecipeDB: No match found.");
                    }
                }

                // B. Search FlavorDB (Enrichment)
                const flavorPath = `/flavordb/entities/by-entity-alias-readable?alias=${encodeURIComponent(dishName)}`;
                console.log(`Searching FlavorDB Proxy...`);
                const flavorResp = await fetch(`${PROXY_ENDPOINT}${flavorPath}`, {
                    headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}` }
                });

                if (flavorResp.ok) {
                    flavorData = await flavorResp.json();
                    console.log("FlavorDB Data found:", flavorData ? "Yes" : "No");
                }

            } catch (e) {
                console.error("Database Search Failed:", e);
            }
        }

        // 3. COMBINE DATA
        // Priority:
        // - If PACKAGED: Gemini > DB (because DB is wrong for brands)
        // - If PREPARED: DB > Gemini (because DB is scientifically accurate)

        let finalIngredients = ['Unknown'];
        let finalCalories = 0;

        if (useGeminiIngredients) {
            finalIngredients = analysisResult?.ingredients || ['Unknown'];
            finalCalories = analysisResult?.calories || 0;
        } else {
            // Prepared dish logic
            if (recipe) {
                finalIngredients = parseIngredients(recipe.Ingredients || recipe.ingredients);
                finalCalories = Math.round(parseFloat(recipe.Energy || recipe.Calories || '0'));
            } else if (flavorData) {
                finalIngredients = [flavorData.entity_alias_readable || dishName];
                finalCalories = 0; // FlavorDB doesn't always have calories
            } else {
                // Fallback to Gemini if DB failed even for prepared food
                finalIngredients = analysisResult?.ingredients || ['Unknown'];
                finalCalories = analysisResult?.calories || 0;
            }
        }

        // If we still have 0 calories, try Gemini's estimate as last resort
        if (finalCalories === 0 && analysisResult?.calories) {
            finalCalories = analysisResult.calories;
        }

        return NextResponse.json({
            status: 'success',
            message: `Dish verified: ${dishName}`,
            data: {
                isFood: true,
                freshness: analysisResult?.freshness || 'fresh',
                score: recipe ? 92 : (flavorData ? 88 : (analysisResult ? 85 : 50)),
                ingredients: finalIngredients,
                calories: finalCalories,
                recipeName: recipe ? recipe.Recipe_title : (flavorData?.entity_alias_readable || dishName),
                protein: recipe ? parseFloat(recipe.Protein || '0') : (analysisResult?.protein || 0),
                fat: recipe ? parseFloat(recipe['Total lipid (fat)'] || '0') : (analysisResult?.fat || 0),
                category: flavorData?.category_readable || (useGeminiIngredients ? 'Packaged Snack' : 'General Food')
            }
        });

    } catch (error) {
        console.error("API Route Error Detailed:", error);
        return NextResponse.json({
            status: 'error',
            message: 'Internal Server Error',
            debug: String(error)
        }, { status: 500 });
    }
}

// --- AI INTEGRATION (Multi-provider with automatic fallback) ---
import Groq from "groq-sdk";

// Gemini models to try in order (each has separate quota)
const GEMINI_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-001",
];

// Groq vision models (Llama-4 supports image input)
const GROQ_VISION_MODELS = [
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
];

const ANALYSIS_PROMPT = `You are an expert food critic specializing in INDIAN CUISINE and PACKAGED SNACKS.
Analyze this food image.

1. Identify the dish name. 
   - If it is a packaged snack (like Kurkure, Lays, Haldiram's), identify the BRAND and FLAVOR (e.g., "Kurkure Masala Munch", "Lays India's Magic Masala").
   - If it is a prepared Indian dish, use the authentic name (e.g., "Pav Bhaji", "Masala Dosa", "Paneer Butter Masala").

2. Determine the TYPE: "packaged" (chips, biscuits, chocolate, canned) OR "prepared" (cooked meals, salads, fruits).

3. Estimate ingredients:
   - For packaged items: List the likely ingredients based on the brand/flavor (e.g. "Rice Meal, Corn Meal, Spices").
   - For prepared items: List standard ingredients.

4. Assess freshness: "fresh", "caution" (looks stale/old), or "spoiled" (mold/rot visible).

5. Estimate calories per serving.

6. Estimate protein (grams) and fat (grams) per serving.

Return ONLY valid JSON (no markdown, no code fences):
{
    "isFood": boolean,
    "dishName": "string",
    "type": "packaged" | "prepared",
    "ingredients": ["string", "string"],
    "freshness": "fresh" | "caution" | "spoiled",
    "calories": number,
    "protein": number,
    "fat": number,
    "reason": "string (if not food)"
}`;

// --- PRIMARY: Gemini (tries all models) ---
async function tryGemini(base64Content: string): Promise<{ result: AnalysisResult | null; success: boolean }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.startsWith("TODO")) {
        console.warn("GEMINI_API_KEY not set, skipping Gemini.");
        return { result: null, success: false };
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    for (const modelName of GEMINI_MODELS) {
        try {
            console.log(`[Gemini] Trying model: ${modelName}`);
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: { responseMimeType: "application/json" }
            });

            const result = await model.generateContent([
                ANALYSIS_PROMPT,
                { inlineData: { data: base64Content, mimeType: "image/jpeg" } },
            ]);

            const text = (await result.response).text();
            console.log(`[Gemini:${modelName}] ✓ Response received`);
            return { result: JSON.parse(text) as AnalysisResult, success: true };

        } catch (e: unknown) {
            const errStr = String(e);
            if (errStr.includes("429") || errStr.includes("quota") || errStr.includes("Too Many Requests") || errStr.includes("RESOURCE_EXHAUSTED")) {
                console.warn(`[Gemini:${modelName}] Quota exceeded, trying next...`);
                continue;
            }
            console.error(`[Gemini:${modelName}] Error:`, errStr);
            continue; // Try next model even for other errors
        }
    }

    console.warn("[Gemini] All models exhausted.");
    return { result: null, success: false };
}

// --- FALLBACK: Groq Vision (Llama-4) ---
async function tryGroq(base64Content: string): Promise<{ result: AnalysisResult | null; success: boolean }> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.warn("GROQ_API_KEY not set, skipping Groq.");
        return { result: null, success: false };
    }

    const groq = new Groq({ apiKey });

    for (const modelName of GROQ_VISION_MODELS) {
        try {
            console.log(`[Groq] Trying model: ${modelName}`);

            const completion = await groq.chat.completions.create({
                model: modelName,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: ANALYSIS_PROMPT },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Content}`,
                                },
                            },
                        ],
                    },
                ],
                temperature: 0.3,
                max_completion_tokens: 1024,
                response_format: { type: "json_object" },
            });

            const text = completion.choices[0]?.message?.content || "";
            console.log(`[Groq:${modelName}] ✓ Response received`);
            return { result: JSON.parse(text) as AnalysisResult, success: true };

        } catch (e: unknown) {
            const errStr = String(e);
            if (errStr.includes("429") || errStr.includes("rate_limit")) {
                console.warn(`[Groq:${modelName}] Rate limited, trying next...`);
                continue;
            }
            console.error(`[Groq:${modelName}] Error:`, errStr);
            continue;
        }
    }

    console.warn("[Groq] All models exhausted.");
    return { result: null, success: false };
}

// --- MAIN ANALYSIS FUNCTION (cascading fallback) ---
async function analyzeImageWithGemini(base64Data: string): Promise<AnalysisResult> {
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");

    // 1. Try all Gemini models first
    const geminiResult = await tryGemini(base64Content);
    if (geminiResult.success) return geminiResult.result!;

    // 2. Fallback to Groq vision models
    console.log("[Fallback] Gemini failed, trying Groq...");
    const groqResult = await tryGroq(base64Content);
    if (groqResult.success) return groqResult.result!;

    // 3. All providers failed
    console.error("[FATAL] All AI providers failed.");
    return {
        isFood: false,
        error: "All AI providers are currently unavailable. Gemini quota exceeded and Groq failed. Please wait a few minutes and try again."
    };
}

function parseIngredients(ingString: string | unknown[]): string[] {
    if (Array.isArray(ingString)) return ingString.map(i => String(i));
    if (typeof ingString === 'string') {
        // RecipeDB often returns JSON-like strings or CSV
        // Try to parse if it looks like JSON array [ ... ]
        if (ingString.trim().startsWith('[') && ingString.trim().endsWith(']')) {
            try {
                const parsed = JSON.parse(ingString.replace(/'/g, '"')); // Replace single quotes just in case
                if (Array.isArray(parsed)) return parsed;
            } catch (_e) { /* ignore */ }
        }
        return ingString.split(',').slice(0, 5).map(s => s.trim());
    }
    return ['Spices', 'Main Ingredient'];

}
