import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  Sparkles, ArrowRight, Zap, Crosshair, Target, BarChart3,
  Lightbulb, Check, Menu, X, Layers,
  MessageCircle, Film, MessageSquare, ChevronRight,
  ArrowUpRight, Palette, Star, Camera,
  FileSearch, FileText, Receipt, Brain, ImageIcon,
  Crown, Wand2, Eye, Shield, CheckCircle,
} from 'lucide-react';
import PortfolioGallery from '@/components/PortfolioGallery';
import AnimatedSection from '@/components/AnimatedSection';

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: <Crosshair className="w-5 h-5" />, color: "bg-blue-500", title: "AI Audience Targeting", desc: "Generate 3 buyer personas with detailed descriptions and interest keywords for Facebook Ads." },
    { icon: <Target className="w-5 h-5" />, color: "bg-purple-500", title: "12-15 Targeting Keywords", desc: "Get specific Facebook Interests & Behaviors using lateral thinking beyond obvious keywords." },
    { icon: <Layers className="w-5 h-5" />, color: "bg-emerald-500", title: "Behavioral Layer", desc: "Product-aware behavioral targeting — matches the right audience segments to your product." },
    { icon: <MessageSquare className="w-5 h-5" />, color: "bg-green-500", title: "Ad Captions", desc: "8 ready-to-use captions with hashtags for Facebook, Instagram, and TikTok." },
    { icon: <Film className="w-5 h-5" />, color: "bg-pink-500", title: "Video Ad Scripts", desc: "3 complete ad scripts with hook, scenes, CTA, and AI image prompts." },
    { icon: <BarChart3 className="w-5 h-5" />, color: "bg-rose-500", title: "Demographics", desc: "Recommended age range, gender, and income levels for optimal ad performance." },
    { icon: <FileSearch className="w-5 h-5" />, color: "bg-indigo-500", title: "Ad Copy Analyzer", desc: "Paste competitor ads and get AI-powered psychological trigger analysis & counter-positioning strategies." },
    { icon: <Receipt className="w-5 h-5" />, color: "bg-teal-500", title: "Invoice Generator", desc: "Generate BIR-compliant Philippine invoices with VAT/Non-VAT support. Download as PDF." },
    { icon: <ImageIcon className="w-5 h-5" />, color: "bg-orange-500", title: "Caption Generator", desc: "Upload your ad image and get optimized captions with hashtags for all platforms." },
    { icon: <Brain className="w-5 h-5" />, color: "bg-cyan-500", title: "AI-Powered Insights", desc: "Deepseek AI integration for deep ad copy analysis and competitive intelligence." },
    { icon: <Lightbulb className="w-5 h-5" />, color: "bg-amber-500", title: "The 'Why'", desc: "Clear logic behind each audience choice so you understand the strategy." },
    { icon: <MessageCircle className="w-5 h-5" />, color: "bg-violet-500", title: "Live Chat Support", desc: "Chat directly with us to order services or get help with your campaigns." },
  ];

  // All tools from the app
  const allTools = [
    { icon: <Wand2 className="w-5 h-5" />, color: "from-blue-500 to-cyan-400", title: "Sales Wizard", desc: "AI-powered sales message generator with multiple frameworks (AIDA, PAS, BAB, etc.) for any product or audience." },
    { icon: <Crosshair className="w-5 h-5" />, color: "from-purple-500 to-pink-400", title: "Captions & Video Script", desc: "Generate 8 ready-to-use ad captions with hashtags and 3 complete video ad scripts with hooks and CTAs." },
    { icon: <Target className="w-5 h-5" />, color: "from-emerald-500 to-teal-400", title: "FB Ads Targeting", desc: "Generate 3 detailed buyer personas with demographics, interests, behaviors, and exact Facebook targeting keywords." },
    { icon: <Eye className="w-5 h-5" />, color: "from-orange-500 to-amber-400", title: "Image Ad Analyzer", desc: "Upload your ad image and get AI-powered analysis with 3 Taglish captions and Facebook Ads targeting strategy." },
    { icon: <FileSearch className="w-5 h-5" />, color: "from-rose-500 to-pink-400", title: "Ad Analyzer", desc: "Paste competitor ad copy and get psychological trigger analysis, counter-positioning strategies, and improvement tips." },
    { icon: <FileText className="w-5 h-5" />, color: "from-indigo-500 to-purple-400", title: "Invoice Generator", desc: "Generate BIR-compliant Philippine invoices with VAT/Non-VAT support. Download as PDF instantly." },
  ];

  const plans = [
    {
      name: "Free",
      price: "0",
      icon: Sparkles,
      color: "text-gray-500",
      badge: "bg-gray-100 text-gray-700 border-gray-200",
      gradient: "from-gray-400 to-gray-500",
      popular: false,
      features: [
        "Access to all 6 AI tools",
        "3 total generations (one-time trial)",
        "Basic ad targeting personas",
        "Invoice generation",
        "Ad copy analysis",
        "Live chat support",
        "Subject to fair usage policy",
      ],
    },
    {
      name: "Pro",
      price: "499",
      period: "/month",
      icon: Crown,
      color: "text-amber-500",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      gradient: "from-amber-400 to-orange-500",
      popular: true,
      features: [
        "500 generations per month",
        "All 6 tools included",
        "Full buyer personas with targeting",
        "Unlimited invoice generation",
        "Unlimited ad copy analysis",
        "Priority live chat support",
        "Subject to fair usage policy",
      ],
    },
    {
      name: "VIP",
      price: "Exclusive",
      icon: Star,
      color: "text-purple-500",
      badge: "bg-purple-100 text-purple-700 border-purple-200",
      gradient: "from-purple-500 to-indigo-600",
      popular: false,
      features: [
        "Exclusive for existing buyers of Static Images, Cinematic Ads & Website Creation",
        "100 generations per month across all AI tools",
        "Advanced buyer personas with deep targeting",
        "Priority invoice generation",
        "Priority ad analysis",
        "Dedicated live chat support",
        "Subject to fair usage policy",
      ],
    },
  ];

  const services = [
    { title: "30 Static Images", price: "499", color: "from-blue-500 to-cyan-400", desc: "30 custom static image ads for your campaigns", features: ["Custom branded designs", "Multiple sizes included", "3-day delivery", "2 revisions"], popular: false },
    { title: "UGC Ads", price: "999", color: "from-purple-500 to-pink-400", desc: "User-generated content style video ads", features: ["UGC-style video ads", "Script + filming guide", "5-day delivery", "3 revisions"], popular: true },
    { title: "Cinematic Ads", price: "1,499", color: "from-orange-500 to-amber-400", desc: "Full cinematic storytelling video ads", features: ["Full storyboard", "Cinematic editing", "Voice over included", "7-day delivery", "Unlimited revisions"], popular: false },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">BC AI</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#tools" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Tools</a>
              <a href="#plans" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Plans</a>
              <a href="#services" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Services</a>
              <a href="#how" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
              <Link to="/auth" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Sign In</Link>
              <Link to="/auth" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200">
                Get Started Free
              </Link>
            </div>
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-lg px-4 py-4 space-y-3">
            <a href="#tools" className="block text-sm text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>Tools</a>
            <a href="#plans" className="block text-sm text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>Plans</a>
            <a href="#services" className="block text-sm text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>Services</a>
            <a href="#how" className="block text-sm text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <Link to="/auth" className="block text-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Get Started Free</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 pt-28 pb-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-500/30 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-400/30 rounded-full blur-[100px] -translate-x-1/4 translate-y-1/4" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-amber-400/20 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <AnimatedSection delay={100}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 border border-white/20 rounded-full mb-6 backdrop-blur">
              <Zap className="w-4 h-4 text-amber-300" />
              <span className="text-sm text-white font-medium">Marketing Tool Kit — All-in-One AI Suite (3 free trial generations)</span>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-6">
              Your Complete{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-300 to-cyan-300">
                Marketing Tool Kit
              </span>
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={300}>
            <p className="text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto mb-6 leading-relaxed">
              From audience targeting and competitor analysis to invoice generation and ad captions — 
              everything you need to run smarter Facebook ad campaigns, all in one place.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={400}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-400/30 rounded-full mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-green-100 font-semibold">100% FREE Access to All Tools</span>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={500}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth" className="px-8 py-4 bg-white text-blue-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl flex items-center justify-center gap-2">
                Start for Free <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#tools" className="px-8 py-4 bg-white/10 border border-white/30 text-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2 backdrop-blur">
                Explore Tools
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "6", label: "AI Tools", color: "text-blue-600" },
            { value: "15+", label: "Targeting Keywords", color: "text-purple-600" },
            { value: "8", label: "Ad Captions", color: "text-green-600" },
            { value: "3", label: "Pricing Plans", color: "text-amber-600" },
          ].map((s, i) => (
            <AnimatedSection key={i} delay={i * 100} direction="down">
              <div>
                <p className={`text-4xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-gray-500 mt-1 font-medium">{s.label}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* All Tools Section */}
      <section id="tools" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <Palette className="w-3 h-3" /> All Tools
              </span>
              <h2 className="text-4xl font-extrabold text-gray-900 mt-4">6 Powerful AI Tools — Zero Cost</h2>
              <p className="text-gray-500 mt-3 max-w-xl mx-auto">From audience research to competitor analysis to invoicing — all free on the Free plan. Upgrade to unlock unlimited usage.</p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {allTools.map((tool, i) => (
              <AnimatedSection key={i} delay={i * 80} direction="up">
                <div className="group bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-12 h-12 bg-gradient-to-r ${tool.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform shadow-sm`}>
                    {tool.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{tool.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{tool.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <Crown className="w-3 h-3" /> Pricing Plans
              </span>
              <h2 className="text-4xl font-extrabold text-gray-900 mt-4">Choose Your Plan</h2>
              <p className="text-gray-500 mt-3 max-w-lg mx-auto">Start free and upgrade when you need more. All plans are subject to a fair usage policy. VIP is exclusive for existing buyers of our ad creatives and website services.</p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => {
              const PlanIcon = plan.icon;
              return (
                <AnimatedSection key={i} delay={i * 150} direction="up">
                  <div className={`relative bg-white rounded-3xl p-6 border-2 transition-all hover:shadow-lg ${
                    plan.popular ? 'border-amber-300 shadow-xl shadow-amber-100' : 'border-gray-100 hover:border-gray-200'
                  }`}>
                    {plan.popular && (
                      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r ${plan.gradient} text-white rounded-full text-xs font-bold shadow-md flex items-center gap-1`}>
                        <Crown className="w-3 h-3" />
                        Most Popular
                      </div>
                    )}
                    
                    {/* Plan Header */}
                    <div className="text-center mb-6">
                      <div className={`w-14 h-14 bg-gradient-to-br ${plan.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                        <PlanIcon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-2xl font-extrabold text-gray-900">{plan.name}</h3>
                      <div className="flex items-baseline justify-center gap-1 mt-2">
                        {plan.name !== "VIP" && <span className="text-sm text-gray-400">PHP</span>}
                        <span className="text-5xl font-extrabold text-gray-900">{plan.price}</span>
                        {plan.period && <span className="text-sm text-gray-400">{plan.period}</span>}
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-3 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Link
                      to="/auth"
                      className={`w-full py-3 rounded-xl font-bold text-center flex items-center justify-center gap-2 transition-all ${
                        plan.popular
                          ? `bg-gradient-to-r ${plan.gradient} text-white hover:opacity-90 shadow-md`
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {plan.price === "0" ? "Get Started Free" : plan.name === "VIP" ? "Request Access" : "Upgrade Now"}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-24 px-4 bg-gradient-to-b from-purple-50 to-blue-50">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <Zap className="w-3 h-3" /> How It Works
              </span>
              <h2 className="text-4xl font-extrabold text-gray-900 mt-4">Three Simple Steps</h2>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: "01", title: "Sign Up", desc: "Create your free account in seconds. No credit card needed.", color: "bg-blue-500" },
              { num: "02", title: "Choose Your Tool", desc: "Pick from 6 AI tools — targeting, competitor analysis, captions, invoices, and more.", color: "bg-purple-500" },
              { num: "03", title: "Get Results", desc: "Personas, keywords, ad analysis, invoices, captions, and video scripts — instantly.", color: "bg-emerald-500" },
            ].map((step, i) => (
              <AnimatedSection key={i} delay={i * 150} direction="up">
                <div className="text-center">
                  <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <span className="text-2xl font-extrabold text-white">{step.num}</span>
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio / Showcase - Videos & Images */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <Film className="w-3 h-3" /> Our Work
              </span>
              <h2 className="text-4xl font-extrabold text-gray-900 mt-4">Sample Ad Creatives</h2>
              <p className="text-gray-500 mt-3 max-w-lg mx-auto">Real Facebook Reel ads and static creatives we've produced for our clients.</p>
            </div>
          </AnimatedSection>

          {/* Facebook Reels */}
          <AnimatedSection delay={100}>
            <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
              <Film className="w-5 h-5 text-rose-500" /> Video Ads
            </h3>
          </AnimatedSection>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-16">
            {[
              '1087625110144232',
              '1188006866703829',
              '3884684911675100',
              '2674574336223850',
              '2003294173805933',
              '1290479858733052',
              '1286400282694511',
              '2139295246876817',
              '1925363451743818',
              '1035184015492663',
            ].map((id, i) => (
              <AnimatedSection key={id} delay={150 + i * 60} direction="up">
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-sm hover:shadow-lg transition-shadow">
                  <div className="aspect-[9/16] relative">
                    <iframe
                      src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(`https://www.facebook.com/reel/${id}`)}&show_text=false&width=267`}
                      className="absolute inset-0 w-full h-full"
                      style={{ border: 'none', overflow: 'hidden' }}
                      scrolling="no"
                      frameBorder="0"
                      allowFullScreen
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      title="Facebook Reel"
                    />
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* Static Image Ads */}
          <AnimatedSection delay={200}>
            <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-500" /> Static Ad Creatives
            </h3>
          </AnimatedSection>
          <AnimatedSection delay={300}>
            <PortfolioGallery />
          </AnimatedSection>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <Star className="w-3 h-3" /> Premium Add-Ons
              </span>
              <h2 className="text-4xl font-extrabold text-gray-900 mt-4">Done-For-You Ad Creatives</h2>
              <p className="text-gray-500 mt-3 max-w-lg mx-auto">All our AI tools are FREE. Need the actual visuals? Our design team delivers.</p>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <AnimatedSection key={i} delay={i * 150} direction="up">
                <div className={`relative bg-white rounded-3xl p-6 border-2 ${s.popular ? 'border-purple-300 shadow-xl shadow-purple-100' : 'border-gray-100 hover:border-gray-200'} transition-all hover:shadow-lg`}>
                  {s.popular && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r ${s.color} text-white rounded-full text-xs font-bold shadow-md`}>
                      Most Popular
                    </div>
                  )}
                  <div className={`w-full h-2 bg-gradient-to-r ${s.color} rounded-full mb-5`} />
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{s.title}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-sm text-gray-400">from</span>
                    <span className="text-sm text-gray-400">PHP</span>
                    <span className="text-4xl font-extrabold text-gray-900">{s.price}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-5">{s.desc}</p>
                  <ul className="space-y-2.5 mb-6">
                    {s.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-gray-700">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${s.color} flex items-center justify-center flex-shrink-0`}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth" className={`w-full py-3 rounded-xl font-bold text-center flex items-center justify-center gap-2 transition-all bg-gradient-to-r ${s.color} text-white hover:opacity-90 shadow-md`}>
                    Order via Chat <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <AnimatedSection direction="none">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/30 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400/30 rounded-full blur-[80px]" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Ready to Supercharge Your Ads?</h2>
              <p className="text-blue-100 mb-8 max-w-md mx-auto">Sign up for free and get access to all 6 AI tools — targeting, competitor analysis, captions, invoices, and more. No credit card needed.</p>
              <Link to="/auth" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl">
                Get Started Free <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">BC AI Business Solutions</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#tools" className="hover:text-white transition-colors">Tools</a>
              <a href="#plans" className="hover:text-white transition-colors">Plans</a>
              <a href="#services" className="hover:text-white transition-colors">Services</a>
              <Link to="/auth" className="hover:text-white transition-colors">Sign Up</Link>
            </div>
            <p className="text-xs text-gray-600">2026 BC AI Business Solutions. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
