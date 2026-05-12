import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      console.error("[image-ad-analyzer] auth error", { message: userErr?.message });
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const imageDataUrl = String(body?.imageDataUrl ?? "");
    const desc = String(body?.imageDescription ?? "a product in an advertisement image").trim() || "a product in an advertisement image";

    if (!imageDataUrl) {
      return new Response(JSON.stringify({ error: "Missing imageDataUrl" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const [openaiRow, deepseekRow] = await Promise.all([
      supabase.from("settings").select("value").eq("key", "openai_api_key").maybeSingle(),
      supabase.from("settings").select("value").eq("key", "deepseek_api_key").maybeSingle(),
    ]);

    const openaiKey = (openaiRow.data as any)?.value ?? "";
    const deepseekKey = (deepseekRow.data as any)?.value ?? "";

    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }
    if (!deepseekKey) {
      return new Response(JSON.stringify({ error: "Deepseek API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    // Step 1: OpenAI GPT-4o vision
    const visionRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an expert product and advertisement image analyst. Describe the image in detail: what product is shown, the visual style, colors, composition, text/overlay elements, mood, and target audience cues. Be specific and thorough.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this advertisement image. Product context: ${desc}. Describe everything you see in detail.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageDataUrl,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 900,
      }),
    });

    if (!visionRes.ok) {
      const text = await visionRes.text();
      console.error("[image-ad-analyzer] openai error", { status: visionRes.status, text });
      return new Response(JSON.stringify({ error: `OpenAI error (${visionRes.status})` }), {
        status: 502,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const visionJson = await visionRes.json();
    const imageAnalysis = visionJson?.choices?.[0]?.message?.content ?? "";

    // Step 2: Deepseek generation
    const systemPrompt = `You are an expert Filipino digital marketing AI. You analyze product images and generate marketing content in Taglish (Tagalog + English).

Given a product description and detailed image analysis, generate the following:

## SECTION 1: IMAGE ANALYSIS
Summarize the key visual elements and marketing strategy of the image.

## SECTION 2: TAGLISH CAPTIONS (3 captions)
Generate 3 different ad captions in Taglish (mix of Tagalog and English). Each caption should:
- Be conversational and relatable to Filipino audiences
- Use common Filipino expressions like "sulit", "worth it", "grabe", "ibang klase", etc.
- Include relevant hashtags (5-7 hashtags per caption)
- Be optimized for Facebook/Instagram/TikTok

Format each caption as:
**Caption 1 (Platform):**
[Caption text]
[Hashtags]

**Caption 2 (Platform):**
[Caption text]
[Hashtags]

**Caption 3 (Platform):**
[Caption text]
[Hashtags]

## SECTION 3: FB ADS TARGETING STRATEGY
Generate a Facebook Ads targeting strategy for this product:
- Target Audience Demographics (age, gender, location, income)
- Interests & Behaviors (10+ specific Facebook interest targeting options)
- Suggested Ad Placement
- Budget Recommendation
- Why this targeting works for the Filipino market

Product: ${desc}

Image Analysis Results:
${imageAnalysis}

Write the complete analysis now. Be specific and actionable.`;

    const dsRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${deepseekKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate the final answer for: ${desc}` },
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (!dsRes.ok) {
      const text = await dsRes.text();
      console.error("[image-ad-analyzer] deepseek error", { status: dsRes.status, text });
      return new Response(JSON.stringify({ error: `Deepseek error (${dsRes.status})` }), {
        status: 502,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const dsJson = await dsRes.json();
    const content = dsJson?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (err) {
    console.error("[image-ad-analyzer] exception", { err });
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
