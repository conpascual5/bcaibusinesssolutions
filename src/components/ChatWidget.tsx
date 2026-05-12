import { MessageSquare } from "lucide-react";
import { useAuth } from "@/providers/auth";

export default function ChatWidget() {
  const { user } = useAuth();
  if (!user) return null;

  // Chat is temporarily disabled while moving AI + data access to Supabase Edge Functions.
  return (
    <button
      type="button"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-full shadow-lg opacity-60 cursor-not-allowed flex items-center justify-center"
      title="Chat is being upgraded"
      aria-disabled
    >
      <MessageSquare className="w-6 h-6" />
    </button>
  );
}
