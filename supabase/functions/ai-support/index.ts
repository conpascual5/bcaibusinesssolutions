import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
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
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      console.error("[ai-support] auth error", { message: userErr?.message });
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { message: userMessage, userId, context, systemPrompt: customPrompt } = body;

    if (!userMessage?.trim()) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    // Get AI support settings
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

    if (!aiEnabled) {
      return new Response(JSON.stringify({ replied: false, reason: "ai_disabled" }), {
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    // Get the user's profile
    const targetUserId = userId || userData.user.id;
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, plan, is_active")
      .eq("id", targetUserId)
      .maybeSingle();

    const userName = profile?.full_name || userData.user.email?.split("@")[0] || "there";
    const userPlan = profile?.plan || "free";

    // Build system prompt - use custom prompt if provided (for AI Command Bar)
    let systemPrompt = `You are ${aiName}, an AI assistant for BC AI (Business Companion AI).\n\nYour personality: ${aiPersonality}\n\nIMPORTANT RULES:\n1. Always introduce yourself as "${aiName}" when starting a conversation.\n2. Be concise but warm in your responses.\n3. The user's name is "${userName}" and their plan is "${userPlan}".\n4. Keep responses under 3-4 sentences unless the question requires more detail.\n5. NEVER make up information you're not sure about. When in doubt, say you'll have the team follow up.`;

    if (customPrompt) {
      systemPrompt = `${customPrompt}\n\nYour name is ${aiName}. Your personality: ${aiPersonality}. The user's name is "${userName}".`;
    }

    const deepseekKey = settings.deepseek_api_key || "";
    if (!deepseekKey) {
      return new Response(JSON.stringify({ replied: false, reason: "no_api_key" }), {
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

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
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 512,
      }),
    });

    if (!dsRes.ok) {
      const text = await dsRes.text();
      console.error("[ai-support] deepseek error", { status: dsRes.status, text });
      return new Response(JSON.stringify({ replied: false, reason: "ai_error" }), {
        status: 502,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const dsData = await dsRes.json();
    const aiContent = dsData?.choices?.[0]?.message?.content ?? "";

    if (!aiContent) {
      return new Response(JSON.stringify({ replied: false, reason: "empty_response" }), {
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    // For AI Command Bar (context provided), return response directly
    if (context) {
      console.log("[ai-support] command bar response", { context, userId: targetUserId });
      return new Response(JSON.stringify({ replied: true, response: aiContent.trim(), name: aiName }), {
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    // For support chat, insert as admin message
    const { error: insertErr } = await supabase
      .from("chat_messages")
      .insert({
        user_id: targetUserId,
        user_name: aiName,
        user_email: "ai@bcai.support",
        message: aiContent.trim(),
        is_admin: true,
        is_read: false,
      });

    if (insertErr) {
      console.error("[ai-support] insert error", { message: insertErr.message });
      return new Response(JSON.stringify({ replied: false, reason: "db_error" }), {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    console.log("[ai-support] replied to user", { userId: targetUserId, aiName });
    return new Response(JSON.stringify({ replied: true, name: aiName }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (err) {
    console.error("[ai-support] exception", { err });
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
