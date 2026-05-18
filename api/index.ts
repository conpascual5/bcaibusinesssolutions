// Vercel serverless entry point — self-contained with all API routes
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { createClient } from "@supabase/supabase-js";

const app = new Hono();

const SUPABASE_URL = "https://dkatgjtvhitknghvaxxn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYXRnanR2aGl0a25naHZheHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MTYxNDMsImV4cCI6MjA5MzQ5MjE0M30.fsxUDg76sYGOFBVhekoj0LszaQ2YNvqkAmDIMTZ6keU";

function getSupabaseClient(userJwt?: string | null) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: userJwt ? { Authorization: `Bearer ${userJwt}` } : {} },
  });
}

function getDeepseekKey(): string {
  return process.env.DEEPSEEK_API_KEY ?? "";
}

function getOpenaiKey(): string {
  return process.env.OPENAI_API_KEY ?? "";
}

// ─── Health check ────────────────────────────────────────────────────
app.get("/api/health", async (c) => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    return c.json({ status: error ? "degraded" : "ok", time: Date.now(), db: error ? "error" : "connected" });
  } catch {
    return c.json({ status: "starting", time: Date.now(), db: "initializing" });
  }
});

// ─── Login ───────────────────────────────────────────────────────────
app.post("/api/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) return c.json({ error: "Email and password required" }, 400);
    const supabase = getSupabaseClient();
    const { data, error } = await (supabase as any).auth.signInWithPassword({ email, password });
    if (error) return c.json({ error: "Invalid credentials" }, 401);
    if (!data.user || !data.session) return c.json({ error: "Login failed" }, 500);
    const { data: profile } = await supabase.from("profiles").select("full_name, is_admin, is_active").eq("id", data.user.id).single();
    if (profile && !profile.is_active) return c.json({ error: "Account deactivated" }, 403);
    return c.json({
      token: data.session.access_token,
      user: { id: data.user.id, email: data.user.email, name: profile?.full_name ?? data.user.email?.split("@")[0] ?? "User", isAdmin: !!profile?.is_admin },
    });
  } catch (err: any) {
    return c.json({ error: err?.message || "Login failed" }, 500);
  }
});

// ─── Register ────────────────────────────────────────────────────────
app.post("/api/register", async (c) => {
  try {
    const { email, password, name, isExistingCustomer } = await c.req.json();
    if (!email || !password || !name) return c.json({ error: "Email, password, and name are required" }, 400);
    if (password.length < 6) return c.json({ error: "Password must be at least 6 characters" }, 400);
    const supabase = getSupabaseClient();
    const { data, error } = await (supabase as any).auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) {
      if (error.message.includes("already")) return c.json({ error: "Email already registered" }, 409);
      return c.json({ error: error.message }, 400);
    }
    if (!data.user) return c.json({ error: "Registration failed" }, 500);
    const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", data.user.id).single();
    if (!existingProfile) {
      await supabase.from("profiles").insert({ id: data.user.id, email: data.user.email, full_name: name, is_active: true, is_admin: false, plan: "free" });
    }
    if (isExistingCustomer) {
      await supabase.from("profiles").update({ plan: "vip" }).eq("id", data.user.id);
    }
    if (!data.session) {
      return c.json({ message: "Registration successful! Please check your email to confirm your account.", requiresConfirmation: true });
    }
    return c.json({ token: data.session.access_token, user: { id: data.user.id, email: data.user.email, name, isAdmin: false } });
  } catch (err: any) {
    return c.json({ error: err?.message || "Registration failed" }, 500);
  }
});

// ─── Usage tracking ──────────────────────────────────────────────────
const PLAN_LIMITS: Record<string, number> = { free: 3, pro: 500, vip: 100 };
const FREE_UNLIMITED = new Set(["invoices", "sales-report"]);

function getMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

