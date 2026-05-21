import { Hono } from "hono";
import { env } from "./lib/env.js";
import { streamSSE } from "hono/streaming";

const app = new Hono();

app.post("/api/fb-ads-targeting", async (c) => {
  try {
    const { businessName, product, targetMarket } = await c.req.json();

    if (!businessName || !product) {
      return c.json({ error: "Missing required fields: businessName, product" }, 400);
    }

    // Try env var first, then fall back to Supabase settings
    let apiKey = env.deepseekApiKey;
    if (!apiKey) {
      try {
        const { getSupabaseClient } = await import("./queries/supabase-client.js");
        const supabase = getSupabaseClient();
        const { data } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "deepseek_api_key")
          .single();
        apiKey = data?.value ?? "";
      } catch {
        // DB lookup failed
      }
    }

    if (!apiKey) {
      return c.json({ error: "Deepseek API key not configured. Ask an admin to set it in Settings." }, 500);
    }

    const marketInstruction = targetMarket === "philippines"
      ? `The target market is the PHILIPPINES. All locations, demographics, interests, and behaviors must be SPECIFICALLY FILIPINO. Use Philippine cities/provinces (e.g., Metro Manila, Cebu, Davao), Philippine income brackets, Philippine education levels, and Filipino-relevant interests. Do NOT generate generic or international locations.`
      : `The target market is INTERNATIONAL / GLOBAL. Focus on worldwide audiences, major global cities, and international demographics.`;

    const systemPrompt = `You are a Facebook Ads targeting expert. Generate a comprehensive Facebook Ads targeting strategy for the given business and product.

${marketInstruction}

Generate exactly 3 detailed buyer personas. For each persona, provide ALL of the following:

## Persona [Number]: [Persona Name]
- **Age Range**: [specific age range]
- **Gender**: [male/female/all]
- **Location**: [where they live — MUST be ${targetMarket === "philippines" ? "Philippine-specific" : "international"}]
- **Education**: [education level]
- **Income**: [income bracket]
- **Relationship Status**: [single/married/parent/etc]
- **Job Titles**: [relevant job titles]
- **Interests**: [8-12 specific Facebook interests]
- **Behaviors**: [5-8 specific Facebook behaviors including Engaged Shoppers]
- **Demographics**: [specific demographic targeting options]
- **Facebook Targeting Keywords**: [10-15 specific keywords for Facebook ad targeting]
- **Age Targeting**: [exact age range for Facebook ads]
- **Placements**: [recommended Facebook/Instagram placements]
- **Why This Persona Works**: [explanation of why this persona is a good fit]

After all 3 personas, add:

## 📊 Audience Size Estimate
Estimated total audience size and breakdown per persona.

## 🎯 Recommended Ad Strategy
Brief recommendation on which persona to target first and why.

## 💡 Pro Tips
3-5 actionable tips for running Facebook ads for this product.

Business: ${businessName}
Product: ${product}

Generate the complete targeting strategy now. Be extremely specific and actionable — every detail must be ready to use in Facebook Ads Manager.`;

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
            { role: "user", content: `Generate Facebook Ads targeting strategy for ${businessName} - ${product}` },
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
