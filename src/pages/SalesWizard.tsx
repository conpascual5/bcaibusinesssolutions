import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Wand2,
  Target,
  Users,
  FileText,
  BookOpen,
  MessageSquare,
  Loader2,
  ChevronRight,
  Check,
  AlertCircle,
} from "lucide-react";

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

export default function SalesWizard() {
  const navigate = useNavigate();
  const [productName, setProductName] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [contentType, setContentType] = useState<string>("");
  const [selectedFramework, setSelectedFramework] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Wizard</h1>
              <p className="text-sm text-gray-500">Generate high-converting sales copy with AI-powered frameworks</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Panel - Inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product & Audience */}
            <Card className="border-gray-200/60 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  Product & Audience
                </CardTitle>
                <CardDescription>Tell us about what you're selling and who to</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Product Name or Business Name</Label>
                  <Input
                    id="product"
                    placeholder="e.g., Organic Skincare Pro"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="border-gray-200 focus:border-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Textarea
                    id="audience"
                    placeholder="e.g., Health-conscious women aged 25-45 who care about natural ingredients..."
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="min-h-[100px] border-gray-200 focus:border-blue-400 resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Content Type */}
            <Card className="border-gray-200/60 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Content Type
                </CardTitle>
                <CardDescription>Choose the format for your copy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  {CONTENT_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = contentType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setContentType(type.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500/20"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">{type.label}</div>
                          <div className="text-xs text-gray-500 truncate">{type.description}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !productName || !targetAudience || !contentType || !selectedFramework}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-600/20"
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
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Right Panel - Frameworks + Output */}
          <div className="lg:col-span-3 space-y-6">
            {/* Frameworks */}
            <Card className="border-gray-200/60 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Sales Frameworks
                    </CardTitle>
                    <CardDescription>Choose a proven framework for your copy</CardDescription>
                  </div>
                  {selectedFrameworkData && (
                    <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                      {selectedFrameworkData.icon} {selectedFrameworkData.name}
                    </Badge>
                  )}
                </div>
                <div className="mt-3">
                  <Input
                    placeholder="Search frameworks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-gray-200 focus:border-purple-400"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[320px]">
                  <div className="px-4 pb-4 space-y-1">
                    {filteredFrameworks.map((fw) => {
                      const isSelected = selectedFramework === fw.id;
                      return (
                        <button
                          key={fw.id}
                          onClick={() => setSelectedFramework(fw.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            isSelected
                              ? "border-purple-500 bg-purple-50/50 ring-1 ring-purple-500/20"
                              : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-lg mt-0.5">{fw.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900">{fw.name}</div>
                              <div className="text-xs text-gray-500 line-clamp-1">{fw.description}</div>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Output */}
            <Card className="border-gray-200/60 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-emerald-600" />
                    Generated Copy
                  </CardTitle>
                  {output && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(output)}
                      className="text-xs"
                    >
                      Copy All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]" ref={outputRef}>
                  {isGenerating && !output ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
                      <p className="text-sm">Crafting your sales copy...</p>
                    </div>
                  ) : output ? (
                    <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                        {output}
                        {isGenerating && (
                          <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-0.5" />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <Wand2 className="w-10 h-10 mb-3 text-gray-300" />
                      <p className="text-sm">Your generated copy will appear here</p>
                      <p className="text-xs text-gray-400 mt-1">Fill in the details and click generate</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