app.get("/api/usage/:feature", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const supabase = getSupabaseClient(token);
    const { data: { user }, error: ue } = await (supabase as any).auth.getUser(token);
    if (ue || !user) return c.json({ error: "Invalid token" }, 401);
    const feature = c.req.param("feature");
    if (FREE_UNLIMITED.has(feature)) {
      return c.json({ feature, used: 0, limit: 999999, remaining: 999999, isPro: true, isVip: true, plan: "pro" });
    }
    const month = getMonth();
    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
    const plan = profile?.plan ?? "free";
    const limit = PLAN_LIMITS[plan] ?? 3;
    const { data: monthRows } = await supabase.from("user_usage").select("count").eq("user_id", user.id).eq("month", month);
    const used = (monthRows ?? []).reduce((s: number, r: any) => s + Number(r.count ?? 0), 0);
    if (plan === "free") {
      const { data: allRows } = await supabase.from("user_usage").select("count").eq("user_id", user.id);
      const totalEver = (allRows ?? []).reduce((s: number, r: any) => s + Number(r.count ?? 0), 0);
      return c.json({ feature, used: totalEver, limit, remaining: Math.max(0, limit - totalEver), isPro: false, isVip: false, plan: "free" });
    }
    return c.json({ feature, used, limit, remaining: Math.max(0, limit - used), isPro: plan === "pro", isVip: plan === "vip", plan });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post("/api/usage/:feature/increment", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const supabase = getSupabaseClient(token);
    const { data: { user }, error: ue } = await (supabase as any).auth.getUser(token);
    if (ue || !user) return c.json({ error: "Invalid token" }, 401);
    const feature = c.req.param("feature");
    if (FREE_UNLIMITED.has(feature)) {
      return c.json({ success: true, feature, used: 0, remaining: 999999, isPro: true, isVip: true, plan: "pro" });
    }
    const month = getMonth();
    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
    const plan = profile?.plan ?? "free";
    const limit = PLAN_LIMITS[plan] ?? 3;
    const { data: monthRows } = await supabase.from("user_usage").select("count").eq("user_id", user.id).eq("month", month);
    const totalUsed = (monthRows ?? []).reduce((s: number, r: any) => s + Number(r.count ?? 0), 0);
    if (plan === "free") {
      const { data: allRows } = await supabase.from("user_usage").select("count").eq("user_id", user.id);
      const totalEver = (allRows ?? []).reduce((s: number, r: any) => s + Number(r.count ?? 0), 0);
      if (totalEver >= limit) return c.json({ error: "limit_reached", message: `Free trial used up (${limit} generations total). Upgrade to Pro.`, feature, limit, used: totalEver }, 403);
    } else if (totalUsed >= limit) {
      return c.json({ error: "limit_reached", message: `You've reached your ${plan.toUpperCase()} limit of ${limit} generations this month.`, feature, limit, used: totalUsed }, 403);
    }
    const { data: existing } = await supabase.from("user_usage").select("id, count").eq("user_id", user.id).eq("feature", feature).eq("month", month).single();
    if (existing) {
      await supabase.from("user_usage").update({ count: Number(existing.count ?? 0) + 1, updated_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await supabase.from("user_usage").insert({ user_id: user.id, feature, month, count: 1 });
    }
    return c.json({ success: true, feature, used: totalUsed + 1, remaining: Math.max(0, limit - (totalUsed + 1)), isPro: plan === "pro", isVip: plan === "vip", plan });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ─── Sales Wizard ────────────────────────────────────────────────────
const FRAMEWORK_PROMPTS: Record<string, string> = {
  "6-ws": `You are a master copywriter using the "6 W's" framework. Structure your response: 1. Who - Identify who the product/service is for 2. What - Clearly state what is being offered 3. Why - Explain why the customer needs it 4. Where - Describe where/how it works 5. When - Specify when they should take action 6. Way - Explain the way to get it / call to action. Write compelling, persuasive copy.`,
  "story-solve-sell": `You are a master copywriter using the "Story-Solve-Sell" framework. 1. Story - Open with a relatable story 2. Solve - Present the product as the solution 3. Sell - Drive the sale with a compelling CTA. Write narrative-driven copy.`,
  "solution-savings-social-proof": `You are a master copywriter using the "Solution-Savings-Social Proof" framework. 1. Solution - Present the clear solution 2. Savings - Highlight value and savings 3. Social Proof - Include testimonials and stats. Write persuasive copy.`,
  "pain-agitate-relief": `You are a master copywriter using the "Pain-Agitate-Relief" framework. 1. Pain - Identify the pain point 2. Agitate - Amplify the pain 3. Relief - Present the product as relief. Write emotionally compelling copy.`,
  "friend-expert": `You are a master copywriter using the "Friend-Expert" framework. 1. Friend - Build rapport as a trusted friend 2. Expert - Establish authority 3. Combine both to drive the sale. Write warm yet authoritative copy.`,
  "past-present-future": `You are a master copywriter using the "Past-Present-Future" framework. 1. Past - Describe past struggles 2. Present - Show how things are different now 3. Future - Paint a vivid picture of the better future. Write compelling time-journey copy.`,
  "positive-negative": `You are a master copywriter using the "Positive-Negative" framework. 1. Positive - Start with positive benefits 2. Negative - Address concerns honestly 3. Resolution - End with balanced CTA. Write balanced copy.`,
  "exclusive-inclusive": `You are a master copywriter using the "Exclusive-Inclusive" framework. 1. Exclusive - Make customer feel special 2. Inclusive - Show it's for everyone 3. Balance both approaches. Write inclusive yet exclusive copy.`,
  "expectation-surprise": `You are a master copywriter using the "Expectation-Surprise" framework. 1. Expectation - Set up expectations 2. Surprise - Deliver an unexpected twist 3. Convert - Use surprise to drive action. Write engaging copy.`,
  "urgency-patience": `You are a master copywriter using the "Urgency-Patience" framework. 1. Urgency - Create genuine urgency 2. Patience - Build trust 3. Balance both. Write trust-building copy with urgency.`,
  "personal-universal": `You are a master copywriter using the "Personal-Universal" framework. 1. Personal - Speak directly to the reader 2. Universal - Show it applies to everyone 3. Bridge both. Write personally tailored yet universal copy.`,
  "emotion-logic": `You are a master copywriter using the "Emotion-Logic" framework. 1. Emotion - Appeal to emotions 2. Logic - Back with reasoning 3. Combine both. Write copy that engages heart and mind.`,
  "strong-weak": `You are a master copywriter using the "Strong-Weak" framework. 1. Strong - Lead with strongest benefits 2. Weak - Address weaker points 3. End strong with powerful CTA. Write confident copy.`,
  "consistent-contrasting": `You are a master copywriter using the "Consistent-Contrasting" framework. 1. Consistent - Establish consistent theme 2. Contrasting - Use contrast to highlight key points 3. Use both elements. Write memorable copy.`,
  "5-objections": `You are a master copywriter using the "5 Basic Objections" framework. 1. Identify top 5 objections 2. Address each with counter-argument 3. Close with strong CTA. Write persuasive objection-overcoming copy.`,
  "acca": `You are a master copywriter using the "Awareness-Comprehension-Conviction-Action" framework. 1. Awareness - Make aware of problem 2. Comprehension - Help understand value 3. Conviction - Build conviction 4. Action - Drive action. Write persuasive copy.`,
  "picture-promise-prove-push": `You are a master copywriter using the "Picture-Promise-Prove-Push" framework. 1. Picture - Paint desired outcome 2. Promise - Make compelling promise 3. Prove - Provide proof 4. Push - End with strong push. Write visually compelling copy.`,
  "star-story-solution": `You are a master copywriter using the "Star-Story-Solution" framework. 1. Star - Make customer the star 2. Story - Tell compelling story 3. Solution - Present product as solution. Write customer-centric copy.`,
  "problem-agitate-solve": `You are a master copywriter using the "Problem-Agitate-Solve" framework. 1. Problem - Identify the problem 2. Agitate - Amplify urgency 3. Solve - Present definitive solution. Write compelling problem-solution copy.`,
  "aida": `You are a master copywriter using the "Attention-Interest-Desire-Action" framework. 1. Attention - Grab attention with hook 2. Interest - Build interest 3. Desire - Create strong desire 4. Action - Drive action with clear CTA. Write persuasive AIDA copy.`,
  "before-after-bridge": `You are a master copywriter using the "Before-After-Bridge" framework. 1. Before - Describe current situation 2. After - Paint transformed future 3. Bridge - Show how product bridges gap. Write transformational copy.`,
  "pastor": `You are a master copywriter using the "PASTOR" framework. 1. Problem - Identify core problem 2. Amplify - Amplify pain 3. Solution - Present solution 4. Testimony - Include social proof 5. Offer - Present offer 6. Response - Drive response with CTA. Write structured persuasive copy.`,
  "four-c": `You are a master copywriter using the "Four C's" framework. 1. Captivating - Open with captivating hook 2. Clear - Be crystal clear 3. Compelling - Make benefits irresistible 4. Convincing - Close with convincing proof and CTA. Write captivating copy.`,
  "features-advantages-benefits": `You are a master copywriter using the "Features-Advantages-Benefits" framework. 1. Features - List key features 2. Advantages - Explain advantages 3. Benefits - Translate to customer benefits. Write copy connecting features to benefits.`,
};

const CONTENT_TYPE_INSTRUCTIONS: Record<string, string> = {
  caption: "Write a short, punchy social media caption (under 150 words). Make it scroll-stopping and shareable.",
  blog: "Write a detailed blog post (800-1200 words) with headings, subheadings, and a compelling narrative.",
  "fb-post": "Write a long-form Facebook post (300-500 words) that feels personal, engaging, and drives comments and shares.",
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  taglish: `CRITICAL LANGUAGE INSTRUCTION — YOU MUST FOLLOW THIS EXACTLY:
Write the ENTIRE copy in TAGLISH (Tagalog + English mix).
- At least 70% of the text MUST be in Tagalog/Filipino words and phrases
- The remaining can be in English business/marketing terms
- Use conversational Filipino phrases like: "mga ka-", "kaya naman", "talaga", "naman", "po", "kasi", "diba", "kaya"
- Examples of correct Taglish: "Mga ka-entrepreneur, gusto niyo bang dumami ang benta niyo? Ito ang solusyon!"
- DO NOT write in pure English. DO NOT write in pure Filipino. Mix them naturally.
- Think like a Filipino online seller talking to their customers on Facebook.`,
  filipino: `CRITICAL LANGUAGE INSTRUCTION — YOU MUST FOLLOW THIS EXACTLY:
Write the ENTIRE copy in PURE FILIPINO (Tagalog) language.
- Use deep, natural Filipino words and phrases
- AVOID English words as much as possible — translate marketing terms to Filipino
- Use Filipino phrases like: "mga", "po", "talaga", "kaya", "ngunit", "samakatuwid", "gayunpaman"
- Write like a native Filipino speaker talking to fellow Filipinos
- DO NOT use English words unless there is absolutely no Filipino equivalent
- The entire output must be in Filipino/Tagalog only`,
  english: `CRITICAL LANGUAGE INSTRUCTION — YOU MUST FOLLOW THIS EXACTLY:
Write the ENTIRE copy in PURE ENGLISH.
- Use professional, persuasive English language
- Suitable for a global/international audience
- DO NOT use any Tagalog or Filipino words
- Use standard American/British English spelling and grammar
- Write like a professional English copywriter`,
};

app.post("/api/sales-wizard", async (c) => {
  try {
    const { productName, targetAudience, messageContext, contentType, framework, language } = await c.req.json();
    if (!productName || !targetAudience || !contentType || !framework) {
      return c.json({ error: "Missing required fields: productName, targetAudience, contentType, framework" }, 400);
    }
    const apiKey = getDeepseekKey();
    if (!apiKey) return c.json({ error: "Deepseek API key not configured. Ask an admin to set it in Settings." }, 500);
    const fp = FRAMEWORK_PROMPTS[framework] || FRAMEWORK_PROMPTS["pastor"];
    const ct = CONTENT_TYPE_INSTRUCTIONS[contentType] || CONTENT_TYPE_INSTRUCTIONS["caption"];
    const li = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.taglish;
    const ctx = messageContext ? `\nContext / Purpose: ${messageContext}\n\nThis is the specific message, offer, or announcement the copy should focus on.` : "";
    const systemPrompt = `${fp}\n\n${ct}\n\n${li}\n\nProduct/Service: ${productName}\nTarget Audience: ${targetAudience}${ctx}\n\nWrite the copy now. Make it persuasive, engaging, and tailored specifically to the target audience. Use markdown formatting where appropriate.\n\nIMPORTANT: After writing the copy, add a section at the end titled "## VIRAL SCORE ANALYSIS" that analyzes the copy's viral potential. Rate it from 1-10 on these factors:\n- Emotional Hook (how emotionally engaging is it?)\n- Shareability (would people want to share this?)\n- Clarity (is the message crystal clear?)\n- Call-to-Action Strength (how compelling is the CTA?)\n- Relatability (does it speak directly to the target audience?)\n\nGive an overall Viral Score out of 10 and 3 specific tips to make it go more viral.`;

    return streamSSE(c, async (stream) => {
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Write ${contentType} copy for ${productName} targeting ${targetAudience} using the selected framework.` }], temperature: 0.7, max_tokens: 4000, stream: true }),
      });
      if (!response.ok) { await stream.writeSSE({ data: JSON.stringify({ error: `Deepseek API error: ${response.status}` }) }); return; }
      const reader = response.body?.getReader();
      if (!reader) { await stream.writeSSE({ data: JSON.stringify({ error: "No response stream from AI" }) }); return; }
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
          const d = trimmed.slice(6);
          if (d === "[DONE]") continue;
          try { const parsed = JSON.parse(d); const content = parsed.choices?.[0]?.delta?.content || ""; if (content) await stream.writeSSE({ data: JSON.stringify({ content }) }); } catch { /* skip */ }
        }
      }
    });
  } catch (err: any) {
    return c.json({ error: err.message || "Sales wizard failed" }, 500);
  }
});

// ─── FB Ads Targeting ────────────────────────────────────────────────
app.post("/api/fb-ads-targeting", async (c) => {
  try {
    const { businessName, product, targetMarket } = await c.req.json();
    if (!businessName || !product) return c.json({ error: "Missing required fields: businessName, product" }, 400);
    const apiKey = getDeepseekKey();
    if (!apiKey) return c.json({ error: "Deepseek API key not configured. Ask an admin to set it in Settings." }, 500);

    const market = targetMarket === "international" ? "global/international" : "Philippines (Filipino market)";
    const locationInstruction = targetMarket === "international"
      ? "Focus on a GLOBAL/INTERNATIONAL audience. Include personas from different countries/regions. Location targeting should cover major global markets (USA, UK, Canada, Australia, Southeast Asia, etc.)."
      : "Focus on the PHILIPPINES market. All personas should be Filipino. Location targeting should be Philippines-specific (Metro Manila, Luzon, Visayas, Mindanao). Use Filipino cultural references and buying behaviors.";

    const systemPrompt = `You are a Facebook Ads targeting expert. Generate a comprehensive Facebook Ads targeting strategy for the given business and product.\n\nTARGET MARKET: ${market}\n\n${locationInstruction}\n\nGenerate exactly 3 detailed buyer personas. For each persona, provide ALL of the following:\n\n## Persona [Number]: [Persona Name]\n- **Age Range**: [specific age range]\n- **Gender**: [male/female/all]\n- **Location**: [where they live]\n- **Education**: [education level]\n- **Income**: [income bracket]\n- **Relationship Status**: [single/married/parent/etc]\n- **Job Titles**: [relevant job titles]\n- **Interests**: [8-12 specific Facebook interests]\n- **Behaviors**: [5-8 specific Facebook behaviors including Engaged Shoppers]\n- **Demographics**: [specific demographic targeting options]\n- **Facebook Targeting Keywords**: [10-15 specific keywords for Facebook ad targeting]\n- **Age Targeting**: [exact age range for Facebook ads]\n- **Placements**: [recommended Facebook/Instagram placements]\n- **Why This Persona Works**: [explanation of why this persona is a good fit]\n\nAfter all 3 personas, add:\n\n## Audience Size Estimate\nEstimated total audience size and breakdown per persona.\n\n## Recommended Ad Strategy\nBrief recommendation on which persona to target first and why.\n\n## Pro Tips\n3-5 actionable tips for running Facebook ads for this product.\n\nBusiness: ${businessName}\nProduct: ${product}\n\nGenerate the complete targeting strategy now. Be extremely specific and actionable.`;

    return streamSSE(c, async (stream) => {
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Generate Facebook Ads targeting strategy for ${businessName} - ${product}` }], temperature: 0.7, max_tokens: 4000, stream: true }),
      });
      if (!response.ok) { await stream.writeSSE({ data: JSON.stringify({ error: `Deepseek API error: ${response.status}` }) }); return; }
      const reader = response.body?.getReader();
      if (!reader) { await stream.writeSSE({ data: JSON.stringify({ error: "No response stream from AI" }) }); return; }
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
          const d = trimmed.slice(6);
          if (d === "[DONE]") continue;
          try { const parsed = JSON.parse(d); const content = parsed.choices?.[0]?.delta?.content || ""; if (content) await stream.writeSSE({ data: JSON.stringify({ content }) }); } catch { /* skip */ }
        }
      }
    });
  } catch (err: any) {
    return c.json({ error: err.message || "FB Ads Targeting failed" }, 500);
  }
});

// ─── Image Ad Analyzer ───────────────────────────────────────────────
app.post("/api/image-ad-analyzer", async (c) => {
  try {
    const { imageDescription, imageDataUrl } = await c.req.json();
    if (!imageDataUrl) return c.json({ error: "Missing image data" }, 400);
    const openaiKey = getOpenaiKey();
    if (!openaiKey) return c.json({ error: "OpenAI API key not configured. Ask an admin to set it in Settings." }, 500);
    const deepseekKey = getDeepseekKey();
    if (!deepseekKey) return c.json({ error: "Deepseek API key not configured. Ask an admin to set it in Settings." }, 500);
    const desc = imageDescription?.trim() || "a product in an advertisement image";

    // Step 1: GPT-4 vision analysis
    const visionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert product and advertisement image analyst. Describe the image in detail: what product is shown, the visual style, colors, composition, text/overlay elements, mood, and target audience cues." },
          { role: "user", content: [{ type: "text", text: `Analyze this advertisement image. Product context: ${desc}. Describe everything you see in detail.` }, { type: "image_url", image_url: { url: imageDataUrl, detail: "high" } }] },
        ],
        max_tokens: 1000,
      }),
    });
    if (!visionResponse.ok) return c.json({ error: `Image analysis failed: OpenAI API error (${visionResponse.status})` }, 500);
    const visionData = await visionResponse.json();
    const imageAnalysis = visionData.choices?.[0]?.message?.content || "No analysis available.";

    // Step 2: Deepseek for Taglish captions and FB Ads targeting
    const systemPrompt = `You are an expert Filipino digital marketing AI. You analyze product images and generate marketing content in Taglish (Tagalog + English).\n\nGiven a product description and detailed image analysis, generate the following:\n\n## SECTION 1: IMAGE ANALYSIS\nSummarize the key visual elements and marketing strategy of the image.\n\n## SECTION 2: TAGLISH CAPTIONS (3 captions)\nGenerate 3 different ad captions in Taglish. Each caption should be conversational and relatable to Filipino audiences. Include relevant hashtags (5-7 per caption).\n\n## SECTION 3: FB ADS TARGETING STRATEGY\nGenerate a Facebook Ads targeting strategy for this product:\n- Target Audience Demographics\n- Interests and Behaviors (10+ specific Facebook interest targeting options)\n- Suggested Ad Placement\n- Budget Recommendation\n- Why this targeting works for the Filipino market\n\nProduct: ${desc}\n\nImage Analysis Results:\n${imageAnalysis}\n\nWrite the complete analysis now. Be specific and actionable.`;

    return streamSSE(c, async (stream) => {
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${deepseekKey}` },
        body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Based on the image analysis above, generate Taglish captions and FB ads targeting for: ${desc}` }], temperature: 0.7, max_tokens: 4000, stream: true }),
      });
      if (!response.ok) { await stream.writeSSE({ data: JSON.stringify({ error: `Deepseek API error: ${response.status}` }) }); return; }
      const reader = response.body?.getReader();
      if (!reader) { await stream.writeSSE({ data: JSON.stringify({ error: "No response stream from AI" }) }); return; }
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
          const d = trimmed.slice(6);
          if (d === "[DONE]") continue;
          try { const parsed = JSON.parse(d); const content = parsed.choices?.[0]?.delta?.content || ""; if (content) await stream.writeSSE({ data: JSON.stringify({ content }) }); } catch { /* skip */ }
        }
      }
    });
  } catch (err: any) {
    return c.json({ error: err.message || "Image analysis failed" }, 500);
  }
});

