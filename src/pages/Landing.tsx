import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  Sparkles, ArrowRight, Zap, Target, BarChart3,
  Lightbulb, Menu, X,
  MessageCircle, Film, ChevronRight,
  Palette, Camera,
  FileSearch, FileText, Receipt, Brain,
  Wand2, Eye,
} from 'lucide-react';
import PortfolioGallery from '@/components/PortfolioGallery';
import AnimatedSection from '@/components/AnimatedSection';
import LiveNotification from '@/components/LiveNotification';

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: <Wand2 className="w-5 h-5" />, color: "bg-blue-500", title: "Sales Wizard", desc: "AI-powered sales message generator with 20+ frameworks. Choose Taglish, Filipino, or English." },
    { icon: <Target className="w-5 h-5" />, color: "bg-purple-500", title: "FB Ads Targeting", desc: "3 detailed buyer personas with demographics, interests, behaviors, and exact Facebook targeting keywords." },
    { icon: <Eye className="w-5 h-5" />, color: "bg-emerald-500", title: "Image Ad Analyzer", desc: "Upload your ad image and get AI-powered analysis with Taglish captions and FB Ads targeting strategy." },
    { icon: <FileSearch className="w-5 h-5" />, color: "bg-indigo-500", title: "Ad Copy Analyzer", desc: "Paste competitor ads and get AI-powered psychological trigger analysis & counter-positioning strategies." },
    { icon: <BarChart3 className="w-5 h-5" />, color: "bg-rose-500", title: "Sales Report", desc: "Track sales daily, weekly, monthly, and yearly. Import from Excel or add entries manually." },
    { icon: <Receipt className="w-5 h-5" />, color: "bg-teal-500", title: "Invoice Generator", desc: "Generate BIR-compliant Philippine invoices with VAT/Non-VAT support. Download as PDF." },
    { icon: <Brain className="w-5 h-5" />, color: "bg-cyan-500", title: "AI-Powered Insights", desc: "Deep AI integration for ad copy analysis, competitive intelligence, and viral score predictions." },
    { icon: <Lightbulb className="w-5 h-5" />, color: "bg-amber-500", title: "The 'Why'", desc: "Clear logic behind each audience choice so you understand the strategy." },
    { icon: <MessageCircle className="w-5 h-5" />, color: "bg-violet-500", title: "Live Chat Support", desc: "Chat directly with us to order services or get help with your campaigns." },
  ];

  // All tools from the app
  const allTools = [
    { icon: <Wand2 className="w-5 h-5" />, color: "from-blue-500 to-cyan-400", title: "Sales Wizard", desc: "AI-powered sales message generator with multiple frameworks (AIDA, PAS, BAB, etc.) for any product or audience. Choose from Taglish, Filipino, or English.", badge: "3 trial" },
    { icon: <Target className="w-5 h-5" />, color: "from-emerald-500 to-teal-400", title: "FB Ads Targeting", desc: "Generate 3 detailed buyer personas with demographics, interests, behaviors, and exact Facebook targeting keywords. Target Philippines or International market.", badge: "3 trial" },
    { icon: <Eye className="w-5 h-5" />, color: "from-orange-500 to-amber-400", title: "Image Ad Analyzer", desc: "Upload your ad image and get AI-powered analysis with Taglish captions and Facebook Ads targeting strategy.", badge: "3 trial" },
    { icon: <FileSearch className="w-5 h-5" />, color: "from-rose-500 to-pink-400", title: "Ad Analyzer", desc: "Paste competitor ad copy and get psychological trigger analysis, counter-positioning strategies, and improvement tips.", badge: "3 trial" },
    { icon: <BarChart3 className="w-5 h-5" />, color: "from-teal-500 to-emerald-400", title: "Sales Report", desc: "Track sales daily, weekly, monthly, and yearly. Import from Excel or add entries manually. Charts and summaries included.", badge: "Free" },
    { icon: <FileText className="w-5 h-5" />, color: "from-indigo-500 to-purple-400", title: "Invoice Generator", desc: "Generate BIR-compliant Philippine invoices with VAT/Non-VAT support. Download as PDF instantly.", badge: "Free" },
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
              <a href="#how" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
              <Link to="/about" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">About</Link>
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
            <a href="#how" className="block text-sm text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <Link to="/about" className="block text-sm text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>About</Link>
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
              <span className="text-sm text-green-100 font-semibold">Sales Report &amp; Invoice Generator — Free &amp; Unlimited</span>
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
              <a
                href="https://www.facebook.com/bcsocialmediaservices"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-blue-600 border border-blue-400 text-white rounded-xl font-bold text-lg hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <MessageCircle className="w-5 h-5" /> Order Services
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
            { value: "4", label: "Pricing Plans", color: "text-amber-600" },
            { value: "Free", label: "Sales & Invoices", color: "text-emerald-600" },
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
              <h2 className="text-4xl font-extrabold text-gray-900 mt-4">6 Powerful AI Tools</h2>
              <p className="text-gray-500 mt-3 max-w-xl mx-auto">
                <strong>Sales Report</strong> and <strong>Invoice Generator</strong> are <span className="text-emerald-600 font-bold">free and unlimited</span> for all users.
                The other 4 tools come with <strong>3 free trial generations</strong> on the Free plan. Upgrade to Pro or VIP for more.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {allTools.map((tool, i) => (
              <AnimatedSection key={i} delay={i * 80} direction="up">
                <div className="group bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-12 h-12 bg-gradient-to-r ${tool.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform shadow-sm`}>
                    {tool.icon}
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{tool.title}</h3>
                    {tool.badge === "Free" ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                        Free
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        {tool.badge}
                      </span>
                    )}
                  </div>
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
                <Sparkles className="w-3 h-3" /> Pricing Plans
              </span>
              <h2 className="text-4xl font-extrabold text-gray-900 mt-4">Choose Your Plan</h2>
              <p className="text-gray-500 mt-3 max-w-xl mx-auto">Start free and upgrade when you need more. All plans are subject to a fair usage policy.</p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: "Free",
                price: "0",
                icon: Sparkles,
                gradient: "from-gray-400 to-gray-500",
                popular: false,
                features: [
                  "Sales Report — unlimited & free",
                  "Invoice Generator — unlimited & free",
                  "3 trial generations for Sales Wizard, FB Ads Targeting, Image Ad Analyzer & Ad Analyzer",
                  "Live chat support",
                  "Subject to fair usage policy",
                ],
              },
              {
                name: "Pro",
                price: "499",
                period: "/month",
                icon: Sparkles,
                gradient: "from-amber-400 to-orange-500",
                popular: false,
                features: [
                  "500 generations per month",
                  "Sales Wizard, FB Ads Targeting, Image Ad Analyzer & Ad Analyzer",
                  "Sales Report — unlimited & free",
                  "Invoice Generator — unlimited & free",
                  "Priority live chat support",
                  "Customize 30 product images",
                  "📦 Delivery: Submit your images/theme after payment — receive your content in 2–3 business days",
                  "Subject to fair usage policy",
                ],
              },
              {
                name: "Pro Plus",
                price: "999",
                period: "/month",
                icon: Sparkles,
                gradient: "from-rose-500 to-pink-600",
                popular: true,
                features: [
                  "500 generations per month",
                  "Sales Wizard, FB Ads Targeting, Image Ad Analyzer & Ad Analyzer",
                  "Sales Report — unlimited & free",
                  "Invoice Generator — unlimited & free",
                  "Priority live chat support",
                  "1 30-60 UGC or Cinematic Video Ad",
                  "📦 Delivery: Submit your script after payment — receive your video in 2–3 business days",
                  "Subject to fair usage policy",
                ],
              },
              {
                name: "VIP",
                price: "Exclusive",
                icon: Sparkles,
                gradient: "from-purple-500 to-indigo-600",
                popular: false,
                features: [
                  "Exclusive for existing buyers of Static Images, Cinematic Ads & Website Creation",
                  "100 generations per month for Sales Wizard, FB Ads Targeting, Image Ad Analyzer & Ad Analyzer",
                  "Sales Report — unlimited & free",
                  "Invoice Generator — unlimited & free",
                  "Dedicated live chat support",
                  "Subject to fair usage policy",
                ],
              },
            ].map((plan, i) => (
              <AnimatedSection key={i} delay={i * 150} direction="up">
                <div className={`relative bg-white rounded-3xl p-6 border-2 transition-all hover:shadow-lg ${
                  plan.popular ? 'border-amber-300 shadow-xl shadow-amber-100' : 'border-gray-100 hover:border-gray-200'
                }`}>
                  {plan.popular && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r ${plan.gradient} text-white rounded-full text-xs font-bold shadow-md flex items-center gap-1`}>
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </div>
                  )}
                  
                  {/* Plan Header */}
                  <div className="text-center mb-6">
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
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
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
            ))}
          </div>

          {/* What Happens Next — 1-2-3 Steps */}
          <AnimatedSection delay={500} direction="up">
            <div className="mt-12 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
              <h3 className="text-xl font-extrabold text-gray-900 text-center mb-8">What Happens After You Upgrade?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    step: "1",
                    title: "Secure Payment",
                    desc: "Pay securely via GCash, Maya, or bank transfer. Your payment confirms your order and starts the process.",
                    color: "bg-emerald-500",
                  },
                  {
                    step: "2",
                    title: "Submit Your Assets",
                    desc: "Upload your product images and theme preferences (Pro) or your script (Pro Plus) through the app or message us on Facebook.",
                    color: "bg-amber-500",
                  },
                  {
                    step: "3",
                    title: "Receive Your Content",
                    desc: "We'll deliver your customized product images or video ad within 2–3 business days. We'll notify you as soon as it's ready.",
                    color: "bg-purple-500",
                  },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <span className="text-xl font-extrabold text-white">{item.step}</span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1.5">{item.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* FAQ Section */}
          <AnimatedSection delay={550} direction="up">
            <div className="mt-8 bg-gradient-to-br from-gray-50 to-white rounded-3xl border border-gray-200 p-8">
              <h3 className="text-xl font-extrabold text-gray-900 text-center mb-6">Frequently Asked Questions</h3>
              <div className="max-w-3xl mx-auto space-y-4">
                {[
                  {
                    q: "Do I need to pay first before you start working?",
                    a: "Yes. We operate on a payment-first policy. Once your payment is confirmed, we begin processing your order immediately. This ensures we can dedicate our full attention to your project.",
                  },
                  {
                    q: "How long does it take to receive my content?",
                    a: "Standard delivery is 2–3 business days after payment confirmation and asset submission. If you need it sooner, message us on Facebook and we'll see what we can do.",
                  },
                  {
                    q: "What if I need revisions?",
                    a: "We respond to all inquiries within 24 hours. If you need changes to your delivered content, simply reach out through the app's live chat or our Facebook page and we'll work with you to get it right.",
                  },
                  {
                    q: "What payment methods do you accept?",
                    a: "We accept GCash, Maya, and bank transfers. All prices are in Philippine Pesos (PHP).",
                  },
                  {
                    q: "Can I cancel after payment?",
                    a: "If we haven't started working on your order yet, we can process a full refund. Once work has begun, cancellations are handled on a case-by-case basis. Message us on Facebook for assistance.",
                  },
                ].map((faq, i) => (
                  <details key={i} className="group bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors list-none">
                      {faq.q}
                      <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform flex-shrink-0" />
                    </summary>
                    <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* Note about product images & video ads */}
          <AnimatedSection delay={600} direction="up">
            <div className="mt-10 max-w-2xl mx-auto text-center bg-gradient-to-r from-rose-50 to-amber-50 rounded-3xl p-6 border border-rose-200">
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong>Need product images or video ads?</strong> You can order them separately
                by messaging our Facebook page.{' '}
                <a
                  href="https://www.facebook.com/bcsocialmediaservices"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-600 font-semibold hover:text-rose-700 underline"
                >
                  Message us on Facebook
                </a>
                {' '}for custom product photography, UGC ads, and cinematic video ads.
              </p>
            </div>
          </AnimatedSection>
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
              { num: "02", title: "Choose Your Tool", desc: "Pick from 6 AI tools — Sales Wizard, FB Ads Targeting, Image Analyzer, Ad Analyzer, Sales Report, and Invoices.", color: "bg-purple-500" },
              { num: "03", title: "Get Results", desc: "Personas, keywords, ad analysis, invoices, sales reports, and AI-generated copy — instantly.", color: "bg-emerald-500" },
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
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-5">
              <Camera className="w-5 h-5 text-blue-500" /> Static Ad Creatives
            </h3>
          </AnimatedSection>
          <AnimatedSection delay={300}>
            <PortfolioGallery />
          </AnimatedSection>
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
              <p className="text-blue-100 mb-8 max-w-md mx-auto">Sign up for free and get access to all 6 AI tools — Sales Wizard, FB Ads Targeting, Image Analyzer, Ad Analyzer, Sales Report, and Invoice Generator. No credit card needed.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl">
                  Get Started Free <ChevronRight className="w-5 h-5" />
                </Link>
                <a
                  href="https://www.facebook.com/bcsocialmediaservices"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white border border-white/30 rounded-xl font-bold text-lg hover:bg-white/20 transition-all shadow-xl"
                >
                  <MessageCircle className="w-5 h-5" /> Message Us for Upgrades
                </a>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Terms & Conditions */}
      <section id="terms" className="py-16 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <FileText className="w-3 h-3" /> Legal
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-4">Terms and Conditions</h2>
              <p className="text-sm text-gray-400 mt-1">Last Updated: May 12, 2026</p>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm space-y-6 text-sm text-gray-600 leading-relaxed">
              <p className="font-medium text-gray-800">Welcome to BC Social Media Services. By accessing our website and using our services, you agree to comply with and be bound by the following terms and conditions.</p>

              <div>
                <h3 className="font-bold text-gray-900 text-base mb-2">1. Services Provided</h3>
                <p>BC Social Media Services provides AI-driven marketing solutions, including but not limited to content generation (BC AI), social media management, and digital business consulting.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-base mb-2">2. Pricing and Payment</h3>
                <p><strong>Price Adjustments:</strong> We reserve the right to change our service prices, subscription fees, or generation costs at any time without prior notice. Any price changes will be updated on the website or communicated through our official channels.</p>
                <p className="mt-2"><strong>Taxes:</strong> All stated prices are exclusive of applicable taxes unless otherwise noted.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-base mb-2">3. Fair Access Policy (FAP)</h3>
                <p>To ensure a stable and high-quality experience for all users, we implement a Fair Access Policy:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Usage Limits:</strong> We reserve the right to limit, suspend, or terminate access for accounts that exhibit "bot-like" behavior or excessive manual generations that exceed normal human usage patterns.</li>
                  <li><strong>Resource Sharing:</strong> Users must not engage in activities that place an undue burden on our AI infrastructure (e.g., automated scraping or mass-generation scripts not authorized via API).</li>
                  <li><strong>Quality Preservation:</strong> If a user's consumption significantly impacts the performance of the system for others, we may temporarily throttle their access speeds.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-base mb-2">4. User Responsibilities</h3>
                <p>Users are responsible for the content generated through our platform. BC Social Media Services shall not be held liable for any misinformation or copyright issues arising from the use of AI-generated assets.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-base mb-2">5. Termination</h3>
                <p>We reserve the right to terminate or suspend access to our services immediately, without prior notice or liability, for any reason, including breach of these Terms.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-base mb-2">6. Contact Us</h3>
                <p>For questions regarding these terms, please reach out through our official support channels at <a href="mailto:admin@bcsocialmediaservices.online" className="text-blue-600 hover:underline font-medium">admin@bcsocialmediaservices.online</a>.</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Live Notification Popup */}
      <LiveNotification />

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
              <a href="#terms" className="hover:text-white transition-colors">Terms</a>
              <Link to="/about" className="hover:text-white transition-colors">About</Link>
              <Link to="/auth" className="hover:text-white transition-colors">Sign Up</Link>
            </div>
            <p className="text-xs text-gray-600">2026 BC AI Business Solutions. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
