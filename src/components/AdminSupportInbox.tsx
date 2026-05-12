import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Send, User, Shield, RefreshCw } from "lucide-react";
import { useAuth } from "@/providers/auth";

type ChatRow = {
  id: number;
  user_id: string;
  title: string;
  updated_at: string;
  created_at: string;
};

type MessageRow = {
  id: number;
  chat_id: number;
  role: string;
  content: string;
  created_at: string;
};

function timeAgo(ts: string) {
  const d = new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AdminSupportInbox() {
  const { token, user } = useAuth();
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const canUse = !!token && !!user?.isAdmin;

  const supportChats = useMemo(() => {
    return chats
      .filter((c) => String(c.title || "").toLowerCase() === "support")
      .sort((a, b) => (b.updated_at || b.created_at).localeCompare(a.updated_at || a.created_at));
  }, [chats]);

  const loadChats = async () => {
    if (!token) return;
    setLoadingChats(true);
    try {
      const res = await fetch("/api/trpc/chat.adminList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      const data = (json?.result?.data as ChatRow[]) ?? [];
      setChats(data);

      if (!selectedChatId) {
        const first = data.find((c) => String(c.title || "").toLowerCase() === "support");
        if (first?.id) setSelectedChatId(first.id);
      }
    } finally {
      setLoadingChats(false);
    }
  };

  const loadMessages = async (chatId: number) => {
    if (!token) return;
    setLoadingMessages(true);
    try {
      const res = await fetch("/api/trpc/chat.getMessages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chatId }),
      });
      const json = await res.json();
      const data = (json?.result?.data as MessageRow[]) ?? [];
      setMessages(data);
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 50);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!canUse) return;
    void loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUse]);

  useEffect(() => {
    if (!selectedChatId) return;
    void loadMessages(selectedChatId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChatId]);

  const send = async () => {
    if (!selectedChatId || !token) return;
    const content = input.trim();
    if (!content) return;

    setInput("");

    // Admin message: store as assistant message so it appears on user's side.
    const res = await fetch("/api/trpc/chat.sendMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ chatId: selectedChatId, content: `[ADMIN] ${content}` }),
    });

    await res.json().catch(() => ({}));
    await loadMessages(selectedChatId);
    await loadChats();
  };

  if (!user?.isAdmin) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-red-500" />
          <p className="text-sm font-semibold text-foreground">Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-indigo-500 stroke-[1.5]" />
            Support Inbox
          </h2>
          <p className="text-sm text-muted-foreground mt-1">View and respond to user support chats.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadChats()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100"
        >
          <RefreshCw className={`w-4 h-4 ${loadingChats ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-border bg-background">
          <div className="p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Support chats</p>
          </div>
          <div className="max-h-[520px] overflow-y-auto">
            {loadingChats ? (
              <div className="p-4 text-sm text-muted-foreground">Loading…</div>
            ) : supportChats.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No support chats yet.</div>
            ) : (
              supportChats.map((c) => {
                const active = c.id === selectedChatId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedChatId(c.id)}
                    className={
                      "w-full text-left px-4 py-3 border-t border-border hover:bg-accent transition-colors " +
                      (active ? "bg-accent" : "bg-background")
                    }
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-2xl bg-indigo-50 flex items-center justify-center">
                        <User className="w-4 h-4 text-indigo-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">User {c.user_id.slice(0, 8)}…</p>
                        <p className="text-xs text-muted-foreground">Updated {timeAgo(c.updated_at || c.created_at)}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-background">
          <div ref={listRef} className="max-h-[520px] overflow-y-auto p-4 space-y-3">
            {selectedChatId == null ? (
              <div className="text-sm text-muted-foreground">Select a chat to view messages.</div>
            ) : loadingMessages ? (
              <div className="text-sm text-muted-foreground">Loading messages…</div>
            ) : messages.length === 0 ? (
              <div className="text-sm text-muted-foreground">No messages yet.</div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div key={m.id} className={isUser ? "flex justify-start" : "flex justify-end"}>
                    <div
                      className={
                        isUser
                          ? "max-w-[85%] rounded-3xl rounded-bl-lg bg-slate-100 text-slate-900 px-4 py-3 text-sm leading-relaxed"
                          : "max-w-[85%] rounded-3xl rounded-br-lg bg-indigo-600 text-white px-4 py-3 text-sm leading-relaxed shadow-sm"
                      }
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 border-t border-border bg-card">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={selectedChatId ? "Reply to the user…" : "Select a chat first"}
                disabled={!selectedChatId}
                rows={2}
                className="flex-1 resize-none rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={!selectedChatId || !input.trim()}
                className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Replies are sent as assistant messages. (We prefix with <span className="font-mono">[ADMIN]</span> to distinguish.)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