// ─── Competitor Ad Copy Analyzer ─────────────────────────────────────
app.post("/api/analyze-copy", async (c) => {
  try {
    const { text, type } = await c.req.json();
    if (!text) return c.json({ error: "No text provided" }, 400);
    const apiKey = getDeepseekKey();
    if (!apiKey) return c.json({ error: "Deepseek API key not configured. Ask an admin to set it in Settings." }, 500);
    const prompt = `You are an expert advertising analyst and copywriter. Analyze the following ${type === 'url' ? 'landing page content' : 'ad copy'} and provide:\n\n1. **Psychological Triggers Analysis**: For each of these triggers - Scarcity, Social Proof, Problem-Agitation-Solution, Urgency, Authority, Reciprocity - determine if it's being used and cite specific evidence from the text.\n\n2. **Counter-Positioning Strategies**: Suggest 3 ways to counter-position or improve this copy. For each strategy, provide:\n   - A compelling title\n   - The strategic approach\n   - A concrete example of counter-copy\n\n3. **Summary**: A brief 2-3 sentence analysis of the overall persuasion strategy.\n\nFormat your response as valid JSON with this exact structure:\n{\n  "psychologicalTriggers": [\n    { "name": "Scarcity", "description": "...", "found": true/false, "evidence": "..." }\n  ],\n  "counterPositioning": [\n    { "title": "...", "strategy": "...", "example": "..." }\n  ],\n  "summary": "..."\n}\n\nTEXT TO ANALYZE:\n${text}`;

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "system", content: "You are a precise JSON generator. Always respond with valid JSON only, no markdown formatting." }, { role: "user", content: prompt }], temperature: 0.7, max_tokens: 2000 }),
    });
    if (!response.ok) return c.json({ error: `Deepseek API error: ${response.status}` }, 500);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return c.json({ error: "No response from AI" }, 500);
    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return c.json(parsed);
  } catch (err: any) {
    return c.json({ error: err.message || "Analysis failed" }, 500);
  }
});

