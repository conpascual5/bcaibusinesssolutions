import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/providers/trpc";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Wand2,
  Target,
  FileText,
  BookOpen,
  MessageSquare,
  Loader2,
  Check,
  AlertCircle,
  Copy,
  CheckCheck,
  Search,
  Brain,
  Globe,
  MessageCircle,
  Heart,
  Save,
  X,
} from "lucide-react";
import AdAnalyzer from "@/components/AdAnalyzer";

const FRAMEWORK_CATEGORIES: Record<string, { category: string; color: string }> = {
  "6-ws": { category: "Conversion", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  "story-solve-sell": { category: "Storytelling", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  "solution-savings-social-proof": { category: "Psychology", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  "pain-agitate-relief": { category: "Psychology", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  "friend-expert": { category: "Trust", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  "past-present-future": { category: "Storytelling", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  "positive-negative": { category: "Psychology", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  "exclusive-inclusive": { category: "Conversion", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  "expectation-surprise": { category: "Engagement", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  "urgency-patience": { category: "Conversion", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  "personal-universal": { category: "Trust", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  "emotion-logic": { category: "Psychology", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  "strong-weak": { category: "Conversion", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  "consistent-contrasting": { category: "Design", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
  "5-objections": { category: "Objections", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  "acca": { category: "Conversion", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  "picture-promise-prove-push": { category: "Storytelling", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  "star-story-solution": { category: "Storytelling", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  "problem-agitate-solve": { category: "Psychology", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  "aida": { category: "Conversion", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  "before-after-bridge": { category: "Storytelling", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  "pastor": { category: "Conversion", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  "four-c": { category: "Conversion", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  "features-advantages-benefits": { category: "Trust", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
};

const FRAMEWORKS = [
  { id: "6-ws", name: "The Ultimate 6 W's", description: "Step-by-step guide to a high-converting sales page", icon: "📈" },
  { id: "story-solve-sell", name: "Story-Solve-Sell", description: "Hook with a story, present the solution, close the sale", icon: "📖🧩💰" },
  { id: "solution-savings-social-proof", name: "Solution-Savings-Social Proof", description: "Combine social proof with savings to drive sales", icon: "📈💰👥" },
  { id: "pain-agitate-relief", name: "Pain-Agitate-Relief", description: "Call out the pain, make it urgent, then offer relief", icon: "👉🏼" },
  { id: "friend-expert", name: "Friend-Expert", description: "Be both a trusted friend and a credible expert", icon: "👥📈🛍️" },
  { id: "past-present-future", name: "Past-Present-Future", description: "Take them from past struggles to a brighter future", icon: "🔙🔜🔮" },
  { id: "positive-negative", name: "Positive-Negative", description: "Balance the good and the bad for honest persuasion", icon: "📈📉" },
  { id: "exclusive-inclusive", name: "Exclusive-Inclusive", description: "Make everyone feel special and included", icon: "📈👥" },
  { id: "expectation-surprise", name: "Expectation-Surprise", description: "Set an expectation, then deliver an unexpected twist", icon: "👀" },
  { id: "urgency-patience", name: "Urgency-Patience", description: "Create urgency while building long-term trust", icon: "🚨🕰️" },
  { id: "personal-universal", name: "Personal-Universal", description: "Speak to the individual and the crowd at once", icon: "🚀" },
  { id: "emotion-logic", name: "Emotion-Logic", description: "Appeal to both heart and mind for maximum impact", icon: "🧠💕" },
  { id: "strong-weak", name: "Strong-Weak", description: "Lead with strengths, honestly address weaknesses", icon: "📈📉" },
  { id: "consistent-contrasting", name: "Consistent-Contrasting", description: "Stay on message while using contrast to stand out", icon: "🚀" },
  { id: "5-objections", name: "5 Basic Objections", description: "Address the top 5 reasons people don't buy", icon: "🛑" },
  { id: "acca", name: "Awareness-Comprehension-Conviction-Action", description: "Guide customers from awareness to action", icon: "📈👀🧠💪💰" },
  { id: "picture-promise-prove-push", name: "Picture-Promise-Prove-Push", description: "Paint a vision, make a promise, prove it, push for action", icon: "📷💍💪" },
  { id: "star-story-solution", name: "Star-Story-Solution", description: "Make the customer the hero of their own story", icon: "🌟📖💡" },
  { id: "problem-agitate-solve", name: "Problem-Agitate-Solve", description: "Identify the problem, amplify it, then solve it", icon: "📈🤔💡" },
  { id: "aida", name: "Attention-Interest-Desire-Action", description: "The classic formula: grab attention, build interest, create desire, drive action", icon: "📢🤔💕💰" },
  { id: "before-after-bridge", name: "Before-After-Bridge", description: "Show the transformation and how to get there", icon: "🌉" },
  { id: "pastor", name: "PASTOR", description: "5-step system to convert visitors into customers", icon: "🛍️💰" },
  { id: "four-c", name: "Four C's", description: "Captivating, Clear, Compelling, Convincing", icon: "👉📈" },
  { id: "features-advantages-benefits", name: "Features-Advantages-Benefits", description: "Translate features into real customer benefits", icon: "📝" },
];

const CONTENT_TYPES = [
  { id: "caption", label: "Caption", icon: MessageSquare, description: "Short social media caption" },
  { id: "blog", label: "Blog Post", icon: BookOpen, description: "Detailed blog article" },
  { id: "fb-post", label: "Long FB Post", icon: FileText, description: "Long-form Facebook post" },
];

const LANGUAGE_OPTIONS = [
  { id: "taglish", label: "Taglish", icon: Globe, description: "Mix of Tagalog and English — natural and conversational" },
  { id: "english", label: "English", icon: MessageCircle, description: "Pure English for a global audience" },
  { id: "filipino", label: "Pure Filipino", icon: Heart, description: "100% Tagalog — deep and authentic" },
];

function OutputSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
      <div className="pt-4">
        <Skeleton className="h-5 w-1/2 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export default function SalesWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [productName, setProductName] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [messageContext, setMessageContext] = useState("");
  const [contentType, setContentType] = useState<string>("");
  const [selectedFramework, setSelectedFramework] = useState<string>("");
  const [language, setLanguage] = useState<string>("taglish");
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);

  const saveMutation = trpc.salesWizardSaves.save.useMutation({
    onSuccess: () => {
      setShowSaveDialog(false);
      setIsSaving(false);
      toast({ title: "Saved to Library! 📚", description: "You can access it anytime from the Library." });
    },
    onError: (err) => {
      setIsSaving(false);
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    },
  });

  const filteredFrameworks = FRAMEWORKS.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerate = async () => {
    if (!productName || !targetAudience || !contentType || !selectedFramework) {
      setError("Please fill in all fields and select a framework.");
      return;
    }
    setIsGenerating(true);
    setOutput("");
    setError("");
    try {
      const response = await fetch("/api/sales-wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, targetAudience, messageContext, contentType, framework: selectedFramework, language }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Generation failed");
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const dataStr = trimmed.slice(6);
          if (dataStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.content) setOutput((prev) => prev + parsed.content);
          } catch { /* skip */ }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!output) return;
    const defaultTitle = `${productName} — ${FRAMEWORKS.find(f => f.id === selectedFramework)?.name || selectedFramework}`;
    setSaveTitle(defaultTitle);
    setShowSaveDialog(true);
  };

  const confirmSave = () => {
    if (!saveTitle.trim()) return;
    setIsSaving(true);
    saveMutation.mutate({
      title: saveTitle.trim(),
      productName,
      targetAudience,
      messageContext: messageContext || undefined,
      contentType,
      framework: selectedFramework,
      frameworkName: FRAMEWORKS.find(f => f.id === selectedFramework)?.name || selectedFramework,
      output,
    });
  };

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  const selectedFrameworkData = FRAMEWORKS.find((f) => f.id === selectedFramework);
  const frameworkCategory = selectedFramework ? FRAMEWORK_CATEGORIES[selectedFramework] : null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Sales Wizard</h1>
              <p className="text-sm text-muted-foreground">Generate high-converting sales copy in Taglish, Filipino, or English</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Panel */}
          <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Product & Audience */}
            <div className="glass-panel rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Product & Audience</h3>
                      <p className="text-xs text-muted-foreground">What are you selling and who is it for?</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="product" className="text-xs font-medium text-muted-foreground">Product Name or Business Name</Label>
                  <Input id="product" placeholder="e.g., Organic Skincare Pro" value={productName} onChange={(e) => setProductName(e.target.value)} className="bg-background/50 border-border/60 focus:border-indigo-400 focus:ring-indigo-400/20 h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="audience" className="text-xs font-medium text-muted-foreground">Target Audience</Label>
                  <Textarea id="audience" placeholder="e.g., Health-conscious women aged 25-45 na mahilig sa natural ingredients..." value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="min-h-[100px] bg-background/50 border-border/60 focus:border-indigo-400 focus:ring-indigo-400/20 resize-none" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="messageContext" className="text-xs font-medium text-muted-foreground">What's this about? (optional)</Label>
                  <Textarea id="messageContext" placeholder="e.g., 50% off launch promo, new feature announcement, seasonal sale..." value={messageContext} onChange={(e) => setMessageContext(e.target.value)} className="min-h-[80px] bg-background/50 border-border/60 focus:border-indigo-400 focus:ring-indigo-400/20 resize-none" />
                  <p className="text-[11px] text-muted-foreground/60">Describe the purpose — promo, announcement, launch, etc.</p>
                </div>
              </div>
            </div>

            {/* Content Type */}
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Content Type</h3>
                  <p className="text-xs text-muted-foreground">Choose the format for your copy</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {CONTENT_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = contentType === type.id;
                  return (
                    <button key={type.id} onClick={() => setContentType(type.id)} className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${isSelected ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 dark:border-indigo-500/50 ring-1 ring-indigo-400/20" : "border-border/60 hover:border-border hover:bg-accent/50"}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isSelected ? "bg-indigo-500 text-white shadow-sm" : "bg-muted text-muted-foreground"}`}>
                        <Icon className="w-4 h-4 stroke-[1.5]" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-medium text-foreground">{type.label}</div>
                        <div className="text-xs text-muted-foreground truncate">{type.description}</div>
                      </div>
                      {isSelected && <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3 text-white" /></div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language */}
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-rose-600 dark:text-rose-400 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Language</h3>
                  <p className="text-xs text-muted-foreground">What language should the copy be in?</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {LANGUAGE_OPTIONS.map((lang) => {
                  const Icon = lang.icon;
                  const isSelected = language === lang.id;
                  return (
                    <button key={lang.id} onClick={() => setLanguage(lang.id)} className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${isSelected ? "border-rose-400 bg-rose-50/50 dark:bg-rose-900/20 dark:border-rose-500/50 ring-1 ring-rose-400/20" : "border-border/60 hover:border-border hover:bg-accent/50"}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isSelected ? "bg-rose-500 text-white shadow-sm" : "bg-muted text-muted-foreground"}`}>
                        <Icon className="w-4 h-4 stroke-[1.5]" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-medium text-foreground">{lang.label}</div>
                        <div className="text-xs text-muted-foreground truncate">{lang.description}</div>
                      </div>
                      {isSelected && <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3 text-white" /></div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Button */}
            <Button onClick={handleGenerate} disabled={isGenerating || !productName || !targetAudience || !contentType || !selectedFramework} className="w-full h-13 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl text-sm font-semibold shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
              {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Sales Copy</>}
            </Button>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive animate-fade-in">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-3 space-y-6">
            {/* Frameworks */}
            <div className="bg-card rounded-2xl card-shadow border border-border overflow-hidden animate-fade-in">
              <div className="p-5 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400 stroke-[1.5]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Sales Frameworks</h3>
                          <p className="text-xs text-muted-foreground">Choose a proven framework</p>
                    </div>
                  </div>
                  {selectedFrameworkData && frameworkCategory && (
                    <Badge variant="outline" className={`${frameworkCategory.color} border-0 text-xs font-medium px-2.5 py-1`}>
                      {selectedFrameworkData.icon} {frameworkCategory.category}
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground stroke-[1.5]" />
                  <Input placeholder="Search frameworks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-background border-border/60 focus:border-purple-400 focus:ring-purple-400/20 h-9 text-sm" />
                </div>
              </div>
              <ScrollArea className="h-[280px]">
                <div className="p-3 space-y-1">
                  {filteredFrameworks.map((fw) => {
                    const isSelected = selectedFramework === fw.id;
                    const cat = FRAMEWORK_CATEGORIES[fw.id];
                    return (
                      <button key={fw.id} onClick={() => setSelectedFramework(fw.id)} className={`w-full text-left p-3.5 rounded-xl border transition-all ${isSelected ? "border-purple-400 bg-purple-50/50 dark:bg-purple-900/20 dark:border-purple-500/50 ring-1 ring-purple-400/20" : "border-transparent hover:border-border hover:bg-accent/50"}`}>
                        <div className="flex items-start gap-3">
                          <span className="text-lg mt-0.5 flex-shrink-0">{fw.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-medium text-foreground">{fw.name}</span>
                              {cat && <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cat.color} flex-shrink-0`}>{cat.category}</span>}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-1">{fw.description}</div>
                          </div>
                          {isSelected && <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5"><Check className="w-3 h-3 text-white" /></div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Output */}
            <div className="bg-card rounded-2xl card-shadow border border-border overflow-hidden animate-fade-in-up">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Wand2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[1.5]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Generated Copy</h3>
                    <p className="text-xs text-muted-foreground">{selectedFrameworkData ? `${selectedFrameworkData.icon} ${selectedFrameworkData.name}` : "Select a framework to begin"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {output && (
                    <>
                      <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving} className="text-xs gap-1.5 rounded-xl border-border/60">
                        <Save className="w-3.5 h-3.5" /> Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs gap-1.5 rounded-xl border-border/60">
                        {copied ? <><CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <ScrollArea className="h-[400px]" ref={outputRef}>
                {isGenerating && !output ? (
                  <OutputSkeleton />
                ) : output ? (
                  <div className="notion-page my-6 p-8">
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 font-[450]">
                        {output}
                        {isGenerating && <span className="inline-block w-[3px] h-[18px] bg-indigo-500 animate-pulse ml-0.5 align-text-bottom" />}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                      <Wand2 className="w-7 h-7 text-muted-foreground/50 stroke-[1]" />
                    </div>
                    <p className="text-sm font-medium">Your generated copy will appear here</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Fill in the details and click Generate</p>
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Ad Analyzer */}
            <AdAnalyzer language={language} />
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full shadow-2xl border border-border animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Save to Library</h3>
              <button onClick={() => setShowSaveDialog(false)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="saveTitle" className="text-xs font-medium text-muted-foreground">Title</Label>
                <Input id="saveTitle" value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)} className="bg-background/50 border-border/60 focus:border-indigo-400 focus:ring-indigo-400/20" placeholder="Name your saved copy..." />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
                <Save className="w-3.5 h-3.5 flex-shrink-0" />
                <span>This will be saved in your Library where you can access it anytime.</span>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowSaveDialog(false)} className="flex-1 rounded-xl border-border/60">
                  Cancel
                </Button>
                <Button onClick={confirmSave} disabled={isSaving || !saveTitle.trim()} className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-600/20">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
