import { Hono } from "hono";
import { env } from "./lib/env.js";
import { streamSSE } from "hono/streaming";

const app = new Hono();

app.post("/api/image-ad-analyzer", async (c) => {
  try {
    const { imageDescription, imageDataUrl } = await c.req.json();

    if (!imageDescription && !imageDataUrl) {
      return c.json({ error: "Missing image data" }, 400);
    }

    // Try env var first, then fall back to database setting
    let apiKey = env.deepseekApiKey;
    if (!apiKey) {
      try {
        const { getDbReady } = await import("./queries/connection.js");
        const { settings } = await import("../db/schema.js");
        const { eq } = await import("drizzle-orm");
        const db = await getDbReady();
        const [row] = await db.select().from(settings).where(eq(settings.key, "deepseek_api_key")).limit(1);
        apiKey = row?.value ?? "";
      } catch {
        // DB lookup failed
      }
    }

    if (!apiKey) {
      return c.json({ error: "Deepseek API key not configured. Ask an admin to set it in Settings." }, 500);
    }

    const desc = imageDescription?.trim() || "a product in an advertisement image";

    const systemPrompt = `You are an expert Filipino digital marketing AI. You analyze product images and generate marketing content in Taglish (Tagalog + English).

Given a product description, generate the following:

## SECTION 1: IMAGE ANALYSIS
Briefly describe what the image likely shows and the visual marketing strategy used.

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

Write the complete analysis now. Be specific and actionable.`;

    return streamSSE(c, async (stream) => {
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analyze this product image and generate Taglish captions and FB ads targeting: ${desc}` },
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
