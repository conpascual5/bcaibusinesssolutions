import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { supabase } from '@/integrations/supabase/client';
import {
  Sparkles, ArrowRight, Check, Download,
  FileSpreadsheet, FileText, ChevronRight,
  Menu, X, Star, Shield, Zap,
  Monitor, Smartphone, Users, RefreshCw,
  Infinity, BarChart3, Layers,
} from 'lucide-react';
import AnimatedSection from '@/components/AnimatedSection';

type TrackerTemplate = {
  id: string;
  name: string;
  slug: string;
  description: string;
  long_description: string;
  price_excel: number;
  price_gsheets: number;
  category: string;
  features: string[];
  inclusions: string[];
  highlights: string[];
  is_active: boolean;
};

export default function Shop() {
  const [template, setTemplate] = useState<TrackerTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('tracker_templates')
        .select('*')
        .eq('slug', 'business-management-system')
        .single();
      setTemplate(data as unknown as TrackerTemplate);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Tracker not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Download className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Tracker Shop</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#overview" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Overview</a>
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#highlights" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Highlights</a>
              <Link to="/auth" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Sign In</Link>
              <Link to="/" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
                ← Back to Home
              </Link>
            </div>
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-lg px-4 py-4 space-y-3">
            <a href="#overview" className="block text-sm text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>Overview</a>
            <a href="#features" className="block text-sm text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#pricing" className="block text-sm text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#highlights" className="block text-sm text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>Highlights</a>
            <Link to="/auth" className="block text-sm text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
            <Link to="/" className="block text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold" onClick={() => setMobileMenuOpen(false)}>← Back to Home</Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="overview" className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 pt-28 pb-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-300/30 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-300/30 rounded-full blur-[100px] -translate-x-1/4 translate-y-1/4" />
        
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <AnimatedSection delay={100}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 border border-white/20 rounded-full mb-6 backdrop-blur">
              <Download className="w-4 h-4 text-emerald-300" />
              <span className="text-sm text-white font-medium">Downloadable Tracker Templates</span>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6">
              {template.name}
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={300}>
            <p className="text-lg sm:text-xl text-emerald-100 max-w-3xl mx-auto mb-8 leading-relaxed">
              {template.description}
            </p>
          </AnimatedSection>
          <AnimatedSection delay={400}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full mb-8">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm text-emerald-100 font-semibold">Applicable for both Product-based and Service-based Business</span>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={500}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#pricing" className="px-8 py-4 bg-white text-emerald-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl flex items-center justify-center gap-2">
                View Pricing <ArrowRight className="w-5 h-5" />
              </a>
              <a href="#features" className="px-8 py-4 bg-white/10 border border-white/30 text-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2 backdrop-blur">
                See Features
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "12", label: "Integrated Trackers", color: "text-emerald-600" },
            { value: "2", label: "Formats Available", color: "text-teal-600" },
            { value: "Lifetime", label: "One-Time Payment", color: "text-cyan-600" },
            { value: "Multi-Year", label: "Data Storage", color: "text-emerald-600" },
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

      {/* What's Included */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <Layers className="w-3 h-3" /> Package Inclusions
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-4">What You Get</h2>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {template.inclusions.map((item, i) => (
              <AnimatedSection key={i} delay={i * 100} direction="up">
                <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="font-semibold text-gray-800">{item}</span>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* 12 Core Features */}
      <section id="features" className="py-20 px-4 bg-gradient-to-b from-emerald-50 via-teal-50 to-white">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <BarChart3 className="w-3 h-3" /> Core Highlights
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-4">12 Integrated Trackers</h2>
              <p className="text-gray-500 mt-3 max-w-xl mx-auto">
                Everything you need to run your business — all interconnected in one file.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {template.features.map((feature, i) => {
              const [title, ...descParts] = feature.split(': ');
              const desc = descParts.join(': ');
              return (
                <AnimatedSection key={i} delay={i * 60} direction="up">
                  <div className="group bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform shadow-sm">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* Highlights / Benefits */}
      <section id="highlights" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <Star className="w-3 h-3" /> Features & Benefits
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-4">Why Choose This Tracker?</h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: <FileSpreadsheet className="w-5 h-5" />, color: "from-emerald-500 to-teal-400", title: "Compatibility", desc: "Works with both MS Excel & Google Sheets." },
              { icon: <FileText className="w-5 h-5" />, color: "from-blue-500 to-cyan-400", title: "Ease of Use", desc: "Simple fill-up method — no complex formulas needed." },
              { icon: <Layers className="w-5 h-5" />, color: "from-purple-500 to-indigo-400", title: "Interconnected", desc: "All sheets are linked. Enter once, update everywhere." },
              { icon: <Zap className="w-5 h-5" />, color: "from-amber-500 to-orange-400", title: "Live Automation", desc: "Instant updates with every change you make." },
              { icon: <BarChart3 className="w-5 h-5" />, color: "from-rose-500 to-pink-400", title: "Real-time Dashboard", desc: "Analytical insights with dynamic status reports." },
              { icon: <Infinity className="w-5 h-5" />, color: "from-emerald-500 to-green-400", title: "Lifetime Access", desc: "One-time payment, use it forever." },
              { icon: <Database className="w-5 h-5" />, color: "from-indigo-500 to-purple-400", title: "Data Storage", desc: "Multi-year data record — never lose your history." },
              { icon: <Users className="w-5 h-5" />, color: "from-teal-500 to-emerald-400", title: "Multi-user", desc: "Work on the same file with your team anytime." },
              { icon: <Monitor className="w-5 h-5" />, color: "from-gray-500 to-slate-400", title: "Device Support", desc: "Works on both Windows & Mac." },
            ].map((item, i) => (
              <AnimatedSection key={i} delay={i * 60} direction="up">
                <div className="group bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-11 h-11 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform shadow-sm`}>
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1.5 text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> Pricing
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-4">Choose Your Format</h2>
              <p className="text-gray-500 mt-3 max-w-lg mx-auto">
                One-time payment. Lifetime access. No subscriptions.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Google Sheets */}
            <AnimatedSection delay={100} direction="up">
              <div className="relative bg-white rounded-3xl p-8 border-2 border-emerald-200 shadow-xl shadow-emerald-100">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Most Popular
                </div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <FileSpreadsheet className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900">Google Sheets</h3>
                  <p className="text-sm text-gray-500 mt-1">Sync across devices & team</p>
                  <div className="flex items-baseline justify-center gap-1 mt-4">
                    <span className="text-sm text-gray-400">PHP</span>
                    <span className="text-5xl font-extrabold text-gray-900">{template.price_gsheets.toLocaleString()}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {[
                    'Real-time cloud sync',
                    'Access from any device',
                    'Share with your team',
                    'Auto-save enabled',
                    'Step-by-step User Guide included',
                  ].map((f, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-gray-700">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-2">
                  <Link
                    to="/auth"
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md"
                  >
                    Purchase Now <ArrowRight className="w-4 h-4" />
                  </Link>
                  <div className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    <span className="text-[11px] font-bold text-amber-700">Download will be available soon</span>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* MS Excel */}
            <AnimatedSection delay={200} direction="up">
              <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 hover:shadow-lg transition-all">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900">MS Excel</h3>
                  <p className="text-sm text-gray-500 mt-1">Offline access, full control</p>
                  <div className="flex items-baseline justify-center gap-1 mt-4">
                    <span className="text-sm text-gray-400">PHP</span>
                    <span className="text-5xl font-extrabold text-gray-900">{template.price_excel.toLocaleString()}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {[
                    'Full offline access',
                    'Works on Windows & Mac',
                    'No internet required',
                    'Local file storage',
                    'Step-by-step User Guide included',
                  ].map((f, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-gray-700">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-2">
                  <Link
                    to="/auth"
                    className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-md"
                  >
                    Purchase Now <ArrowRight className="w-4 h-4" />
                  </Link>
                  <div className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    <span className="text-[11px] font-bold text-amber-700">Download will be available soon</span>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* How to Purchase */}
          <AnimatedSection delay={300} direction="up">
            <div className="mt-10 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
              <h3 className="text-xl font-extrabold text-gray-900 text-center mb-8">How to Purchase</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    step: "1",
                    title: "Create an Account",
                    desc: "Sign up for free on BC AI. No credit card needed.",
                    color: "bg-emerald-500",
                  },
                  {
                    step: "2",
                    title: "Message Us on Facebook",
                    desc: "Tell us which format you want (Excel or Google Sheets). Pay via GCash.",
                    color: "bg-amber-500",
                  },
                  {
                    step: "3",
                    title: "Download Your Tracker",
                    desc: "Once payment is confirmed, we'll enable the download in your account. You'll have lifetime access.",
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

          {/* FAQ */}
          <AnimatedSection delay={400} direction="up">
            <div className="mt-8 bg-gradient-to-br from-gray-50 to-white rounded-3xl border border-gray-200 p-8">
              <h3 className="text-xl font-extrabold text-gray-900 text-center mb-6">Frequently Asked Questions</h3>
              <div className="max-w-3xl mx-auto space-y-4">
                {[
                  {
                    q: "What's the difference between Excel and Google Sheets?",
                    a: "The Google Sheets version syncs across devices and can be shared with your team in real-time. The Excel version works fully offline on your computer. Both have the same formulas and features.",
                  },
                  {
                    q: "How do I get the file after payment?",
                    a: "After your GCash payment is confirmed, we'll enable the download button in your account's Shop page. You can download it anytime.",
                  },
                  {
                    q: "Can I use this on both Windows and Mac?",
                    a: "Yes! The Excel file works on both Windows and Mac. The Google Sheets version works on any device with a browser.",
                  },
                  {
                    q: "Is this a one-time payment or subscription?",
                    a: "One-time payment only. You get lifetime access with free version updates.",
                  },
                  {
                    q: "Can my team use the same file?",
                    a: "For Google Sheets, yes — you can share it with your team. For Excel, you can share the file but only one person can edit at a time.",
                  },
                  {
                    q: "Do I need to know Excel formulas?",
                    a: "No! Everything is pre-built with formulas. Just fill in your data using the simple fill-up method.",
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
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <AnimatedSection direction="none">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-300/30 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-300/30 rounded-full blur-[80px]" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Ready to Streamline Your Business?</h2>
              <p className="text-emerald-100 mb-8 max-w-md mx-auto">Get the all-in-one Business Management System. One-time payment, lifetime access.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl">
                  Get Started <ChevronRight className="w-5 h-5" />
                </Link>
                <a
                  href="https://www.facebook.com/bcsocialmediaservices"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white border border-white/30 rounded-xl font-bold text-lg hover:bg-white/20 transition-all shadow-xl"
                >
                  Message Us on Facebook
                </a>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Download className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">Tracker Shop</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#overview" className="hover:text-white transition-colors">Overview</a>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <Link to="/auth" className="hover:text-white transition-colors">Sign In</Link>
            </div>
            <p className="text-xs text-gray-600">2026 BC AI Business Solutions. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Database({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}
