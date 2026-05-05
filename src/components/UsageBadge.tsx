import { Crown, Sparkles } from "lucide-react";

type UsageBadgeProps = {
  isPro?: boolean;
  used?: number;
  limit?: number;
  className?: string;
};

export default function UsageBadge({ isPro, used = 0, limit = 0, className = "" }: UsageBadgeProps) {
  if (isPro) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold rounded-full ${className}`}>
        <Crown className="w-2.5 h-2.5" />
        PRO
      </span>
    );
  }

  if (limit > 0) {
    const pct = Math.round((used / limit) * 100);
    const isLow = pct >= 80;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full ${
        isLow
          ? "bg-red-50 text-red-600 border border-red-200"
          : "bg-gray-100 text-gray-500"
      } ${className}`}>
        <Sparkles className="w-2.5 h-2.5" />
        {used}/{limit}
      </span>
    );
  }

  return null;
}
