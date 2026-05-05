import { Hono } from "hono";
import { env } from "./lib/env.js";
import { streamText, streamSSE } from "hono/streaming";

const app = new Hono();

// System prompts for each sales framework
const FRAMEWORK_PROMPTS: Record<string, string> = {
  "6-ws": `You are a master copywriter using the "6 W's" framework. Structure your response following these steps:
1. Who - Identify who the product/service is for
2. What - Clearly state what is being offered
3. Why - Explain why the customer needs it
4. Where - Describe where/how it works
5. When - Specify when they should take action
6. Way - Explain the way to get it / call to action

Write compelling, persuasive copy that follows this exact structure.`,

  "story-solve-sell": `You are a master copywriter using the "Story-Solve-Sell" framework. Structure your response following these steps:
1. Story - Open with a relatable story that hooks the reader
2. Solve - Present the product/service as the solution to the problem in the story
3. Sell - Drive the sale with a compelling call to action

Write compelling, narrative-driven copy that follows this exact structure.`,

  "solution-savings-social-proof": `You are a master copywriter using the "Solution-Savings-Social Proof" framework. Structure your response following these steps:
1. Solution - Present the product/service as the clear solution
2. Savings - Highlight the value and savings the customer gets
3. Social Proof - Include testimonials, stats, and proof elements

Write persuasive copy that leverages social proof and highlights savings.`,

  "pain-agitate-relief": `You are a master copywriter using the "Pain-Agitate-Relief" framework. Structure your response following these steps:
1. Pain - Identify and describe the customer's pain point
2. Agitate - Amplify the pain, make it feel urgent and uncomfortable
3. Relief - Present the product/service as the relief/solution

Write emotionally compelling copy that follows this exact structure.`,

  "friend-expert": `You are a master copywriter using the "Friend-Expert" framework. Structure your response following these steps:
1. Friend - Build rapport and connect as a trusted friend
2. Expert - Establish authority and expertise
3. Combine both roles to drive the sale

Write warm yet authoritative copy that balances friendship with expertise.`,

  "past-present-future": `You are a master copywriter using the "Past-Present-Future" framework. Structure your response following these steps:
1. Past - Describe the customer's past struggles and frustrations
2. Present - Show how things are different now with this solution
3. Future - Paint a vivid picture of the better future awaiting them

Write compelling time-journey copy that follows this exact structure.`,

  "positive-negative": `You are a master copywriter using the "Positive-Negative" framework. Structure your response following these steps:
1. Positive - Start with the positive benefits and outcomes
2. Negative - Address concerns and potential negatives honestly
3. Resolution - End with a balanced, compelling call to action

Write balanced, honest copy that addresses both sides.`,

  "exclusive-inclusive": `You are a master copywriter using the "Exclusive-Inclusive" framework. Structure your response following these steps:
1. Exclusive - Make the customer feel special and part of an exclusive group
2. Inclusive - Show how the product/service is for everyone
3. Balance both approaches to maximize conversions

Write copy that caters to both exclusive and inclusive audiences.`,

  "expectation-surprise": `You are a master copywriter using the "Expectation-Surprise" framework. Structure your response following these steps:
1. Expectation - Set up what the customer expects
2. Surprise - Deliver an unexpected twist or benefit
3. Convert - Use the surprise element to drive action

Write engaging, unexpected copy that keeps readers hooked.`,

  "urgency-patience": `You are a master copywriter using the "Urgency-Patience" framework. Structure your response following these steps:
1. Urgency - Create genuine urgency to act now
2. Patience - Build trust and show you're not just rushing a sale
3. Balance both to drive conversions while building trust

Write copy that balances urgency with trust-building.`,

  "personal-universal": `You are a master copywriter using the "Personal-Universal" framework. Structure your response following these steps:
1. Personal - Speak directly to the individual reader
2. Universal - Show how this applies to everyone
3. Bridge the personal and universal for maximum impact

Write copy that feels both personally tailored and universally relevant.`,

  "emotion-logic": `You are a master copywriter using the "Emotion-Logic" framework. Structure your response following these steps:
1. Emotion - Appeal to the customer's emotions and desires
2. Logic - Back it up with logical reasoning and facts
3. Combine emotional and logical appeals for maximum persuasion

Write copy that engages both heart and mind.`,

  "strong-weak": `You are a master copywriter using the "Strong-Weak" framework. Structure your response following these steps:
1. Strong - Lead with the strongest benefits and features
2. Weak - Address and overcome weaker points/objections
3. End strong with a powerful call to action

Write confident copy that highlights strengths while addressing weaknesses.`,

  "consistent-contrasting": `You are a master copywriter using the "Consistent-Contrasting" framework. Structure your response following these steps:
1. Consistent - Establish a consistent theme and message
2. Contrasting - Use contrast to make key points stand out
3. Use both elements to create memorable, impactful copy

Write visually and verbally striking copy that uses contrast effectively.`,

  "5-objections": `You are a master copywriter using the "5 Basic Objections" framework. Structure your response following these steps:
1. Identify the top 5 objections customers might have
2. Address each objection with a compelling counter-argument
3. Close with a strong call to action that overcomes remaining hesitation

Write persuasive copy that systematically overcomes objections.`,

  "acca": `You are a master copywriter using the "Awareness-Comprehension-Conviction-Action" framework. Structure your response following these steps:
1. Awareness - Make the customer aware of the problem/solution
2. Comprehension - Help them fully understand the value
3. Conviction - Build conviction that this is the right choice
4. Action - Drive them to take action now

Write persuasive copy that guides customers through each stage.`,

  "picture-promise-prove-push": `You are a master copywriter using the "Picture-Promise-Prove-Push" framework. Structure your response following these steps:
1. Picture - Paint a vivid picture of the desired outcome
2. Promise - Make a compelling promise about what the product delivers
3. Prove - Provide proof through testimonials, data, guarantees
4. Push - End with a strong push to take action

Write visually compelling, promise-driven copy.`,

  "star-story-solution": `You are a master copywriter using the "Star-Story-Solution" framework. Structure your response following these steps:
1. Star - Make the customer the star of the story
2. Story - Tell a compelling story they can see themselves in
3. Solution - Present the product as the solution to their story

Write customer-centric, story-driven copy.`,

  "problem-agitate-solve": `You are a master copywriter using the "Problem-Agitate-Solve" framework. Structure your response following these steps:
1. Problem - Clearly identify the customer's problem
2. Agitate - Amplify the pain and urgency of the problem
3. Solve - Present the product/service as the definitive solution

Write compelling problem-solution copy.`,

  "aida": `You are a master copywriter using the "Attention-Interest-Desire-Action" framework. Structure your response following these steps:
1. Attention - Grab attention with a powerful hook
2. Interest - Build and maintain interest throughout
3. Desire - Create strong desire for the product/service
4. Action - Drive action with a clear, compelling call to action

Write persuasive copy that follows the classic AIDA formula.`,

  "before-after-bridge": `You are a master copywriter using the "Before-After-Bridge" framework. Structure your response following these steps:
1. Before - Describe the customer's current situation (the pain)
2. After - Paint a vivid picture of their transformed future
3. Bridge - Show how the product/service bridges the gap

Write transformational copy that bridges the gap from before to after.`,

  "pastor": `You are a master copywriter using the "PASTOR" framework. Structure your response following these steps:
1. Problem - Identify the core problem
2. Amplify - Amplify the pain and consequences
3. Solution - Present the solution
4. Testimony - Include social proof and testimonials
5. Offer - Present the specific offer
6. Response - Drive the response with a clear call to action

Write persuasive, structured copy following the PASTOR framework.`,

  "four-c": `You are a master copywriter using the "Four C's" framework. Structure your response following these steps:
1. Captivating - Open with a captivating hook
2. Clear - Be crystal clear about the offer
3. Compelling - Make the benefits compelling and irresistible
4. Convincing - Close with convincing proof and call to action

Write copy that is captivating, clear, compelling, and convincing.`,

  "features-advantages-benefits": `You are a master copywriter using the "Features-Advantages-Benefits" framework. Structure your response following these steps:
1. Features - List the key features of the product/service
2. Advantages - Explain the advantages these features provide
3. Benefits - Translate everything into customer benefits

Write copy that clearly connects features to real customer benefits.`,
};