// ─── Chat API ────────────────────────────────────────────────────────
app.post("/api/chat/send", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const supabase = getSupabaseClient(token);
    const { data: { user }, error: ue } = await (supabase as any).auth.getUser(token);
    if (ue || !user) return c.json({ error: "Invalid token" }, 401);

    const { message: msg } = await c.req.json();
    if (!msg?.trim()) return c.json({ error: "Message is required" }, 400);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        user_id: user.id,
        user_name: profile?.full_name || user.email?.split("@")[0] || "User",
        user_email: profile?.email || user.email || "",
        message: msg.trim(),
        is_admin: false,
        is_read: false,
      })
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    // Fire-and-forget: trigger AI support response in the background
    // Check settings for AI support
    const { data: settingsRows } = await supabase
      .from("settings")
      .select("key, value");

    const settings: Record<string, string> = {};
    if (settingsRows) {
      for (const row of settingsRows) {
        settings[row.key] = row.value;
      }
    }

    const aiEnabled = settings.ai_support_enabled === "true";
    const aiName = settings.ai_support_name || "Maya";
    const aiPersonality = settings.ai_support_personality || "friendly and helpful";
    const deepseekKey = settings.deepseek_api_key || getDeepseekKey();

    if (aiEnabled && deepseekKey) {
      const userName = profile?.full_name || user.email?.split("@")[0] || "there";
      const systemPrompt = `You are ${aiName}, an AI assistant for BC AI (Business Companion AI).

Your personality: ${aiPersonality}

IMPORTANT RULES:
1. Always introduce yourself as "${aiName}" when starting a conversation.
2. Be concise but warm in your responses.
3. The user's name is "${userName}".
4. Keep responses under 3-4 sentences unless the question requires more detail.
5. NEVER make up information you're not sure about. When in doubt, say you'll have the team follow up.`;

      fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${deepseekKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: msg.trim() },
          ],
          temperature: 0.7,
          max_tokens: 512,
        }),
      })
        .then(async (dsRes) => {
          if (!dsRes.ok) {
            console.error("[chat/send] deepseek error", { status: dsRes.status });
            return;
          }
          const dsData = await dsRes.json();
          const aiContent = dsData?.choices?.[0]?.message?.content;
          if (!aiContent) return;

          await supabase.from("chat_messages").insert({
            user_id: user.id,
            user_name: aiName,
            user_email: "ai@bcai.support",
            message: aiContent.trim(),
            is_admin: true,
            is_read: false,
          });
          console.log("[chat/send] AI reply sent", { userId: user.id, aiName });
        })
        .catch((err) => {
          console.error("[chat/send] deepseek fetch failed:", err?.message);
        });
    }

    return c.json({ success: true, message: data });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to send message" }, 500);
  }
});

