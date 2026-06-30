import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Ingredient {
  name: string;
  category: string;
  safety: "safe" | "moderate" | "harmful";
  reason: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { image, mediaType } = await req.json();

    if (!image || !mediaType) {
      return new Response(
        JSON.stringify({ error: "Missing image or mediaType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: image,
                },
              },
              {
                type: "text",
                text: `Look at this food product image. Extract all ingredients from the label. For each ingredient return JSON: { name, category (Preservative/Additive/Allergen/Natural/Artificial Colorant/Other), safety (safe/moderate/harmful), reason (one sentence why) }. Return only a JSON array, no markdown. If no ingredient label is visible, return: { "error": "No ingredient label found" }`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${response.status}`, details: errText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const textBlock = data.content?.find((c: any) => c.type === "text");
    const rawText = textBlock?.text ?? "";

    // Try to parse the JSON from the response
    let ingredients: Ingredient[] | null = null;
    let noLabel = false;

    try {
      // Strip any markdown code fences if present
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.error === "No ingredient label found") {
        noLabel = true;
      } else if (Array.isArray(parsed)) {
        ingredients = parsed;
      }
    } catch {
      // Try to extract JSON array from text
      const match = rawText.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          ingredients = JSON.parse(match[0]);
        } catch {
          noLabel = true;
        }
      } else {
        noLabel = true;
      }
    }

    return new Response(
      JSON.stringify({ ingredients, noLabel }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
