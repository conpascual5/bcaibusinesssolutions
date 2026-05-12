import { useState } from "react";
import { Target, Sparkles, AlertTriangle } from "lucide-react";

export default function FBAdsTargeting() {
  const [businessName, setBusinessName] = useState("");
  const [product, setProduct] = useState("");

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">FB Ads Targeting</h1>
            <p className="text-sm text-gray-500">AI-powered.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Business Name</label>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Con's Online Store"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Product</label>
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Whitening Soap"
            />
          </div>
        </div>

        <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900">Temporarily unavailable</p>
            <p className="text-sm text-amber-800 mt-1">We’re removing provider-specific AI wiring from the product UI right now.</p>
          </div>
        </div>

        <button
          disabled
          className="mt-4 w-full px-5 py-4 rounded-2xl font-extrabold text-white bg-indigo-600/60 cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Generate (Disabled)
        </button>
      </div>
    </div>
  );
}
