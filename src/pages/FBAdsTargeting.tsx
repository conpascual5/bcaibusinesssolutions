import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/providers/auth';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Crosshair,
  Sparkles,
  User,
  Target,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  LogOut,
  Shield,
  LayoutDashboard,
  Menu,
  Moon,
  Sun,
  FileSearch,
  FileText,
  Wand2,
  Eye,
  Crown,
} from 'lucide-react';
import { useUsageLimit } from '@/hooks/useUsageLimit';
import UpgradePrompt from '@/components/UpgradePrompt';

export default function FBAdsTargeting() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const [productName, setProductName] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const { usage, loading: usageLoading, increment } = useUsageLimit('fb-ads-targeting');

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  const handleGenerate = async () => {
    if (!productName || !targetAudience) {
      setError('Please fill in Product Name and Target Audience.');
      return;
    }

    // Check usage limit first
    if (usage && !usage.isPro && usage.remaining <= 0) {
      setShowUpgrade(true);
      return;
    }

    setIsGenerating(true);
    setOutput('');
    setError('');

    try {
      const response = await fetch('/api/fb-ads-targeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, targetAudience, productDescription }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Generation failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.content) setOutput((prev) => prev + parsed.content);
          } catch { /* skip */ }
        }
      }

      // Increment usage after successful generation
      await increment();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sidebarNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
    { icon: Wand2, label: 'Sales Wizard', path: '/app/sales-wizard' },
    { icon: Crosshair, label: 'Captions & Video Script', path: '/app/targeting' },
    { icon: Target, label: 'FB Ads Targeting', path: '/app/fb-ads-targeting' },
    { icon: Eye, label: 'Image Ad Analyzer', path: '/app/image-ad-analyzer' },
    { icon: FileSearch, label: 'Ad Analyzer', path: '/app/competitor-analysis' },
    { icon: FileText, label: 'Invoices', path: '/app/invoices' },
  ];

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-3 px-1">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-[18px] h-[18px] text-white" />
              </div>
              <span className="font-semibold text-[15px] tracking-tight text-sidebar-foreground truncate group-data-[collapsible=icon]:hidden">
                BC AI
              </span>
              {usage && <UsageBadge isPro={usage.isPro} used={usage.used} limit={usage.limit} className="group-data-[collapsible=icon]:hidden" />}
            </div>
          </SidebarHeader>

          <SidebarSeparator className="mx-4 w-auto opacity-30" />

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarNavItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => navigate(item.path)}
                          tooltip={item.label}
                          className="cursor-pointer gap-3 px-3 py-2.5 text-sm font-medium"
                        >
                          <item.icon className="w-[18px] h-[18px] stroke-[1.5]" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarSeparator className="mx-4 w-auto opacity-30" />

          <SidebarFooter className="p-4 space-y-1">
            {/* Dark mode toggle */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg group-data-[collapsible=icon]:hidden">
              {darkMode ? (
                <Moon className="w-[18px] h-[18px] stroke-[1.5] text-sidebar-foreground/60" />
              ) : (
                <Sun className="w-[18px] h-[18px] stroke-[1.5] text-sidebar-foreground/60" />
              )}
              <span className="text-sm text-sidebar-foreground/60 flex-1">Dark Mode</span>
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
                className="data-[state=checked]:bg-indigo-500"
              />
            </div>

            <SidebarMenu>
              {user?.isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={location.pathname === '/admin'}
                    onClick={() => navigate('/admin')}
                    tooltip="Admin Panel"
                    className="cursor-pointer gap-3 px-3 py-2.5 text-sm font-medium"
                  >
                    <Shield className="w-[18px] h-[18px] stroke-[1.5]" />
                    <span>Admin Panel</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={logout}
                  tooltip="Log Out"
                  className="cursor-pointer gap-3 px-3 py-2.5 text-sm font-medium text-red-400 hover:text-red-300"
                >
                  <LogOut className="w-[18px] h-[18px] stroke-[1.5]" />
                  <span>Log Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          {/* Top bar */}
          <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="flex items-center justify-between px-6 h-16">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="hidden sm:inline font-medium">{user?.name}</span>
                    {usage && <UsageBadge isPro={usage.isPro} used={usage.used} limit={usage.limit} />}
                  </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="mb-8 animate-fade-in">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">FB Ads Targeting</h1>
                    <p className="text-sm text-muted-foreground">Generate AI-powered Facebook Ads targeting strategies</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Panel — Inputs */}
                <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-24 lg:self-start">
                  <div className="bg-card rounded-2xl card-shadow border border-border p-6 space-y-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400 stroke-[1.5]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Product Details</h3>
                        <p className="text-xs text-muted-foreground">What are you advertising?</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="fb-product" className="text-xs font-medium text-muted-foreground">Product Name *</Label>
                        <Input id="fb-product" placeholder="e.g., Organic Face Serum" value={productName} onChange={(e) => setProductName(e.target.value)} className="bg-background/50 border-border/60 focus:border-indigo-400 focus:ring-indigo-400/20 h-10" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="fb-audience" className="text-xs font-medium text-muted-foreground">Target Audience *</Label>
                        <Textarea id="fb-audience" placeholder="e.g., Health-conscious women aged 25-45 interested in natural skincare..." value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="min-h-[100px] bg-background/50 border-border/60 focus:border-indigo-400 focus:ring-indigo-400/20 resize-none" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="fb-desc" className="text-xs font-medium text-muted-foreground">Product Description (optional)</Label>
                        <Textarea id="fb-desc" placeholder="e.g., Organic serum with vitamin C and hyaluronic acid, P499..." value={productDescription} onChange={(e) => setProductDescription(e.target.value)} className="min-h-[80px] bg-background/50 border-border/60 focus:border-indigo-400 focus:ring-indigo-400/20 resize-none" />
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleGenerate} disabled={isGenerating || !productName || !targetAudience} className="w-full h-13 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl text-sm font-semibold shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                    {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate FB Ads Targeting</>}
                  </Button>

                  {error && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive animate-fade-in">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {showUpgrade && usage && (
                    <UpgradePrompt
                      feature="fb-ads-targeting"
                      used={usage.used}
                      limit={usage.limit}
                      onClose={() => setShowUpgrade(false)}
                    />
                  )}
                </div>

                {/* Right Panel — Output */}
                <div className="lg:col-span-3">
                  <div className="bg-card rounded-2xl card-shadow border border-border overflow-hidden animate-fade-in-up">
                    <div className="p-5 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[1.5]" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">FB Ads Targeting Strategy</h3>
                          <p className="text-xs text-muted-foreground">AI-powered audience insights</p>
                        </div>
                      </div>
                      {output && (
                        <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs gap-1.5 rounded-xl border-border/60">
                          {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                        </Button>
                      )}
                    </div>
                    <div ref={outputRef} className="h-[500px] overflow-y-auto p-6">
                      {isGenerating && !output ? (
                        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                          <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                          <p className="text-sm font-medium">Generating targeting strategy...</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">Using AI to analyze your product and audience</p>
                        </div>
                      ) : output ? (
                        <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 font-[450]">
                          {output}
                          {isGenerating && <span className="inline-block w-[3px] h-[18px] bg-indigo-500 animate-pulse ml-0.5 align-text-bottom" />}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                            <Target className="w-7 h-7 text-muted-foreground/50 stroke-[1]" />
                          </div>
                          <p className="text-sm font-medium">Your FB Ads Targeting strategy will appear here</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">Fill in the details and click Generate</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
