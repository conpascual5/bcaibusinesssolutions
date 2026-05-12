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
      console.error("[deepseek-chat] auth error", { message: userErr?.message });
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : null;

    if (!messages) {
      return new Response(JSON.stringify({ error: "Missing messages" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const { data: settingRow, error: settingErr } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "deepseek_api_key")
      .maybeSingle();

    const deepseekKey = (settingRow as any)?.value ?? "";

    if (settingErr) {
      console.error("[deepseek-chat] settings error", { message: settingErr.message });
    }

    if (!deepseekKey) {
      return new Response(
        JSON.stringify({ error: "Deepseek API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } },
      );
    }

    const dsRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${deepseekKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature: body?.temperature ?? 0.7,
        max_tokens: body?.max_tokens ?? 1024,
      }),
    });

    if (!dsRes.ok) {
      const text = await dsRes.text();
      console.error("[deepseek-chat] deepseek error", { status: dsRes.status, text });
      return new Response(
        JSON.stringify({ error: `Deepseek error (${dsRes.status})` }),
        { status: 502, headers: { ...corsHeaders, "content-type": "application/json" } },
      );
    }

    const data = await dsRes.json();
    const content = data?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (err) {
    console.error("[deepseek-chat] exception", { err });
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
