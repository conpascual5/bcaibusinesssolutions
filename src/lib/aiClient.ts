import { EDGE_FUNCTIONS } from "@/lib/edgeFunctions";

export async function aiChat(args: {
  token: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: any }>;
  max_tokens?: number;
  temperature?: number;
}) {
  const res = await fetch(EDGE_FUNCTIONS.chat, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.token}`,
    },
    body: JSON.stringify({
      messages: args.messages,
      max_tokens: args.max_tokens,
      temperature: args.temperature,
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "AI request failed");
  return String(json?.content ?? "");
}