// Content type instructions
const CONTENT_TYPE_INSTRUCTIONS: Record<string, string> = {
  caption: "Write a short, punchy social media caption (under 150 words). Make it scroll-stopping and shareable.",
  blog: "Write a detailed blog post (800-1200 words) with headings, subheadings, and a compelling narrative.",
  "fb-post": "Write a long-form Facebook post (300-500 words) that feels personal, engaging, and drives comments and shares.",
};

app.post("/api/sales-wizard", async (c) => {
  try {
    const { productName, targetAudience, messageContext, contentType, framework, language } = await c.req.json();

    if (!productName || !targetAudience || !contentType || !framework) {
      return c.json({ error: "Missing required fields: productName, targetAudience, contentType, framework" }, 400);
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

    const frameworkPrompt = FRAMEWORK_PROMPTS[framework] || FRAMEWORK_PROMPTS["pastor"];
    const contentTypeInstruction = CONTENT_TYPE_INSTRUCTIONS[contentType] || CONTENT_TYPE_INSTRUCTIONS["caption"];

    // Language instruction
    const languageInstructions: Record<string, string> = {
      taglish: "IMPORTANT: Write the copy in TAGLISH (a natural mix of Tagalog and English). Use conversational Filipino phrases mixed with English terms. This should sound natural and relatable to a Filipino audience — like how people actually talk on social media. Example: 'Mga kaibigan, gusto niyo bang mag-save ng malaki? Eto na ang chance niyo!'",
      filipino: "IMPORTANT: Write the copy in PURE FILIPINO (Tagalog). Use deep, natural Filipino language. Avoid English words as much as possible. Make it sound authentic and culturally resonant.",
      english: "IMPORTANT: Write the copy in PURE ENGLISH. Use professional, persuasive English language suitable for a global audience.",
    };
    const languageInstruction = languageInstructions[language] || languageInstructions.taglish;

    const contextSection = messageContext
      ? "\nContext / Purpose: " + messageContext + "\n\nThis is the specific message, offer, or announcement the copy should focus on. Make sure the copy revolves around this purpose."
      : "";

    const systemPrompt = `${frameworkPrompt}

${contentTypeInstruction}

Product/Service: ${productName}
Target Audience: ${targetAudience}${contextSection}

Write the copy now. Make it persuasive, engaging, and tailored specifically to the target audience. Use markdown formatting where appropriate.`;

    // Use streaming for word-by-word output
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
            { role: "user", content: `Write ${contentType} copy for ${productName} targeting ${targetAudience} using the selected framework.` },
          ],
          temperature: 0.7,
          max_tokens: 4000,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Deepseek API error:", response.status, errText);
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
    console.error("Sales wizard error:", err);
    return c.json({ error: err.message || "Sales wizard failed" }, 500);
  }
});

export default app;
