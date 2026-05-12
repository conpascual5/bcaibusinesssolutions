import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Send, X, Sparkles, Crown } from "lucide-react";
import { useAuth } from "@/providers/auth";

type ChatRow = { id: number; title: string };

type MessageRow = {
  id: number;
  chat_id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

const SUPPORT_TITLE = "Support";

async function trpcCall<T>(method: "GET" | "POST", path: string, token: string, body?: unknown): Promise<T> {
  const url = method === "GET"
    ? `/api/trpc/${path}?input=${encodeURIComponent(JSON.stringify(body ?? {}))}`
    : `/api/trpc/${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = `HTTP ${res.status}`;
    try {
      const json = JSON.parse(text);
      msg = json?.error?.message ?? json?.error?.[0]?.message ?? msg;
    } catch {}
    throw new Error(msg);
  }

  const json = await res.json();
  return json?.result?.data as T;
}

export default function SupportChatWidget() {
  const { token, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const enabled = !!user && !!token;

  useEffect(() => {
    if (!open) return;
    setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 50);
  }, [open, messages.length]);

  const headerNote = useMemo(() => {
    const plan = user?.plan ?? "free";
    if (plan === "free") {
      return "Free access: 3 total generations. Message us to activate / upgrade.";
    }
    if (plan === "vip") {
      return "VIP access: 100 generations/month. Message us anytime if something is wrong.";
    }
    return "Pro access: 500 generations/month. Message us anytime if something is wrong.";
  }, [user?.plan]);

  const ensureSupportChat = async (): Promise<number> => {
    if (!token) throw new Error("Not authenticated");

    // 1) List chats (GET query) and find existing Support chat
    const list = await trpcCall<ChatRow[]>("GET", "chat.list", token, {});
    const existing = list.find((c) => String(c.title || "").toLowerCase() === SUPPORT_TITLE.toLowerCase());
    if (existing?.id) return Number(existing.id);

    // 2) Create support chat (POST mutation)
    const created = await trpcCall<ChatRow>("POST", "chat.create", token, { title: SUPPORT_TITLE });
    if (!created?.id) throw new Error("Failed to create support chat");
    return created.id;
  };

  const loadMessages = async (id: number) => {
    if (!token) return;
    const data = await trpcCall<MessageRow[]>("GET", "chat.getMessages", token, { chatId: id });
    setMessages(data ?? []);
  };

  const openChat = async () => {
    if (!enabled) return;
    setOpen(true);
    setLoading(true);
    try {
      const id = await ensureSupportChat();
      setChatId(id);
      await loadMessages(id);
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!chatId || !token) return;
    const content = input.trim();
    if (!content) return;

    setInput("");
    setMessages((m) => [
      ...m,
      {
        id: Date.now(),
        chat_id: chatId,
        role: "user",
        content,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      const data = await trpcCall<any>("POST", "chat.sendMessage", token, { chatId, content });

      if (data?.saved) {
        if (data?.aiReply?.content) {
          setMessages((m) => [
            ...m,
            {
              id: Date.now() + 1,
              chat_id: chatId,
              role: "assistant",
              content: String(data.aiReply.content),
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } else {
        setMessages((m) => [
          ...m,
          {
            id: Date.now() + 1,
            chat_id: chatId,
            role: "assistant",
            content: "⚠️ Message failed to send",
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          chat_id: chatId,
          role: "assistant",
          content: `⚠️ ${err instanceof Error ? err.message : "Unknown error"}`,
          created_at: new Date().toISOString(),
        },
      ]);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Bubble */}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : void openChat())}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center"
        title="Message Support"
      >
        {open ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[min(420px,calc(100vw-2.5rem))] rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">Support Chat</p>
                    <p className="text-xs text-slate-600">Report issues, request activation, or ask questions.</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">{headerNote}</p>
              </div>

              <div className="shrink-0">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-700">
                  {user.plan === "pro" ? <Crown className="w-3.5 h-3.5 text-amber-500" /> : null}
                  {user.plan === "vip" ? <Sparkles className="w-3.5 h-3.5 text-purple-600" /> : null}
                  {String(user.plan ?? "free").toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          <div ref={listRef} className="max-h-[360px] overflow-y-auto p-4 space-y-3 bg-white">
            {loading ? (
              <div className="text-sm text-slate-500">Loading chat…</div>
            ) : messages.length === 0 ? (
              <div className="text-sm text-slate-500">Send us a message to get started.</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] rounded-3xl rounded-br-lg bg-indigo-600 text-white px-4 py-3 text-sm leading-relaxed shadow-sm"
                        : "max-w-[85%] rounded-3xl rounded-bl-lg bg-slate-100 text-slate-900 px-4 py-3 text-sm leading-relaxed"
                    }
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-slate-100 bg-white">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={enabled ? "Type your message…" : "Please log in to message support"}
                disabled={!enabled}
                rows={2}
                className="flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={!enabled || !input.trim() || loading}
                className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
