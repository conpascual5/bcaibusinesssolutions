import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, X, Sparkles, Crown } from "lucide-react";
import { useAuth } from "@/providers/auth";
import { supabase } from "@/integrations/supabase/client";

type ChatMessage = {
  id: number;
  user_id: string;
  user_name: string;
  user_email: string;
  message: string;
  is_admin: boolean;
  is_read: boolean;
  created_at: string;
};

export default function SupportChatWidget() {
  const { token, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const enabled = !!user && !!token;

  const api = (path: string, options?: RequestInit) =>
    fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });

  const loadMessages = async () => {
    if (!token || !user) return;
    try {
      const res = await api("/api/chat/messages");
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      setMessages((data as ChatMessage[]) || []);
    }
  };

  useEffect(() => {
    if (!open || !user || !token) return;
    setLoading(true);
    loadMessages().finally(() => setLoading(false));

    const channel = supabase
      .channel("support-chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => [newMsg, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user, token]);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 50);
  }, [messages.length]);

  const send = async () => {
    if (!token || !user) return;
    const content = input.trim();
    if (!content) return;

    setInput("");
    setSendError(null);

    // Optimistic add
    const tempId = Date.now();
    setMessages((m) => [
      {
        id: tempId,
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        message: content,
        is_admin: false,
        is_read: false,
        created_at: new Date().toISOString(),
      },
      ...m,
    ]);

    try {
      const res = await api("/api/chat/send", {
        method: "POST",
        body: JSON.stringify({ message: content }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSendError(data.error || "Failed to send message.");
      }
    } catch (err: any) {
      setSendError(err?.message || "An unexpected error occurred.");
    }
  };

  const headerNote = (() => {
    const plan = user?.plan ?? "free";
    if (plan === "free") return "Free access: 3 total generations. Message us to activate / upgrade.";
    if (plan === "vip") return "VIP access: 100 generations/month. Message us anytime if something is wrong.";
    return "Pro access: 500 generations/month. Message us anytime if something is wrong.";
  })();

  if (!user) return null;

  const sortedMessages = [...messages].reverse();

  return (
    <>
      {/* Bubble */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
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
            ) : sortedMessages.length === 0 ? (
              <div className="text-sm text-slate-500">Send us a message to get started.</div>
            ) : (
              sortedMessages.map((m) => (
                <div key={m.id} className={m.is_admin ? "flex justify-start" : "flex justify-end"}>
                  <div
                    className={
                      m.is_admin
                        ? "max-w-[85%] rounded-3xl rounded-bl-lg bg-slate-100 text-slate-900 px-4 py-3 text-sm leading-relaxed"
                        : "max-w-[85%] rounded-3xl rounded-br-lg bg-indigo-600 text-white px-4 py-3 text-sm leading-relaxed shadow-sm"
                    }
                  >
                    {m.message}
                    <p className={`text-[10px] mt-1 ${m.is_admin ? "text-gray-400" : "text-indigo-200"}`}>
                      {new Date(m.created_at).toLocaleTimeString("en-PH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-slate-100 bg-white">
            {sendError && (
              <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                {sendError}
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setSendError(null);
                }}
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
