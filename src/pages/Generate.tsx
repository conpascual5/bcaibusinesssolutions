import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/providers/auth";
import { ArrowLeft, Sparkles, ImageIcon, AlertTriangle } from "lucide-react";

const IMAGE_SIZES = [
  { value: "square_hd", label: "Square HD (1024x1024)" },
  { value: "square", label: "Square (512x512)" },
  { value: "portrait_4_3", label: "Portrait 4:3" },
  { value: "portrait_16_9", label: "Portrait 16:9" },
  { value: "landscape_4_3", label: "Landscape 4:3" },
  { value: "landscape_16_9", label: "Landscape 16:9" },
] as const;

const STYLES = [
  { value: "auto", label: "Auto" },
  { value: "cinematic", label: "Cinematic" },
  { value: "digital-art", label: "Digital Art" },
  { value: "photographic", label: "Photographic" },
  { value: "anime", label: "Anime" },
  { value: "fantasy-art", label: "Fantasy Art" },
  { value: "comic-book", label: "Comic Book" },
  { value: "low-poly", label: "Low Poly" },
  { value: "line-art", label: "Line Art" },
  { value: "pixel-art", label: "Pixel Art" },
  { value: "3d-model", label: "3D Model" },
  { value: "watercolor", label: "Watercolor" },
  { value: "isometric", label: "Isometric" },
  { value: "craft-clay", label: "Craft Clay" },
  { value: "origami", label: "Origami" },
  { value: "modeling-compound", label: "Modeling Compound" },
] as const;

export default function Generate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [imageSize, setImageSize] = useState<(typeof IMAGE_SIZES)[number]["value"]>("square_hd");
  const [imageCount, setImageCount] = useState(1);
  const [style, setStyle] = useState<(typeof STYLES)[number]["value"]>("auto");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="bg-gray-900 text-white py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold">BC AI Business Solutions</span>
          </div>
          <button
            onClick={() => navigate("/app")}
            className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to App
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Image Generator</h1>
          <p className="text-gray-600">This tool is being upgraded for serverless hosting.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Image Size</label>
                <select
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value as any)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {IMAGE_SIZES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Style</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as any)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {STYLES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Number of Images</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setImageCount(n)}
                      className={`px-3 py-2 rounded-xl text-sm font-bold border transition-colors ${
                        imageCount === n ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900">Temporarily unavailable</p>
                  <p className="text-sm text-amber-800 mt-1">
                    The old image generation endpoint was Vercel-backed. We can re-enable this once it’s migrated to a Supabase Edge Function.
                  </p>
                </div>
              </div>

              <button
                disabled
                className="w-full px-5 py-4 rounded-2xl font-extrabold text-white bg-indigo-600/60 cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ImageIcon className="w-5 h-5" />
                Generate (Disabled)
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
              <div className="mx-auto w-14 h-14 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4">
                <ImageIcon className="w-6 h-6 text-slate-600" />
              </div>
              <h2 className="text-lg font-extrabold text-gray-900">Generated images will appear here</h2>
              <p className="text-sm text-gray-600 mt-1">
                We’re migrating storage + generation to Supabase so it works reliably on Vercel.
              </p>
              <p className="text-xs text-gray-500 mt-3">Signed in as: {user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