app.get("/api/chat/messages", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const supabase = getSupabaseClient(token);
    const { data: { user }, error: ue } = await (supabase as any).auth.getUser(token);
    if (ue || !user) return c.json({ error: "Invalid token" }, 401);

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ messages: data || [] });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to fetch messages" }, 500);
  }
});

app.get("/api/chat/admin/conversations", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const supabase = getSupabaseClient(token);
    const { data: { user }, error: ue } = await (supabase as any).auth.getUser(token);
    if (ue || !user) return c.json({ error: "Invalid token" }, 401);

    // Check if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) return c.json({ error: "Admin access required" }, 403);

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ messages: data || [] });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to fetch conversations" }, 500);
  }
});

app.post("/api/chat/admin/reply", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const supabase = getSupabaseClient(token);
    const { data: { user }, error: ue } = await (supabase as any).auth.getUser(token);
    if (ue || !user) return c.json({ error: "Invalid token" }, 401);

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, email")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) return c.json({ error: "Admin access required" }, 403);

    const { userId, message: msg } = await c.req.json();
    if (!userId || !msg?.trim()) return c.json({ error: "userId and message are required" }, 400);

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        user_id: userId,
        user_name: "Admin",
        user_email: profile.email || user.email || "admin@bcai.com",
        message: msg.trim(),
        is_admin: true,
        is_read: true,
      })
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true, message: data });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to send reply" }, 500);
  }
});

app.post("/api/chat/admin/mark-read", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const supabase = getSupabaseClient(token);
    const { data: { user }, error: ue } = await (supabase as any).auth.getUser(token);
    if (ue || !user) return c.json({ error: "Invalid token" }, 401);

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) return c.json({ error: "Admin access required" }, 403);

    const { userId } = await c.req.json();
    if (!userId) return c.json({ error: "userId is required" }, 400);

    await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_admin", false)
      .eq("is_read", false);

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to mark as read" }, 500);
  }
});

// ─── Promote/Reactivate admin ────────────────────────────────────────
app.post("/api/promote-admin", async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) return c.json({ error: "Email required" }, 400);
    const supabase = getSupabaseClient();
    const { data: userData } = await (supabase as any).auth.admin.listUsers();
    const user = userData?.users?.find((u: any) => u.email === email);
    if (!user) return c.json({ error: "User not found" }, 404);
    await supabase.from("profiles").update({ is_admin: true, is_active: true }).eq("id", user.id);
    return c.json({ success: true, message: `User ${email} promoted to admin and activated.` });
  } catch (err: any) {
    return c.json({ error: err.message || "Promotion failed" }, 500);
  }
});

export default app;
