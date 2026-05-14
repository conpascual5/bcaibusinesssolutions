import { supabase } from "@/integrations/supabase/client";

export async function saveGeneration(params: {
  tool: string;
  input?: Record<string, unknown>;
  output: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("generations").insert({
    user_id: user.id,
    tool: params.tool,
    input: params.input ?? null,
    output: params.output,
  });
}
