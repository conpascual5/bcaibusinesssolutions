import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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
  Layers,
  Heart,
  TrendingUp,
  Lightbulb,
  Users,
  Clock,
  Zap,
  Eye,
  BarChart3,
  Star,
  ArrowRight,
} from "lucide-react";

// Framework categories for colored badges
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
  { id: "6-ws", name: "The Ultimate 6 W's", description: "A step-by-step guide to creating a high-converting sales page every time!", icon: "📈" },
  { id: "story-solve-sell", name: "Story-Solve-Sell", description: "A method to create compelling pages by telling a story, solving a problem, and driving sales.", icon: "📖🧩💰" },
  { id: "solution-savings-social-proof", name: "Solution-Savings-Social Proof", description: "A proven approach leveraging social proof and highlighting savings to increase conversions.", icon: "📈💰👥" },
  { id: "pain-agitate-relief", name: "Pain-Agitate-Relief", description: "Structure your page highlighting your audience's struggles and offering solutions.", icon: "👉🏼" },
  { id: "friend-expert", name: "Friend-Expert", description: "Leverage the roles of friend and expert to boost sales.", icon: "👥📈🛍️" },
  { id: "past-present-future", name: "Past-Present-Future", description: "Transform your page into a time journey to boost conversions.", icon: "🔙🔜🔮" },
  { id: "positive-negative", name: "Positive-Negative", description: "Highlight positive aspects while addressing negative concerns.", icon: "📈📉" },
  { id: "exclusive-inclusive", name: "Exclusive-Inclusive", description: "Cater to both exclusive and inclusive audiences.", icon: "📈👥" },
  { id: "expectation-surprise", name: "Expectation-Surprise", description: "Turn heads and convert sales with engaging content.", icon: "👀" },
  { id: "urgency-patience", name: "Urgency-Patience", description: "Balance urgency with the patience needed to build trust.", icon: "🚨🕰️" },
  { id: "personal-universal", name: "Personal-Universal", description: "Create pages tailored to your target audience.", icon: "🚀" },
  { id: "emotion-logic", name: "Emotion-Logic", description: "Combine emotional and logical appeals to increase sales.", icon: "🧠💕" },
  { id: "strong-weak", name: "Strong-Weak", description: "Highlight key benefits and address objections.", icon: "📈📉" },
  { id: "consistent-contrasting", name: "Consistent-Contrasting", description: "Use consistent-contrasting design to attract and convert.", icon: "🚀" },
  { id: "5-objections", name: "5 Basic Objections", description: "Overcoming the top 5 sales objections effectively.", icon: "🛑" },
  { id: "acca", name: "Awareness-Comprehension-Conviction-Action", description: "Guide customers through stages of awareness to action.", icon: "📈👀🧠💪💰" },
  { id: "picture-promise-prove-push", name: "Picture-Promise-Prove-Push", description: "Use pictures, promises, and proof to push purchases.", icon: "📷💍💪" },
  { id: "star-story-solution", name: "Star-Story-Solution", description: "Craft compelling pages that tell a persuasive story.", icon: "🌟📖💡" },
  { id: "problem-agitate-solve", name: "Problem-Agitate-Solve", description: "Identify pain points, amplify them, and offer a solution.", icon: "📈🤔💡" },
  { id: "aida", name: "Attention-Interest-Desire-Action", description: "Structure pages that grab attention and lead to action.", icon: "📢🤔💕💰" },
  { id: "before-after-bridge", name: "Before-After-Bridge", description: "Transform your page with the Before-After-Bridge model.", icon: "🌉" },
  { id: "pastor", name: "PASTOR", description: "A proven 5-step system to convert visitors into loyal customers.", icon: "🛍️💰" },
  { id: "four-c", name: "Four C's", description: "Captivating, Clear, Compelling, and Convincing.", icon: "👉📈" },
  { id: "features-advantages-benefits", name: "Features-Advantages-Benefits", description: "Highlight product features, advantages, and benefits.", icon: "📝" },
];

const CONTENT_TYPES = [
  { id: "caption", label: "Caption", icon: MessageSquare, description: "Short social media caption" },
  { id: "blog", label: "Blog Post", icon: BookOpen, description: "Detailed blog article" },
  { id: "fb-post", label: "Long FB Post", icon: FileText, description: "Long-form Facebook post" },
];

