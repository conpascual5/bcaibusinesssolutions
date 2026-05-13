// Vercel serverless entry point
// Minimal bootstrap to avoid cold start timeouts

import { Hono } from "hono";

const app = new Hono();

// Health check — fastest possible response
app.get("/api/health", (c) => {
  return c.json({ status: "ok", time: Date.now() });
});

// Usage check endpoint
app.get("/api/usage/:feature", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);

    const token = authHeader.replace("Bearer ", "");
    
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      "https://dkatgjtvhitknghvaxxn.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYXRnanR2aGl0a25naHZheHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MTYxNDMsImV4cCI6MjA5MzQ5MjE0M30.fsxUDg76sYGOFBVhekoj0LszaQ2YNvqkAmDIMTZ6keU",
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return c.json({ error: "Invalid token" }, 401);

    const feature = c.req.param("feature");
    
    // Free unlimited features
    const FREE_UNLIMITED = new Set(["invoices", "sales-report"]);
    if (FREE_UNLIMITED.has(feature)) {
      return c.json({ allowed: true, remaining: 999, plan: "unlimited" });
    }

    // Get user's plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();
    
    const plan = profile?.plan ?? "free";
    
    const PLAN_LIMITS: Record<string, number> = { free: 3, pro: 500, vip: 100 };
    const limit = PLAN_LIMITS[plan] ?? 3;

    // Count usage this month
    const month = new Date().toISOString().slice(0, 7);
    const { count } = await supabase
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("feature", feature)
      .gte("created_at", `${month}-01`);

    const used = count ?? 0;
    const remaining = Math.max(0, limit - used);

    return c.json({ allowed: remaining > 0, remaining, limit, plan });
  } catch (err: any) {
    console.error("[usage] error:", err?.message ?? err);
    return c.json({ error: err?.message || "Internal error" }, 500);
  }
});

// Sales Wizard endpoint
app.post("/api/sales-wizard", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const { businessName, industry, targetAudience, goal } = body;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return c.json({ error: "OpenAI API key not configured" }, 500);

    const prompt = `You are an expert advertising copywriter. Create a complete sales wizard campaign for:
Business: ${businessName}
Industry: ${industry}
Target Audience: ${targetAudience}
Goal: ${goal}

Generate:
1. A headline (max 10 words)
2. A subheadline (max 20 words)
3. 3 bullet points highlighting key benefits
4. A call-to-action (max 5 words)
5. A short paragraph (max 50 words) describing the emotional appeal

Return as JSON with keys: headline, subheadline, bulletPoints (array), cta, emotionalAppeal`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a precise JSON generator. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return c.json({ error: `OpenAI API error: ${response.status}` }, 500);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return c.json({ error: "No response from AI" }, 500);

    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return c.json(parsed);
  } catch (err: any) {
    console.error("[sales-wizard] error:", err?.message ?? err);
    return c.json({ error: err?.message || "Internal error" }, 500);
  }
});

// Image Ad Analyzer endpoint
app.post("/api/image-ad-analyzer", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const { imageUrl } = body;
    if (!imageUrl) return c.json({ error: "No image URL provided" }, 400);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return c.json({ error: "OpenAI API key not configured" }, 500);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this advertisement image. Provide:
1. Visual Elements: Describe colors, composition, imagery
2. Target Audience: Who is this ad targeting?
3. Emotional Appeal: What emotions does it evoke?
4. Effectiveness: Rate 1-10 and explain why
5. Suggestions: 3 specific improvements

Return as JSON with keys: visualElements, targetAudience, emotionalAppeal, effectiveness (object with rating and explanation), suggestions (array)`,
              },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return c.json({ error: `OpenAI API error: ${response.status}` }, 500);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return c.json({ error: "No response from AI" }, 500);

    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return c.json(parsed);
  } catch (err: any) {
    console.error("[image-ad-analyzer] error:", err?.message ?? err);
    return c.json({ error: err?.message || "Internal error" }, 500);
  }
});

// FB Ads Targeting endpoint
app.post("/api/fb-ads-targeting", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const { businessName, industry, targetAudience, budget } = body;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return c.json({ error: "OpenAI API key not configured" }, 500);

    const prompt = `You are a Facebook Ads targeting expert. Create a detailed targeting strategy for:
Business: ${businessName}
Industry: ${industry}
Target Audience: ${targetAudience}
Budget: ${budget}

Generate:
1. 5 interest-based targeting suggestions
2. 3 lookalike audience suggestions
3. 3 demographic targeting suggestions
4. Budget allocation recommendation
5. Estimated reach and CPM

Return as JSON with keys: interests (array of objects with name and rationale), lookalikes (array), demographics (array), budgetAllocation (object), estimatedReach (object)`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a precise JSON generator. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return c.json({ error: `OpenAI API error: ${response.status}` }, 500);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return c.json({ error: "No response from AI" }, 500);

    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return c.json(parsed);
  } catch (err: any) {
    console.error("[fb-ads-targeting] error:", err?.message ?? err);
    return c.json({ error: err?.message || "Internal error" }, 500);
  }
});

// Competitor Ad Copy Analyzer
app.post("/api/analyze-copy", async (c) => {
  try {
    const { text, type } = await c.req.json();
    if (!text) return c.json({ error: "No text provided" }, 400);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return c.json({ error: "OpenAI API key not configured" }, 500);

    const prompt = `You are an expert advertising analyst. Analyze the following ${type === 'url' ? 'landing page content' : 'ad copy'} and provide:

1. Psychological Triggers Analysis: For each trigger - Scarcity, Social Proof, Problem-Agitation-Solution, Urgency, Authority, Reciprocity - determine if used and cite evidence.

2. Counter-Positioning Strategies: Suggest 3 ways to counter-position. For each: title, strategy, example.

3. Summary: 2-3 sentence analysis.

Return as JSON with keys: psychologicalTriggers (array of objects with name, description, found, evidence), counterPositioning (array of objects with title, strategy, example), summary

TEXT: ${text}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a precise JSON generator. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return c.json({ error: `OpenAI API error: ${response.status}` }, 500);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return c.json({ error: "No response from AI" }, 500);

    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return c.json(parsed);
  } catch (err: any) {
    console.error("[analyze-copy] error:", err?.message ?? err);
    return c.json({ error: err?.message || "Internal error" }, 500);
  }
});

// Catch-all for other API routes
app.all("/api/*", (c) => {
  return c.json({ error: "Not found", path: c.req.path }, 404);
});

export const config = {
  runtime: "nodejs",
};

export default app.fetch;
