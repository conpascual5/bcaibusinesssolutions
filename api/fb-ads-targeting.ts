import { Hono } from "hono";
import { env } from "./lib/env.js";
import { streamSSE } from "hono/streaming";

const app = new Hono();

app.post("/api/fb-ads-targeting", async (c) => {
  try {
    const { productName, targetAudience, productDescription } = await c.req.json();

    if (!productName || !targetAudience) {
      return c.json({ error: "Missing required fields: productName, targetAudience" }, 400);
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

    const descSection = productDescription
      ? `\nProduct Description: ${productDescription}`
      : "";

    const systemPrompt = `You are a Facebook Ads targeting expert. Generate a comprehensive Facebook Ads targeting strategy for the given product and audience.

Structure your response with these sections:

## 🎯 Facebook Interests & Behaviors
List 10-15 specific Facebook interest and behavior targeting options using lateral thinking. Go beyond obvious keywords to find hidden audience segments.

## 👤 Detailed Demographics
- Age Range: (specific range)
- Gender: (recommendation)
- Income Level: (target income bracket)
- Education: (if relevant)
- Relationship Status: (if relevant)

## 🧠 Behavioral Layer
- Primary Behavior: Engaged Shoppers (default — always include)
- Secondary Behavior: (specific secondary behavior based on product category)
- Pro Tip: (specific advice on layering these behaviors)

## 📊 Audience Size Estimate
Give a rough estimate of audience size and explain why.

## 💡 Why This Targeting Works
Explain the lateral thinking behind the targeting choices.

Product: ${productName}
Target Audience: ${targetAudience}${descSection}

Write the targeting strategy now. Be specific, actionable, and use lateral thinking to find non-obvious audience segments.`;

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
            { role: "user", content: `Generate Facebook Ads targeting strategy for ${productName} targeting ${targetAudience}.` },
          ],
          temperature: 0.7,
          max_tokens: 4000,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("[fb-ads-targeting] Deepseek API error:", response.status, errText);
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
    console.error("[fb-ads-targeting] Error:", err);
    return c.json({ error: err.message || "FB Ads Targeting failed" }, 500);
  }
});

export default app;
