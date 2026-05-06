import { Hono } from "hono";
import { env } from "./lib/env.js";
import { streamSSE } from "hono/streaming";

const app = new Hono();

async function getApiKey(keyName: string): Promise<string> {
  // Try env var first
  if (keyName === "openai_api_key" && env.openaiApiKey) return env.openaiApiKey;
  if (keyName === "deepseek_api_key" && env.deepseekApiKey) return env.deepseekApiKey;

  // Fall back to Supabase settings
  try {
    const { getSupabaseClient } = await import("./queries/supabase-client.js");
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", keyName)
      .single();
    console.log(`[image-ad-analyzer] getApiKey(${keyName}):`, data ? `found (len=${data.value?.length})` : "not found");
    return data?.value ?? "";
  } catch (err) {
    console.error(`[image-ad-analyzer] getApiKey(${keyName}) error:`, err);
    return "";
  }
}

app.post("/api/image-ad-analyzer", async (c) => {
  try {
    const { imageDescription, imageDataUrl } = await c.req.json();

    if (!imageDataUrl) {
      return c.json({ error: "Missing image data" }, 400);
    }

    const openaiKey = await getApiKey("openai_api_key");
    if (!openaiKey) {
      return c.json({ error: "OpenAI API key not configured. Ask an admin to set it in Settings." }, 500);
    }

    const deepseekKey = await getApiKey("deepseek_api_key");
    if (!deepseekKey) {
      return c.json({ error: "Deepseek API key not configured. Ask an admin to set it in Settings." }, 500);
    }

    const desc = imageDescription?.trim() || "a product in an advertisement image";

    // Step 1: Use GPT-4o-mini to analyze the actual image
    console.log("[image-ad-analyzer] Analyzing image with GPT-4o-mini...");
    const visionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert product and advertisement image analyst. Describe the image in detail: what product is shown, the visual style, colors, composition, text/overlay elements, mood, and target audience cues. Be specific and thorough."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this advertisement image. Product context: ${desc}. Describe everything you see in detail.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageDataUrl,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    });

    if (!visionResponse.ok) {
      const errText = await visionResponse.text();
      console.error("[image-ad-analyzer] OpenAI vision API error:", visionResponse.status, errText);
      return c.json({ error: `Image analysis failed: OpenAI API error (${visionResponse.status})` }, 500);
    }

    const visionData = await visionResponse.json();
    const imageAnalysis = visionData.choices?.[0]?.message?.content || "No analysis available.";
    console.log("[image-ad-analyzer] Image analysis complete, length:", imageAnalysis.length);

    // Step 2: Use Deepseek to generate Taglish captions and FB Ads targeting
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

    return streamSSE(c, async (stream) => {
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${deepseekKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Based on the image analysis above, generate Taglish captions and FB ads targeting for: ${desc}` },
          ],
          temperature: 0.7,
          max_tokens: 4000,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("[image-ad-analyzer] Deepseek API error:", response.status, errText);
        await stream.writeSSE({ data: JSON.stringify({ error: `Deepseek API error: ${response.status}` }) });
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        await stream.writeSSE({ data: JSON.stringify({ error: "No response stream from AI" }) });
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || "";
            if (content) {
              await stream.writeSSE({ data: JSON.stringify({ content }) });
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }
    });
  } catch (err: any) {
    console.error("[image-ad-analyzer] Error:", err);
    return c.json({ error: err.message || "Image analysis failed" }, 500);
  }
});

export default app;
