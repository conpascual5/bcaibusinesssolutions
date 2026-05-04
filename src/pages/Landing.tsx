import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  Sparkles, ArrowRight, Zap, Crosshair, Target, BarChart3,
  Lightbulb, Check, Menu, X, Layers,
  MessageCircle, Film, MessageSquare, ChevronRight,
  ArrowUpRight, Palette, Star, Camera
} from 'lucide-react';

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
    { icon: <Layers className="w-5 h-5" />, color: "bg-emerald-500", title: "Behavioral Layer", desc: "Layer 'Engaged Shoppers' plus secondary behaviors for higher conversion rates." },
    { icon: <MessageSquare className="w-5 h-5" />, color: "bg-green-500", title: "Ad Captions", desc: "8 ready-to-use captions with hashtags for Facebook, Instagram, and TikTok." },
    { icon: <Film className="w-5 h-5" />, color: "bg-pink-500", title: "Video Ad Scripts", desc: "3 complete ad scripts with hook, scenes, CTA, and AI image prompts." },
    { icon: <BarChart3 className="w-5 h-5" />, color: "bg-rose-500", title: "Demographics", desc: "Recommended age range, gender, and income levels for optimal ad performance." },
    { icon: <Lightbulb className="w-5 h-5" />, color: "bg-amber-500", title: "The 'Why'", desc: "Clear logic behind each audience choice so you understand the strategy." },
    { icon: <MessageCircle className="w-5 h-5" />, color: "bg-indigo-500", title: "Live Chat Support", desc: "Chat directly with us to order services or get help with your campaigns." },
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
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
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
            <a href="#features" className="block text-sm text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#services" className="block text-sm text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>Services</a>
            <a href="#how" className="block text-sm text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <Link to="/auth" className="block text-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Get Started Free</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 pt-28 pb-20">
        {/* Colorful blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-500/30 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-400/30 rounded-full blur-[100px] -translate-x-1/4 translate-y-1/4" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-amber-400/20 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 border border-white/20 rounded-full mb-6 backdrop-blur">
            <Zap className="w-4 h-4 text-amber-300" />
            <span className="text-sm text-white font-medium">AI-Powered Facebook Ads Targeting</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-6">
            Find Your Perfect{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-300 to-cyan-300">
              Audience
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-6 leading-relaxed">
            Type your product name and get laser-focused buyer personas, targeting keywords,
            demographics, ad captions, and video scripts — powered by lateral-thinking AI.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-400/30 rounded-full mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-green-100 font-semibold">100% FREE Access to All Features</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth" className="px-8 py-4 bg-white text-blue-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl flex items-center justify-center gap-2">
              Start for Free <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="px-8 py-4 bg-white/10 border border-white/30 text-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2 backdrop-blur">
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "3", label: "Buyer Personas", color: "text-blue-600" },
            { value: "15+", label: "Targeting Keywords", color: "text-purple-600" },
            { value: "8", label: "Ad Captions", color: "text-green-600" },
            { value: "3", label: "Video Scripts", color: "text-pink-600" },
          ].map((s, i) => (
            <div key={i}>
              <p className={`text-4xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-500 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
              <Palette className="w-3 h-3" /> Free Features
            </span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-4">Everything You Need — Zero Cost</h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">From audience research to ad creatives strategy — all free. Only pay if you want us to produce the actual images/videos.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div key={i} className="group bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-24 px-4 bg-gradient-to-b from-purple-50 to-blue-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3 h-3" /> How It Works
            </span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-4">Three Simple Steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: "01", title: "Sign Up", desc: "Create your free account in seconds.", color: "bg-blue-500" },
              { num: "02", title: "Enter Your Product", desc: "Type your product name and let AI find your hidden audiences.", color: "bg-purple-500" },
              { num: "03", title: "Get Results", desc: "Personas, keywords, demographics, captions, video scripts, and more.", color: "bg-emerald-500" },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <span className="text-2xl font-extrabold text-white">{step.num}</span>
                </div>
                <h3 className="font-bold text-xl text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio / Showcase - Facebook Reels */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold uppercase tracking-wider">
              <Film className="w-3 h-3" /> Our Work
            </span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-4">Sample Ad Creatives</h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">Real Facebook Reel ads we've produced for our clients. Watch them play below!</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
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
            ].map((id) => (
              <div key={id} className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-sm hover:shadow-lg transition-shadow">
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
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
              <Star className="w-3 h-3" /> Premium Add-Ons
            </span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-4">Done-For-You Ad Creatives</h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">All our AI targeting and script tools are FREE. Need the actual visuals? Our design team delivers.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <div key={i} className={`relative bg-white rounded-3xl p-6 border-2 ${s.popular ? 'border-purple-300 shadow-xl shadow-purple-100' : 'border-gray-100 hover:border-gray-200'} transition-all hover:shadow-lg`}>
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
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/30 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400/30 rounded-full blur-[80px]" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Ready to Find Your Audience?</h2>
            <p className="text-blue-100 mb-8 max-w-md mx-auto">Sign up for free and start generating AI-powered targeting strategies, captions, and scripts — no credit card needed.</p>
            <Link to="/auth" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl">
              Get Started Free <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
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
              <a href="#features" className="hover:text-white transition-colors">Features</a>
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
