import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Facebook, PenLine, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function formatForDisplay(text: string) {
  const trimmed = text.trim();
  return trimmed;
}

function formatForClipboard(text: string) {
  // Preserve what the user sees/edits.
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

export default function SocialPostEditor({
  value,
  onChange,
  title = "Your post",
  subtitle = "Editable, ready to copy",
}: {
  value: string;
  onChange: (next: string) => void;
  title?: string;
  subtitle?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const initialValueRef = useRef(value);

  useEffect(() => {
    // Capture the first generated output as the "reset" baseline.
    if (!initialValueRef.current && value) initialValueRef.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const display = useMemo(() => formatForDisplay(value), [value]);

  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(formatForClipboard(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleReset = () => {
    if (!initialValueRef.current) return;
    onChange(initialValueRef.current);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Facebook className="w-4 h-4 text-indigo-700" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-900 leading-tight">{title}</p>
            <p className="text-xs text-slate-500 leading-tight">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => setMode(mode === "edit" ? "preview" : "edit")}
          >
            <PenLine className="w-4 h-4" />
            <span className="ml-2 hidden sm:inline">{mode === "edit" ? "Preview" : "Edit"}</span>
          </Button>

          <Button type="button" variant="outline" className="rounded-2xl" onClick={handleReset} disabled={!initialValueRef.current}>
            <RotateCcw className="w-4 h-4" />
            <span className="ml-2 hidden sm:inline">Reset</span>
          </Button>

          <Button type="button" className="rounded-2xl bg-indigo-600 hover:bg-indigo-700" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span className="ml-2 hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </Button>
        </div>
      </div>

      <div className="p-5">
        {mode === "edit" ? (
          <div className="space-y-3">
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="min-h-[260px] rounded-3xl bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 text-slate-900 leading-relaxed"
              placeholder="Your generated post will appear here…"
            />
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Editable
              </div>
              <p className="text-xs text-slate-500">Tip: Keep the first 2 lines punchy — that’s what shows in the feed preview.</p>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap">{display}</div>
          </div>
        )}
      </div>
    </div>
  );
}
