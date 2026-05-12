import { useNavigate } from "react-router";
import { useAuth } from "@/providers/auth";
import { Sparkles, Crown, Star, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const plan = user?.plan ?? "free";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Welcome back, {user?.name?.split(" ")[0] || "there"}!
            </h1>
            <p className="text-gray-500 mt-1">Your toolkit is ready. Manage your plan and start generating.</p>
          </div>
          <div className="px-3 py-1.5 rounded-full text-xs font-bold border bg-gray-50 text-gray-700 border-gray-200 inline-flex items-center gap-2">
            {plan === "vip" ? <Star className="w-3.5 h-3.5 text-purple-600" /> : plan === "pro" ? <Crown className="w-3.5 h-3.5 text-amber-600" /> : <Sparkles className="w-3.5 h-3.5 text-gray-500" />}
            {plan.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => navigate("/app/my-plan")}
          className="group bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            My Plan
          </h2>
          <p className="text-sm text-gray-500 mt-2">View your current limits and account status.</p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-indigo-700">
            Open <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        {user?.isAdmin ? (
          <button
            onClick={() => navigate("/admin")}
            className="group bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-600" />
              Admin Panel
            </h2>
            <p className="text-sm text-gray-500 mt-2">Manage users, plans, and API keys.</p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-amber-700">
              Open <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-extrabold text-gray-900">Get more generations</h2>
            <p className="text-sm text-gray-500 mt-2">Upgrade to Pro or VIP to increase your monthly cap.</p>
          </div>
        )}
      </div>
    </div>
  );
}
