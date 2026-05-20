import { Package, Sparkles, Star, X } from "lucide-react";

type UpgradePromptProps = {
  feature: string;
  used: number;
  limit: number;
  plan?: string;
  isVip?: boolean;
  onClose?: () => void;
};

export default function UpgradePrompt({ feature, used, limit, plan, isVip, onClose }: UpgradePromptProps) {
  const featureName = feature.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // VIP users see a different message
  if (isVip || plan === "vip") {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-6 shadow-sm relative">
        {onClose && (
          <button onClick={onClose} className="absolute top-3 right-3 p-1 text-purple-400 hover:text-purple-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-md">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">VIP Monthly Limit Reached</h3>
            <p className="text-xs text-gray-500">You've used all 100 VIP credits this month</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-gray-600">Monthly Usage (all tools)</span>
            <span className="font-semibold text-gray-900">{used}/{limit} used</span>
          </div>
          <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
            />
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          You've reached your <strong>VIP monthly limit</strong> of {limit} uses across all tools. Your limit will reset next month.
        </p>

        <p className="text-xs text-gray-400 text-center">
          Need more? Contact us to discuss upgrading your plan.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6 shadow-sm relative">
      {onClose && (
        <button onClick={onClose} className="absolute top-3 right-3 p-1 text-amber-400 hover:text-amber-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-md">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Upgrade to Marketing Kit</h3>
          <p className="text-xs text-gray-500">Unlock unlimited access</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-gray-600">{featureName}</span>
          <span className="font-semibold text-gray-900">{used}/{limit} used</span>
        </div>
        <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
            style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
          />
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        You've reached the free limit for <strong>{featureName}</strong>. Get <strong>unlimited</strong> access to all tools for just <strong>₱299/month</strong>.
      </p>

      <div className="space-y-2 mb-4">
        {[
          "Unlimited AI generations on all tools",
          "Priority processing (faster responses)",
          "Export to PDF/CSV",
          "Priority support via Viber/GChat",
        ].map((perk, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{perk}</span>
          </div>
        ))}
      </div>

      <button className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold text-sm hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg shadow-amber-200 flex items-center justify-center gap-2">
        <Package className="w-4 h-4" />
        Upgrade to Marketing Kit — ₱299/mo
      </button>

      <p className="text-xs text-gray-400 text-center mt-3">
        Or save 17% with annual plan at ₱2,999/year
      </p>
    </div>
  );
}
