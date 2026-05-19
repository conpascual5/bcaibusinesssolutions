import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, Send, X, Bot, MessageSquare, History, Zap } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type AICommandBarProps = {
  context: "bms" | "hr" | "modules";
  placeholder?: string;
  title?: string;
};

const CONTEXT_PROMPTS: Record<string, string> = {
  bms: `You are an AI Business Management assistant for BC AI (Business Companion AI). 
You help users with business management questions about:
- Products, inventory, and stock management
- Sales, revenue, and financial reports
- Customers, invoices, and receipts
- Expenses and cost tracking
- Business targets and performance
- Pricing strategies and analytics
- General business management best practices

Keep responses concise (2-4 sentences). Be professional and data-driven.`,
  hr: `You are an AI HR assistant for BC AI (Business Companion AI). 
You help users with human resources questions about:
- Employee management and profiles
- Attendance, time tracking, and corrections
- Leave management and entitlements
- Payroll computation and deductions
- Performance reviews and ratings
- Bonuses, incentives, and commissions
- Shift scheduling and rosters
- Company structure (offices, departments, designations)
- Org chart and reporting hierarchy
- Philippine labor laws and HR best practices

Keep responses concise (2-4 sentences). Be professional and helpful.`,
};

const SUGGESTIONS: Record<string, string[]> = {
  bms: [
    "How do I add a new product?",
    "Show me my top selling items",
    "How to track business expenses?",
    "What reports are available?",
  ],
  hr: [
    "How do I add a new employee?",
    "How does payroll computation work?",
    "What leave types can I set up?",
    "How to track attendance?",
  ],
};

export default function AICommandBar({ context, placeholder, title }: AICommandBarProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi! I'm your AI ${context === "hr" ? "HR" : "Business Management"} assistant. Ask me anything about ${context === "hr" ? "HR operations" : "your business management"}!`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setShowSuggestions(false);
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(
        "https://dkatgjtvhitknghvaxxn.supabase.co/functions/v1/ai-support",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: text,
            context,
            systemPrompt: CONTEXT_PROMPTS[context],
          }),
        }
      );

      const data = await res.json();

      if (data.replied) {
        // The AI response is already saved to chat_messages by the edge function
        // We'll just show a generic response here
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.response || "I've processed your question. Check the support chat for my detailed response!",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        // Fallback: use a local response
        const fallbackResponses: Record<string, string[]> = {
          bms: [
            "For business management questions, you can check the relevant section in your dashboard. Each module has detailed guides.",
            "I'd recommend looking at the specific module in your BMS dashboard for detailed information on that topic.",
            "That's a great question! You can manage this directly from the corresponding section in your business dashboard.",
          ],
          hr: [
            "For HR-related questions, check the specific HR module in your dashboard. Each section has detailed management features.",
            "You can handle this directly from the HR section of your dashboard. The relevant module has all the tools you need.",
            "Great question! This can be managed from the corresponding HR module in your dashboard with full CRUD capabilities.",
          ],
        };
        const fallbacks = fallbackResponses[context] || fallbackResponses.bms;
        const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: fallback,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 group"
        title={`Ask AI about ${context === "hr" ? "HR" : "Business Management"}`}
      >
        <div className="relative">
          <Bot className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-indigo-600" />
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-white/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">{title || `AI ${context === "hr" ? "HR" : "Business"} Assistant`}</p>
            <p className="text-[10px] text-white/70">Ask anything about {context === "hr" ? "HR" : "your business"}</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto max-h-[400px] p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span className="text-[10px] font-medium text-indigo-500">AI Assistant</span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Suggested questions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(SUGGESTIONS[context] || SUGGESTIONS.bms).map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(s)}
                className="text-[11px] px-2.5 py-1.5 rounded-lg bg-muted hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-border transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || `Ask about ${context === "hr" ? "HR" : "business management"}...`}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
