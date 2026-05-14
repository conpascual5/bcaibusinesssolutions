import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, User, Shield, RefreshCw } from "lucide-react";
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

type Conversation = {
  user_id: string;
  user_name: string;
  user_email: string;
  last_message: string;
  last_time: string;
  unread: number;
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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const canUse = !!user?.isAdmin;

  const loadConversations = async () => {
    if (!canUse) return;
    setLoading(true);

    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: false });

    const rows = (data as ChatMessage[]) || [];

    const convMap = new Map<string, Conversation>();
    for (const msg of rows) {
      if (!convMap.has(msg.user_id)) {
        convMap.set(msg.user_id, {
          user_id: msg.user_id,
          user_name: msg.user_name,
          user_email: msg.user_email,
          last_message: msg.message,
          last_time: msg.created_at,
          unread: !msg.is_admin && !msg.is_read ? 1 : 0,
        });
      } else {
        const existing = convMap.get(msg.user_id)!;
        if (!msg.is_admin && !msg.is_read) {
          existing.unread += 1;
        }
      }
    }

    const convs = Array.from(convMap.values()).sort(
      (a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime()
    );

    setConversations(convs);

    if (!selectedUserId && convs.length > 0) {
      setSelectedUserId(convs[0].user_id);
    }

    setLoading(false);
  };

  const loadMessages = async (userId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    setMessages((data as ChatMessage[]) || []);

    // Mark user messages as read
    await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_admin", false)
      .eq("is_read", false);

    setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 50);
  };

  useEffect(() => {
    if (!canUse) return;
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUse]);

  useEffect(() => {
    if (!selectedUserId) return;
    loadMessages(selectedUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId]);

  // Subscribe to new messages
  useEffect(() => {
    if (!canUse) return;

    const channel = supabase
      .channel("admin-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        () => {
          loadConversations();
          if (selectedUserId) loadMessages(selectedUserId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUse, selectedUserId]);

  const send = async () => {
    if (!selectedUserId || !user) return;
    const content = input.trim();
    if (!content) return;

    setSending(true);
    setInput("");

    await supabase.from("chat_messages").insert({
      user_id: selectedUserId,
      user_name: "Admin",
      user_email: user.email || "admin@bcai.com",
      message: content,
      is_admin: true,
      is_read: true,
    });

    setSending(false);
    await loadMessages(selectedUserId);
    await loadConversations();
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
          onClick={() => loadConversations()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Conversation List */}
        <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-border bg-background">
          <div className="p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Conversations</p>
          </div>
          <div className="max-h-[520px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading…</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No conversations yet.</div>
            ) : (
              conversations.map((conv) => {
                const active = conv.user_id === selectedUserId;
                return (
                  <button
                    key={conv.user_id}
                    type="button"
                    onClick={() => setSelectedUserId(conv.user_id)}
                    className={
                      "w-full text-left px-4 py-3 border-t border-border hover:bg-accent transition-colors " +
                      (active ? "bg-accent" : "bg-background")
                    }
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-2xl bg-indigo-50 flex items-center justify-center relative">
                        <User className="w-4 h-4 text-indigo-700" />
                        {conv.unread > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {conv.user_name || conv.user_email || conv.user_id.slice(0, 8) + "…"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {timeAgo(conv.last_time)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="lg:col-span-2 bg-background">
          <div ref={listRef} className="max-h-[520px] overflow-y-auto p-4 space-y-3">
            {selectedUserId == null ? (
              <div className="text-sm text-muted-foreground">Select a conversation to view messages.</div>
            ) : messages.length === 0 ? (
              <div className="text-sm text-muted-foreground">No messages yet.</div>
            ) : (
              messages.map((m) => {
                const isUser = !m.is_admin;
                return (
                  <div key={m.id} className={isUser ? "flex justify-start" : "flex justify-end"}>
                    <div
                      className={
                        isUser
                          ? "max-w-[85%] rounded-3xl rounded-bl-lg bg-slate-100 text-slate-900 px-4 py-3 text-sm leading-relaxed"
                          : "max-w-[85%] rounded-3xl rounded-br-lg bg-indigo-600 text-white px-4 py-3 text-sm leading-relaxed shadow-sm"
                      }
                    >
                      <p className="whitespace-pre-wrap">{m.message}</p>
                      <p className={`text-[10px] mt-1 ${isUser ? "text-gray-400" : "text-indigo-200"}`}>
                        {new Date(m.created_at).toLocaleTimeString("en-PH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
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
                placeholder={selectedUserId ? "Reply to the user…" : "Select a conversation first"}
                disabled={!selectedUserId}
                rows={2}
                className="flex-1 resize-none rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={!selectedUserId || !input.trim() || sending}
                className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50"
                title="Send"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Replies are sent as admin messages and will appear in the user's chat widget.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