// Skeleton loader for the output area
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
      <div className="pt-4">
        <Skeleton className="h-5 w-2/5 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

export default function SalesWizard() {
  const [productName, setProductName] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [contentType, setContentType] = useState<string>("");
  const [selectedFramework, setSelectedFramework] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

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
        body: JSON.stringify({
          productName,
          targetAudience,
          contentType,
          framework: selectedFramework,
        }),
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
            if (parsed.content) {
              setOutput((prev) => prev + parsed.content);
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
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
              <p className="text-sm text-muted-foreground">Generate high-converting sales copy with AI-powered frameworks</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Panel — Sticky sidebar for inputs */}
          <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Product & Audience — Glassmorphism */}
            <div className="glass-panel rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Product & Audience</h3>
                  <p className="text-xs text-muted-foreground">Tell us what you're selling and who to</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="product" className="text-xs font-medium text-muted-foreground">Product Name or Business Name</Label>
                  <Input
                    id="product"
                    placeholder="e.g., Organic Skincare Pro"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="bg-background/50 border-border/60 focus:border-indigo-400 focus:ring-indigo-400/20 h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="audience" className="text-xs font-medium text-muted-foreground">Target Audience</Label>
                  <Textarea
                    id="audience"
                    placeholder="e.g., Health-conscious women aged 25-45 who care about natural ingredients..."
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="min-h-[100px] bg-background/50 border-border/60 focus:border-indigo-400 focus:ring-indigo-400/20 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Content Type — Glassmorphism */}
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
                    <button
                      key={type.id}
                      onClick={() => setContentType(type.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 dark:border-indigo-500/50 ring-1 ring-indigo-400/20"
                          : "border-border/60 hover:border-border hover:bg-accent/50"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected ? "bg-indigo-500 text-white shadow-sm" : "bg-muted text-muted-foreground"
                      }`}>
                        <Icon className="w-4 h-4 stroke-[1.5]" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-medium text-foreground">{type.label}</div>
                        <div className="text-xs text-muted-foreground truncate">{type.description}</div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !productName || !targetAudience || !contentType || !selectedFramework}
              className="w-full h-13 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl text-sm font-semibold shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Sales Copy
                </>
              )}
            </Button>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive animate-fade-in">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Right Panel — Frameworks + Output */}
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
                  <Input
                    placeholder="Search frameworks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-background border-border/60 focus:border-purple-400 focus:ring-purple-400/20 h-9 text-sm"
                  />
                </div>
              </div>
              <ScrollArea className="h-[340px]">
                <div className="p-3 space-y-1">
                  {filteredFrameworks.map((fw) => {
                    const isSelected = selectedFramework === fw.id;
                    const cat = FRAMEWORK_CATEGORIES[fw.id];
                    return (
                      <button
                        key={fw.id}
                        onClick={() => setSelectedFramework(fw.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? "border-purple-400 bg-purple-50/50 dark:bg-purple-900/20 dark:border-purple-500/50 ring-1 ring-purple-400/20"
                            : "border-transparent hover:border-border hover:bg-accent/50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg mt-0.5 flex-shrink-0">{fw.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-medium text-foreground">{fw.name}</span>
                              {cat && (
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cat.color} flex-shrink-0`}>
                                  {cat.category}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-1">{fw.description}</div>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Output — Notion-like canvas */}
            <div className="bg-card rounded-2xl card-shadow border border-border overflow-hidden animate-fade-in-up">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Wand2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[1.5]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Generated Copy</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedFrameworkData ? `${selectedFrameworkData.icon} ${selectedFrameworkData.name}` : "Select a framework to begin"}
                    </p>
                  </div>
                </div>
                {output && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="text-xs gap-1.5 rounded-xl border-border/60"
                  >
                    {copied ? (
                      <><CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> Copied</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> Copy All</>
                    )}
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[500px]" ref={outputRef}>
                {isGenerating && !output ? (
                  <OutputSkeleton />
                ) : output ? (
                  <div className="notion-page my-6 p-8">
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 font-[450]">
                        {output}
                        {isGenerating && (
                          <span className="inline-block w-[3px] h-[18px] bg-indigo-500 animate-pulse ml-0.5 align-text-bottom" />
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                      <Wand2 className="w-7 h-7 text-muted-foreground/50 stroke-[1]" />
                    </div>
                    <p className="text-sm font-medium">Your generated copy will appear here</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Fill in the details and click generate</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
