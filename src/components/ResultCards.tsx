import { useState } from 'react';
import { User, Target, BarChart3, Lightbulb, Users, Sparkles, DollarSign, Calendar, VenusAndMars, MousePointerClick, Star, Layers, MessageSquare, Film, Facebook, Instagram, Music2, Wand2, Check } from 'lucide-react';
import type { Persona, Demographics, Caption, VideoScript, VisualPrompt } from '@/lib/targetingEngine';

export function PersonaCard({ persona, index }: { persona: Persona; index: number }) {
  const colors = [
    "bg-blue-50 border-blue-200",
    "bg-emerald-50 border-emerald-200",
    "bg-amber-50 border-amber-200",
  ];
  const iconColors = ["text-blue-600", "text-emerald-600", "text-amber-600"];

  return (
    <div className={`rounded-2xl p-5 border-2 ${colors[index % 3]} transition-all hover:shadow-md`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${colors[index % 3]} flex items-center justify-center`}>
          <User className={`w-5 h-5 ${iconColors[index % 3]}`} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">{persona.name}</h3>
          <span className="text-xs text-gray-500 font-medium">Persona {index + 1}</span>
        </div>
      </div>
      <p className="text-sm text-gray-700 mb-4 leading-relaxed">{persona.description}</p>
      <div className="flex flex-wrap gap-2">
        {persona.keywords.map((kw, i) => (
          <span key={i} className="px-2.5 py-1 bg-white rounded-lg text-xs font-medium text-gray-600 border border-gray-200">
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}

export function KeywordsCard({ keywords }: { keywords: string[] }) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border-2 border-purple-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <Target className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Targeting Keywords</h3>
          <span className="text-xs text-gray-500 font-medium">{keywords.length} Facebook Interests & Behaviors</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {keywords.map((kw, i) => (
          <span
            key={i}
            className="px-3 py-1.5 bg-white rounded-xl text-sm font-medium text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors cursor-default"
          >
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DemographicsCard({ demographics }: { demographics: Demographics }) {
  return (
    <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl p-6 border-2 border-rose-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Demographic Guardrails</h3>
          <span className="text-xs text-gray-500 font-medium">Suggested targeting parameters</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-rose-100">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase">Age Range</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{demographics.ageRange}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-rose-100">
          <div className="flex items-center gap-2 mb-2">
            <VenusAndMars className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase">Gender</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{demographics.gender}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-rose-100">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase">Income Level</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{demographics.income}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-600 bg-white/60 rounded-xl p-3">
        <Lightbulb className="w-4 h-4 inline text-amber-500 mr-1" />
        {demographics.description}
      </p>
    </div>
  );
}

export function BehavioralLayerCard({ behavioralLayer }: { behavioralLayer: { primary: { name: string; description: string; relevance?: string }; secondary: { name: string; description: string; relevance?: string }; proTip: string } }) {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <Layers className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Behavioral Layer</h3>
          <span className="text-xs text-gray-500 font-medium">The &ldquo;pro move&rdquo; for higher conversions</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl p-4 border-2 border-amber-300 relative">
          <div className="absolute -top-2 -right-2">
            <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">DEFAULT</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <MousePointerClick className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-semibold text-gray-500 uppercase">Primary Behavior</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{behavioralLayer.primary.name}</p>
          <p className="text-sm text-gray-600 mt-1">{behavioralLayer.primary.description}</p>
          {behavioralLayer.primary.relevance && (
            <p className="text-xs text-amber-600 mt-2 font-medium">{behavioralLayer.primary.relevance}</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 border border-emerald-100">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold text-gray-500 uppercase">Secondary Layer</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{behavioralLayer.secondary.name}</p>
          <p className="text-sm text-gray-600 mt-1">{behavioralLayer.secondary.description}</p>
          {behavioralLayer.secondary.relevance && (
            <p className="text-xs text-emerald-600 mt-2 font-medium">{behavioralLayer.secondary.relevance}</p>
          )}
        </div>
      </div>

      <div className="bg-white/80 rounded-xl p-4 border border-emerald-100">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-700 font-medium">{behavioralLayer.proTip}</p>
        </div>
      </div>
    </div>
  );
}

export function WhyCard({ why }: { why: string }) {
  return (
    <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-2xl p-6 border-2 border-sky-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-sky-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">The &ldquo;Why&rdquo;</h3>
          <span className="text-xs text-gray-500 font-medium">Audience selection logic</span>
        </div>
      </div>
      <div className="bg-white rounded-xl p-5 border border-sky-100">
        <p className="text-base text-gray-800 leading-relaxed italic">
          &ldquo;{why}&rdquo;
        </p>
      </div>
    </div>
  );
}

const platformIcons: Record<string, React.ReactNode> = {
  facebook: <Facebook className="w-4 h-4 text-blue-600" />,
  instagram: <Instagram className="w-4 h-4 text-pink-600" />,
  tiktok: <Music2 className="w-4 h-4 text-cyan-600" />,
};

const platformColors: Record<string, string> = {
  facebook: "bg-blue-50 border-blue-200",
  instagram: "bg-pink-50 border-pink-200",
  tiktok: "bg-cyan-50 border-cyan-200",
};

export function CaptionCard({ caption, index }: { caption: Caption; index: number }) {
  const colorClass = platformColors[caption.platform] || "bg-gray-50 border-gray-200";
  const icon = platformIcons[caption.platform] || <MessageSquare className="w-4 h-4 text-gray-600" />;

  return (
    <div className={`rounded-xl p-4 border ${colorClass} hover:shadow-md transition-all`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-bold text-gray-500 uppercase">{caption.platform}</span>
        <span className="text-xs text-gray-400 ml-auto">#{index + 1}</span>
      </div>
      <p className="text-sm text-gray-800 leading-relaxed mb-2">{caption.text}</p>
      <p className="text-xs text-gray-500">{caption.hashtags.join(" ")}</p>
    </div>
  );
}

function VisualPromptBlock({ vp }: { vp: VisualPrompt }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(vp.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/70 rounded-lg p-3 border border-dashed border-gray-300">
      <div className="flex items-center gap-2 mb-2">
        <Wand2 className="w-3.5 h-3.5 text-violet-600" />
        <span className="text-xs font-semibold text-violet-700 uppercase">AI Image Prompt — {vp.scene}</span>
      </div>
      <p className="text-xs text-gray-700 leading-relaxed mb-2 italic">{vp.prompt}</p>
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 bg-violet-100 hover:bg-violet-200 rounded-lg text-xs font-semibold text-violet-700 transition-colors flex items-center gap-1"
        >
          {copied ? <Check className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy Prompt"}
        </button>
      </div>
    </div>
  );
}

export function VideoScriptCard({ script, index }: { script: VideoScript; index: number }) {
  const colors = ["border-purple-200", "border-pink-200", "border-blue-200"];
  const bgColors = ["from-purple-50 to-pink-50", "from-pink-50 to-rose-50", "from-blue-50 to-cyan-50"];

  return (
    <div className={`bg-gradient-to-br ${bgColors[index % 3]} rounded-2xl p-6 border-2 ${colors[index % 3]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-gray-400">AD SCRIPT #{index + 1}</span>
        <span className="px-2 py-1 bg-white/80 rounded-lg text-xs font-semibold text-gray-600">{script.duration}</span>
      </div>
      <h4 className="font-bold text-gray-900 mb-3">{script.title}</h4>

      <div className="space-y-3">
        <div className="bg-white/70 rounded-lg p-3">
          <span className="text-xs font-semibold text-purple-600">HOOK (0-3s)</span>
          <p className="text-sm text-gray-800 mt-1">{script.hook}</p>
        </div>
        <div className="bg-white/70 rounded-lg p-3">
          <span className="text-xs font-semibold text-blue-600">SCENE 1</span>
          <p className="text-sm text-gray-800 mt-1">{script.scene1}</p>
        </div>
        <div className="bg-white/70 rounded-lg p-3">
          <span className="text-xs font-semibold text-blue-600">SCENE 2</span>
          <p className="text-sm text-gray-800 mt-1">{script.scene2}</p>
        </div>
        <div className="bg-white/70 rounded-lg p-3">
          <span className="text-xs font-semibold text-blue-600">SCENE 3</span>
          <p className="text-sm text-gray-800 mt-1">{script.scene3}</p>
        </div>
        <div className="bg-white/70 rounded-lg p-3">
          <span className="text-xs font-semibold text-pink-600">CTA</span>
          <p className="text-sm text-gray-800 mt-1">{script.cta}</p>
        </div>

        <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-300">
          <div className="flex items-center gap-2 mb-3">
            <Wand2 className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-bold text-violet-700">AI Image Prompts for This Script</span>
          </div>
          <p className="text-xs text-gray-500 mb-3">Copy these prompts to the Image Generator to create visuals for each scene.</p>
          <div className="space-y-3">
            {script.visualPrompts.map((vp, i) => (
              <VisualPromptBlock key={i} vp={vp} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
