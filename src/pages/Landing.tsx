import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import {
  Sparkles, ArrowRight, Zap, Target, BarChart3,
  Lightbulb, Menu, X,
  MessageCircle, Film, ChevronRight,
  Palette, Camera,
  FileSearch, FileText, Receipt, Brain,
  Wand2, Eye, Building2, ShoppingCart,
  ClipboardList, DollarSign, Calculator, Wallet,
  Users, FileSearch as FileSearchIcon, Database,
  Crown,
  Smartphone,
  CheckCircle2,
  Link2, Share2, TrendingUp,
  Calendar,
} from 'lucide-react';
import PortfolioGallery from '@/components/PortfolioGallery';
import AnimatedSection from '@/components/AnimatedSection';
import LiveNotification from '@/components/LiveNotification';
import { trackEvent } from '@/lib/metaPixel';

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const plansTracked = useRef(false);
  const plansRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fire ViewContent when user scrolls to pricing section
  useEffect(() => {
    const el = plansRef.current;
    if (!el || plansTracked.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !plansTracked.current) {
          plansTracked.current = true;
          trackEvent('ViewContent', {
            content_name: 'Pricing Plans',
            content_type: 'product_group',
            content_ids: ['free', 'pro', 'pro_plus', 'vip'],
          });
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
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
    { icon: <FileText className="w-5 h-5" />, color: "from-indigo-500 to-purple-400", title: "Invoice Generator", desc: "Generate customizable invoices with business branding, logo, and e-signature support. Download as PDF.", badge: "Free" },
    { icon: <Building2 className="w-5 h-5" />, color: "from-violet-500 to-indigo-500", title: "Business Management", desc: "Complete business operations suite — products, inventory, sales tracker, expenses, pricing calculator, finance, customers, invoices, receipts, targets, and records.", badge: "Pro+" },
    { icon: <Smartphone className="w-5 h-5" />, color: "from-emerald-500 to-teal-400", title: "GCash Cash In/Out", desc: "Track digital wallet and physical cash balances, log cash in/out transactions, and reconcile daily — built for sari-sari stores and small businesses.", badge: "VIP" },
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
              <a href="#affiliate" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Affiliate</a>
              <Link to="/about" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">About</Link>
              <Link to="/knowledge-base" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Knowledge Base</Link>
              <Link to="/tutorial" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Tutorial</Link>
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
            <a href="#affiliate" className="block text-sm text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>Affiliate</a>
            <Link to="/about" className="block text-sm text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link to="/knowledge-base" className="block text-sm text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>Knowledge Base</Link>
            <Link to="/tutorial" className="block text-sm text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>Tutorial</Link>
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
              <span className="text-sm text-white font-medium">Marketing Tool Kit + Business Management — All-in-One Suite</span>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-6">
              Your Complete{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-300 to-cyan-300">
                Business &amp; Marketing Suite
              </span>
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={300}>
            <p className="text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto mb-6 leading-relaxed">
              From AI-powered ad targeting and competitor analysis to full business management —
              track products, sales, expenses, inventory, invoices, and more. Everything you need to run and grow your business.
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
            { value: "20+", label: "Powerful Tools", color: "text-blue-600" },
            { value: "18+", label: "Business Trackers", color: "text-purple-600" },
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
              <h2 className="text-4xl font-extrabold text-gray-900 mt-4">8 Powerful Tools</h2>
              <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
                <strong>Sales Report</strong> and <strong>Invoice Generator</strong> are <span className="text-emerald-600 font-bold">free and unlimited</span> for all users.
                The other 4 AI tools come with <strong>3 free trial generations</strong> on the Free plan. <strong>Business Management System</strong> and <strong>HR Management System</strong> are available as standalone add-ons or included in paid plans. <strong>Pro (1 BMS user)</strong>, <strong>Pro Plus (3 BMS users + HR included)</strong>, <strong>VIP (5 BMS users + HR included)</strong>.
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

      {/* Business Management System Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-indigo-50 via-violet-50 to-white">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <Building2 className="w-3 h-3" /> New Product
              </span>
              <h2 className="text-4xl font-extrabold text-gray-900 mt-4">Business &amp; HR Management Systems</h2>
              <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
                Two powerful suites to run your entire business. <strong>Business Management System</strong> covers products, inventory, sales, expenses, and more. <strong>HR Management System</strong> handles employees, attendance, leave, payroll, and more.
                Access is granted per user upon request. Each plan has a user limit: <strong>Pro (1 BMS user)</strong>, <strong>Pro Plus (3 BMS users + HR included)</strong>, <strong>VIP (5 BMS users + HR included)</strong>.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Building2 className="w-5 h-5" />, color: "from-violet-500 to-indigo-500", title: "Dashboard", desc: "At-a-glance overview of revenue, profit, expenses, active targets, and low-stock alerts — all in one place." },
              { icon: <ShoppingCart className="w-5 h-5" />, color: "from-blue-500 to-cyan-400", title: "Products", desc: "Manage your product catalog with SKU, pricing, cost tracking, and margin analysis." },
              { icon: <ClipboardList className="w-5 h-5" />, color: "from-emerald-500 to-teal-400", title: "Inventory", desc: "Track stock levels, record stock-in/stock-out movements, and get low-stock alerts." },
              { icon: <DollarSign className="w-5 h-5" />, color: "from-green-500 to-emerald-400", title: "Sales Tracker", desc: "Log daily sales with product, quantity, payment method, and automatic profit calculation." },
              { icon: <Receipt className="w-5 h-5" />, color: "from-rose-500 to-pink-400", title: "Expenses", desc: "Record and categorize business expenses. Filter by date range and track spending patterns." },
              { icon: <Calculator className="w-5 h-5" />, color: "from-amber-500 to-orange-400", title: "Pricing Calculator", desc: "Calculate optimal selling prices based on cost, overhead, and target profit margin." },
              { icon: <Wallet className="w-5 h-5" />, color: "from-teal-500 to-emerald-400", title: "Finance", desc: "Cash flow management with inflow/outflow tracking, balance monitoring, and financial summaries." },
              { icon: <Users className="w-5 h-5" />, color: "from-indigo-500 to-purple-400", title: "Customers", desc: "Build and manage your customer database with contact details and notes." },
              { icon: <FileText className="w-5 h-5" />, color: "from-blue-500 to-indigo-400", title: "Invoices", desc: "Create fully customizable invoices with business branding, logo upload, and e-signature pad. Draw your signature with mouse or touch." },
              { icon: <FileSearchIcon className="w-5 h-5" />, color: "from-cyan-500 to-blue-400", title: "Receipts", desc: "View and search all receipts with detailed line items and payment status." },
              { icon: <Target className="w-5 h-5" />, color: "from-purple-500 to-pink-400", title: "Targets", desc: "Set business goals with progress tracking, target values, and status monitoring." },
              { icon: <Database className="w-5 h-5" />, color: "from-gray-500 to-slate-400", title: "Records", desc: "Yearly record keeping with search, filter by type, and comprehensive data management." },
              // HR Management System cards
              { icon: <Users className="w-5 h-5" />, color: "from-cyan-500 to-blue-500", title: "HR Dashboard", desc: "Overview of employee count, attendance stats, pending leaves, late arrivals, and upcoming payroll." },
              { icon: <Users className="w-5 h-5" />, color: "from-teal-500 to-emerald-400", title: "Employees", desc: "Manage employee profiles with roles, status, contact details, employment history, daily rate, and shift assignment." },
              { icon: <ClipboardList className="w-5 h-5" />, color: "from-amber-500 to-orange-400", title: "Attendance", desc: "Track daily attendance with time-in/time-out, auto-computed tardiness vs schedule, overtime, and hours worked." },
              { icon: <FileText className="w-5 h-5" />, color: "from-rose-500 to-pink-400", title: "Leave Management", desc: "Manage leave types (sick, vacation, emergency), approve/reject requests, and track balances." },
              { icon: <Calendar className="w-5 h-5" />, color: "from-purple-500 to-violet-400", title: "Shift Roster", desc: "Create shift templates with break management, grace period. Assign to employees — auto-syncs to attendance & payroll." },
              { icon: <Smartphone className="w-5 h-5" />, color: "from-indigo-500 to-purple-500", title: "Employee Portal", desc: "Self-service portal for employees to clock in/out, view schedules, track attendance, and submit leave requests." },
              { icon: <Target className="w-5 h-5" />, color: "from-blue-500 to-indigo-400", title: "Performance", desc: "Track employee performance reviews, ratings, and feedback over time." },
              { icon: <DollarSign className="w-5 h-5" />, color: "from-emerald-500 to-teal-400", title: "Payroll Engine", desc: "Generate automated payslips with attendance-based computation, deductions, and net pay breakdown." },
              { icon: <Crown className="w-5 h-5" />, color: "from-amber-500 to-yellow-400", title: "Bonuses", desc: "Manage employee bonuses with types, amounts, and payout scheduling." },
              { icon: <Building2 className="w-5 h-5" />, color: "from-gray-500 to-slate-400", title: "Company Setup", desc: "Configure company info, offices, departments, designations, and interactive organizational chart." },
            ].map((tool, i) => (
              <AnimatedSection key={i} delay={i * 60} direction="up">
                <div className="group bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-11 h-11 bg-gradient-to-r ${tool.color} rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform shadow-sm`}>
                    {tool.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1.5 text-sm">{tool.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{tool.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* Inventory System Highlight */}
          <AnimatedSection delay={150} direction="up">
            <div className="mt-12 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 border border-emerald-200 shadow-sm">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                    <ClipboardList className="w-3 h-3" /> Featured Module
                  </div>
                  <h3 className="text-2xl font-extrabold text-gray-900 mb-3">Inventory Management System</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    A complete inventory solution for small to medium businesses. Track stock levels,
                    record movements, monitor daily sales, and get low-stock alerts — all in one place.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Product Catalog", desc: "SKU, pricing, cost tracking" },
                      { label: "Stock Movements", desc: "Stock-in / stock-out records" },
                      { label: "Daily Sold", desc: "Track daily sales & revenue" },
                      { label: "Low Stock Alerts", desc: "Get notified when stock runs low" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 max-w-sm">
                  <div className="bg-white rounded-2xl p-5 shadow-lg border border-emerald-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-sm text-gray-800">Stock Overview</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Live</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: "Rice (50kg)", qty: 24, max: 50, color: "bg-emerald-500" },
                        { name: "Cooking Oil (1L)", qty: 12, max: 30, color: "bg-amber-500" },
                        { name: "Sardines (cans)", qty: 3, max: 40, color: "bg-red-500" },
                        { name: "Coffee (3in1)", qty: 8, max: 60, color: "bg-amber-500" },
                      ].map((item, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-gray-700">{item.name}</span>
                            <span className="text-gray-500">{item.qty} / {item.max}</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${item.color} transition-all`} style={{ width: `${(item.qty / item.max) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-red-600 font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> 2 items low stock
                      </span>
                      <span className="text-gray-400">Updated just now</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Invoice Customization Highlight */}
          <AnimatedSection delay={200} direction="up">
            <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-200 shadow-sm">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-1 max-w-sm order-last lg:order-first">
                  <div className="bg-white rounded-2xl p-5 shadow-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-sm text-gray-800">Sample Invoice</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Preview</span>
                    </div>
                    <div className="border-b pb-3 mb-3">
                      <p className="font-bold text-gray-900 text-sm">Your Business Name</p>
                      <p className="text-[10px] text-gray-400">123 Main St., City</p>
                      <p className="text-[10px] text-gray-400">TIN: 123-456-789</p>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span>Item 1</span><span>₱500.00</span></div>
                      <div className="flex justify-between"><span>Item 2</span><span>₱1,200.00</span></div>
                      <div className="flex justify-between border-t pt-1 font-bold"><span>Total</span><span>₱1,700.00</span></div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-6 bg-gray-200 rounded flex items-center justify-center text-[8px] text-gray-400 italic">sig</div>
                        <span className="text-[10px] text-gray-500">Authorized Signature</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                    <FileText className="w-3 h-3" /> New Feature
                  </div>
                  <h3 className="text-2xl font-extrabold text-gray-900 mb-3">Customizable Invoices with E-Signature</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Create professional, fully customizable invoices for your business. Add your
                    business name, logo, address, and TIN. Include your e-signature for authenticity.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Business Branding", desc: "Add your logo, name & address" },
                      { label: "E-Signature", desc: "Sign invoices digitally" },
                      { label: "Custom Items", desc: "Add items with qty & price" },
                      { label: "Status Tracking", desc: "Sent, paid, overdue" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* GCash Cash In/Out Highlight */}
          <AnimatedSection delay={220} direction="up">
            <div className="mt-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 border border-emerald-200 shadow-sm">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                    <Smartphone className="w-3 h-3" /> New Feature — VIP, Pro &amp; Pro+
                  </div>
                  <h3 className="text-2xl font-extrabold text-gray-900 mb-3">GCash Cash In/Out Tracker</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    A dedicated module for sari-sari stores and small businesses to track digital wallet
                    and physical cash balances side by side. Log cash in/out transactions, monitor float
                    replenishments, and reconcile daily — all in one place.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Dual-Balance Tracking", desc: "Digital wallet + physical cash drawer" },
                      { label: "Cash In / Cash Out", desc: "Log transactions with reference numbers" },
                      { label: "Float Replenishment", desc: "Track GCash float top-ups" },
                      { label: "Daily Reconciliation", desc: "Snap & verify balances daily" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 max-w-sm">
                  <div className="bg-white rounded-2xl p-5 shadow-lg border border-emerald-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-sm text-gray-800">Balance Overview</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Live</span>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                        <p className="text-xs text-gray-500 mb-1">GCash Digital Wallet</p>
                        <p className="text-2xl font-extrabold text-emerald-700">₱12,450.00</p>
                      </div>
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                        <p className="text-xs text-gray-500 mb-1">Physical Cash Drawer</p>
                        <p className="text-2xl font-extrabold text-amber-700">₱8,230.00</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Last reconciled: Today</span>
                        <span className="text-emerald-600 font-semibold">Balanced ✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={250} direction="up">
            <div className="mt-10 text-center">
              <div className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl shadow-sm">
                <Crown className="w-5 h-5 text-amber-600" />
                <p className="text-sm text-gray-700">
                  <strong className="text-amber-700">Business Management System</strong> (standalone ₱999/mo) and <strong className="text-cyan-700">HR Management System</strong> (standalone ₱999/mo) are available as add-ons or included in paid plans.{' '}
                  <strong>Pro (1 BMS user)</strong> · <strong>Pro Plus (3 BMS users + HR included)</strong> · <strong>VIP (5 BMS users + HR included)</strong>
                  {' — '}
                  <a href="https://www.facebook.com/bcsocialmediaservices" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-semibold hover:text-indigo-700 underline">Request access →</a>
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Plans Section */}
      <section ref={plansRef} id="plans" className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
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
                  "BMS Access: 0 users",
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
                  "GCash Cash In/Out Tracker",
                  "Priority live chat support",
                  "BMS Access: 1 user",
                  "Subject to fair usage policy",
                ],
              },
              {
                name: "Pro Plus",
                price: "1,499",
                period: "/month",
                icon: Sparkles,
                gradient: "from-rose-500 to-pink-600",
                popular: true,
                features: [
                  "500 generations per month",
                  "Sales Wizard, FB Ads Targeting, Image Ad Analyzer & Ad Analyzer",
                  "Sales Report — unlimited & free",
                  "Invoice Generator — unlimited & free",
                  "GCash Cash In/Out Tracker",
                  "HR Management System — included",
                  "Priority live chat support",
                  "BMS Access: 3 users",
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
                  "GCash Cash In/Out Tracker",
                  "Dedicated live chat support",
                  "BMS Access: 5 users",
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

          {/* Standalone Add-ons */}
          <AnimatedSection delay={600} direction="up">
            <div className="mt-16">
              <div className="text-center mb-10">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" /> Standalone Add-ons
                </span>
                <h2 className="text-3xl font-extrabold text-gray-900 mt-4">Need Only One Feature?</h2>
                <p className="text-gray-500 mt-3 max-w-xl mx-auto">
                  Subscribe to individual features without upgrading your entire plan.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {/* GCash Standalone */}
                <div className="relative bg-white rounded-3xl p-6 border-2 border-emerald-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                    <Smartphone className="w-3 h-3" />
                    Add-on
                  </div>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Smartphone className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-900">GCash Cash In/Out</h3>
                    <p className="text-sm text-gray-500 mt-1">Digital wallet + physical cash tracker</p>
                    <div className="flex items-baseline justify-center gap-1 mt-4">
                      <span className="text-sm text-gray-400">PHP</span>
                      <span className="text-5xl font-extrabold text-gray-900">299</span>
                      <span className="text-sm text-gray-400">/month</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      <span className="line-through text-gray-300">₱699</span>
                      <span className="text-emerald-600 font-semibold ml-1">Was ₱699</span>
                    </p>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {[
                      'Dual-balance tracking (digital + physical)',
                      'Cash In / Cash Out logging with reference numbers',
                      'Float replenishment tracking',
                      'Daily reconciliation with snap verification',
                      'Transaction history & search',
                    ].map((f, j) => (
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
                  <Link
                    to="/auth"
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-center flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md"
                  >
                    Subscribe Now <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* BMS Standalone */}
                <div className="relative bg-white rounded-3xl p-6 border-2 border-violet-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Add-on
                  </div>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-900">Business Management</h3>
                    <p className="text-sm text-gray-500 mt-1">Complete business operations suite</p>
                    <div className="flex items-baseline justify-center gap-1 mt-4">
                      <span className="text-sm text-gray-400">PHP</span>
                      <span className="text-5xl font-extrabold text-gray-900">999</span>
                      <span className="text-sm text-gray-400">/month</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      <span className="line-through text-gray-300">₱3,000</span>
                      <span className="text-emerald-600 font-semibold ml-1">Save 67%</span>
                    </p>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {[
                      'Products, Inventory & Sales Tracker',
                      'Expenses, Pricing Calculator & Finance',
                      'Customers, Invoices & Receipts',
                      'Targets, Records & Team Management',
                      'Team & Employee Management',
                    ].map((f, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm text-gray-700">
                        <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/auth"
                    className="w-full py-3 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-xl font-bold text-center flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md"
                  >
                    Subscribe Now <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* HR Standalone */}
                <div className="relative bg-white rounded-3xl p-6 border-2 border-cyan-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Add-on
                  </div>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-900">HR Management</h3>
                    <p className="text-sm text-gray-500 mt-1">Complete HR operations suite</p>
                    <div className="flex items-baseline justify-center gap-1 mt-4">
                      <span className="text-sm text-gray-400">PHP</span>
                      <span className="text-5xl font-extrabold text-gray-900">999</span>
                      <span className="text-sm text-gray-400">/month</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      <span className="line-through text-gray-300">₱3,000</span>
                      <span className="text-emerald-600 font-semibold ml-1">Save 67%</span>
                    </p>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {[
                      'Employee profiles & management',
                      'Attendance tracking & corrections',
                      'Leave management with types',
                      'Shift roster & scheduling',
                      'Payroll engine with payslip generator',
                    ].map((f, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm text-gray-700">
                        <div className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/auth"
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold text-center flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md"
                  >
                    Subscribe Now <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <p className="text-center text-xs text-gray-400 mt-6">
                Standalone add-ons can be added to any plan. Contact us via Facebook to activate.
              </p>
            </div>
          </AnimatedSection>

          {/* What Happens Next — 1-2-3 Steps */}
          <AnimatedSection delay={500} direction="up">
            <div className="mt-12 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
              <h3 className="text-xl font-extrabold text-gray-900 text-center mb-8">What Happens After You Upgrade?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    step: "1",
                    title: "Secure Payment",
                    desc: "Pay securely via GCash or GoTyme. Your payment confirms your order. After payment, your BC AI Marketing Tool account will update within 12 hours.",
                    color: "bg-emerald-500",
                  },
                  {
                    step: "2",
                    title: "Account Activated",
                    desc: "Once payment is confirmed, your account is upgraded automatically. You'll get full access to all the features included in your plan.",
                    color: "bg-amber-500",
                  },
                  {
                    step: "3",
                    title: "Start Using Tools",
                    desc: "Log in and start using your upgraded tools immediately — AI marketing tools, GCash tracker, BMS, and more.",
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
                    a: "We accept GCash and GoTyme for account activation and upgrades. All prices are in Philippine Pesos (PHP).",
                  },
                  {
                    q: "Where will I receive my images or video?",
                    a: "All delivered content appears in the My Assets tab inside your account. You can view and download your files anytime from there.",
                  },
                  {
                    q: "Can I cancel after payment?",
                    a: "If we haven't started working on your order yet, we can process a full refund. Once work has begun, cancellations are handled on a case-by-case basis. Message us on Facebook for assistance.",
                  },
                  {
                    q: "When will my account be activated after payment?",
                    a: "After your payment is confirmed, your BC AI Marketing Tool account will update within 12 hours. You'll then have full access to your upgraded plan features.",
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
                <strong>Need product images or video ads?</strong> We now offer these as a separate service.{' '}
                <a
                  href="https://www.facebook.com/bcsocialmediaservices"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-600 font-semibold hover:text-rose-700 underline"
                >
                  Message us on Facebook
                </a>
                {' '}for details on our creative services package.
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
              { num: "02", title: "Choose Your Tool", desc: "Pick from 20+ powerful tools — AI marketing tools, Sales Report, Invoices, Business Management System, and HR Management System.", color: "bg-purple-500" },
              { num: "03", title: "Get Results", desc: "Personas, keywords, ad analysis, invoices, sales reports, business insights, and AI-generated copy — instantly.", color: "bg-emerald-500" },
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

      {/* Affiliate Program Section */}
      <section id="affiliate" className="py-24 px-4 bg-gradient-to-b from-amber-50 via-orange-50 to-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <DollarSign className="w-3 h-3" /> Earn with Us
              </span>
              <h2 className="text-4xl font-extrabold text-gray-900 mt-4">BC AI Affiliate Program</h2>
              <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
                Turn your network into recurring income. Share BC AI with fellow entrepreneurs and earn <strong className="text-amber-700">30% recurring monthly commission</strong> on every paying customer you refer — for life.
              </p>
            </div>
          </AnimatedSection>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
            {[
              { value: "30%", label: "Recurring Commission", color: "from-amber-500 to-orange-500" },
              { value: "Ongoing", label: "Attribution Period", color: "from-emerald-500 to-teal-500" },
              { value: "30 Days", label: "Commission Lock Period", color: "from-blue-500 to-cyan-500" },
              { value: "1-2 Days", label: "Payout After Approval", color: "from-purple-500 to-violet-500" },
            ].map((stat, i) => (
              <AnimatedSection key={i} delay={i * 100} direction="up">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className={`inline-flex bg-gradient-to-r ${stat.color} bg-clip-text`}>
                    <span className="text-3xl font-extrabold text-transparent">{stat.value}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 font-medium">{stat.label}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* How It Works */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
            {[
              {
                step: "1",
                title: "Sign Up & Get Your Link",
                desc: "Create your free BC AI account, then activate your affiliate dashboard. You'll get a unique referral link to share anywhere.",
                color: "bg-amber-500",
                icon: <Link2 className="w-6 h-6" />,
              },
              {
                step: "2",
                title: "Share with Your Network",
                desc: "Share your link on social media, in Facebook groups, or with fellow business owners. When they sign up for a paid plan, you earn.",
                color: "bg-emerald-500",
                icon: <Share2 className="w-6 h-6" />,
              },
              {
                step: "3",
                title: "Earn 30% Every Month",
                desc: "You earn 30% of every monthly payment your referred users make — for as long as they stay subscribed. No cap on earnings.",
                color: "bg-purple-500",
                icon: <TrendingUp className="w-6 h-6" />,
              },
            ].map((step, i) => (
              <AnimatedSection key={i} delay={i * 120} direction="up">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center">
                  <div className={`w-14 h-14 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    {step.icon}
                  </div>
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full mb-3">
                    <span className="text-xs font-bold text-gray-600">{step.step}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* Commission Breakdown Card */}
          <AnimatedSection delay={200} direction="up">
            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-8 md:p-10 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-[80px] translate-x-1/3 -translate-y-1/3" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-300/20 rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3" />
              
              <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-extrabold text-white mb-4">How Much Can You Earn?</h3>
                  <div className="space-y-4">
                    {[
                      { refs: "1 referral", earn: "₱150", plan: "Pro (₱499/mo)" },
                      { refs: "5 referrals", earn: "₱1,500", plan: "Pro (₱499/mo each)" },
                      { refs: "10 referrals", earn: "₱3,000", plan: "Pro (₱499/mo each)" },
                      { refs: "10 referrals", earn: "₱3,000", plan: "Pro Plus (₱1,499/mo each)" },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/15 backdrop-blur rounded-xl px-4 py-3 border border-white/20">
                        <div>
                          <p className="text-white font-semibold text-sm">{row.refs}</p>
                          <p className="text-white/70 text-xs">{row.plan}</p>
                        </div>
                        <span className="text-white font-extrabold text-lg">{row.earn}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-amber-200" /> Key Benefits
                  </h4>
                  <ul className="space-y-3">
                    {[
                      "30% recurring monthly commission — no cap",
                      "Ongoing attribution for every user you refer",
                      "30-day safety lock to protect against fraud",
                      "Payouts sent within 1–2 business days after approval",
                      "Track all referrals & earnings from your dashboard",
                      "No minimum payout threshold",
                    ].map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/90">
                        <CheckCircle2 className="w-4 h-4 text-amber-200 flex-shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* CTA */}
          <AnimatedSection delay={300} direction="up">
            <div className="mt-10 text-center">
              <p className="text-sm text-gray-500 mb-4 max-w-lg mx-auto">
                You need a BC AI account to join the affiliate program. Sign up free, then activate your affiliate dashboard from your account settings.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-amber-200"
                >
                  Sign Up & Start Earning <DollarSign className="w-5 h-5" />
                </Link>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-amber-200 text-amber-700 rounded-xl font-bold text-lg hover:bg-amber-50 transition-all"
                >
                  Already a Member? Log In <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </AnimatedSection>
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
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Ready to Supercharge Your Business?</h2>
              <p className="text-blue-100 mb-8 max-w-md mx-auto">Sign up for free and get access to AI marketing tools, sales reports, and invoice generator with e-signature. Business Management System and HR Management System access is granted per user upon request — Pro (1 BMS user), Pro Plus (3 BMS users + HR included), VIP (5 BMS users + HR included). No credit card needed.</p>
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
              <p className="text-sm text-gray-400 mt-1">Last Updated: May 18, 2026</p>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm space-y-6 text-sm text-gray-600 leading-relaxed">
              <p className="font-medium text-gray-800">
                Welcome to BC Social Media Services (the "Website," "Platform," "Service," "we," "us," or "our"), available at{" "}
                <a href="https://bcsocialmediaservices.online/" className="text-indigo-600 hover:underline font-medium">https://bcsocialmediaservices.online/</a>.
              </p>
              <p>
                Please read these Terms and Conditions ("Terms") carefully before using our website, platform, software, or enrolling in our Affiliate Program. By accessing or using any part of the Service, you ("User," "Client," or "Affiliate") agree to be bound by these Terms. If you do not agree to all of these Terms, you may not access the Website or use our services.
              </p>

              <div>
                <h3 className="font-bold text-gray-900 text-base mb-2">1. Acceptance & Eligibility</h3>
                <p>By using this Website, you represent and warrant that you are at least 18 years of age and possess the legal capacity to enter into a binding agreement. If you are using our Service on behalf of a business or entity, you represent that you have the authority to bind that entity to these Terms.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-base mb-2">2. Services & Subscriptions</h3>
                <p><strong>Account Creation:</strong> To access certain software tools or features, you must create an account. You are responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account.</p>
                <p className="mt-2"><strong>Pricing and Payments:</strong> All subscription plans, digital services, and transaction processing are handled securely. You agree to provide accurate, current, and complete billing information.</p>
                <p className="mt-2"><strong>Subscription Renewal:</strong> Subscriptions automatically renew at the end of each billing cycle (monthly or annually) unless canceled by the user prior to the renewal date via your account dashboard.</p>
                <p className="mt-2"><strong>Cancellation and Refunds:</strong> Users can cancel their subscriptions at any time. Refunds are governed by our standard refund policy window, which is subject to internal audit to prevent platform and API credit abuse.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-base mb-2">3. Prohibited Uses</h3>
                <p>You agree not to use the Website, software, or services to:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Violate any local, national, or international laws or regulations.</li>
                  <li>Upload, post, or transmit fraudulent, deceptive, or malicious code, scripts, or automated bots.</li>
                  <li>Reverse engineer, decompile, or attempt to extract the source code of any software hosted on the Vercel, Node.js, or Supabase infrastructure powering the Platform.</li>
                  <li>Circumvent or attempt to abuse the API quotas, database thresholds, or storage limits of the Service.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-base mb-2">4. Intellectual Property Rights</h3>
                <p>All content, branding, user interfaces, code, databases, graphics, layout, and software tools available on <a href="https://bcsocialmediaservices.online/" className="text-indigo-600 hover:underline font-medium">https://bcsocialmediaservices.online/</a> are the exclusive intellectual property of BC Social Media Services or its licensors. You are granted a limited, non-transferable, revocable license to access the platform strictly for personal or business marketing operations in accordance with your subscription plan.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-base mb-2">5. Affiliate Program Terms</h3>
                <p>By registering as an Affiliate, you agree to the following program rules:</p>
                <div className="mt-2 space-y-2">
                  <p><strong>Commission Structure:</strong> Affiliates earn a flat 30% recurring monthly commission for every valid, paying customer referred through their unique affiliate link.</p>
                  <p><strong>Ongoing Attribution:</strong> The 30% commission applies to all successful, subsequent monthly subscription payments made by the referred user for as long as their subscription remains active. If the referred customer cancels, downgrades, churns, or receives a refund, affiliate commissions for that user will cease immediately.</p>
                  <p><strong>30-Day Commission Lock (Safety Window):</strong> To mitigate credit card fraud, processing errors, and user refunds, all generated commissions are held in a "Pending" status for a mandatory 30-day buffer period from the date of the user's initial payment.</p>
                  <p><strong>Payout Eligibility:</strong> Commissions only become eligible for withdrawal or payout once the 30-day lock period has cleared and the status updates to "Eligible". Payout cycles are executed monthly for all amounts clearing the threshold. After approval, payouts are sent within 1–2 business days.</p>
                  <div>
                    <p className="font-semibold text-gray-800">Prohibited Marketing Methods:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Affiliates may not engage in "Self-Referrals" (signing up for a paid plan using your own affiliate link).</li>
                      <li>Affiliates may not use spam emails, misleading advertisements, or cookie-stuffing tactics.</li>
                      <li>Affiliates may not bid on branded PPC keywords (e.g., Google Ads targeting "BC Social Media Services") without prior written consent.</li>
                    </ul>
                  </div>
                  <p><strong>Termination of Affiliate Account:</strong> We reserve the right to investigate, reject, or void commissions, and permanently ban any affiliate who violates these guidelines or attempts to abuse the tracking system.</p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-base mb-2">6. Disclaimer of Warranties</h3>
                <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis. BC Social Media Services makes no warranties, expressed or implied, regarding the continuous, error-free, or uninterrupted operation of its serverless databases, edge functions, or hosting nodes. We are not liable for transient system downtimes, external API disruptions, or data syncing delays.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-base mb-2">7. Limitation of Liability</h3>
                <p>To the maximum extent permitted by applicable law, in no event shall BC Social Media Services, its founders, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses resulting from your access to or inability to use the platform. Our total cumulative liability shall not exceed the amount you paid us in the preceding three (3) months.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-base mb-2">8. Modifications to Terms</h3>
                <p>We reserve the right, at our sole discretion, to modify, update, or replace these Terms and Conditions at any time. When updates occur, the "Last Updated" date at the top of this document will change. Continued use of the platform or enrollment in the affiliate program after modifications constitute your acceptance of the revised Terms.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-base mb-2">9. Contact Information</h3>
                <p>If you have any questions, concerns, or requests regarding these Terms and Conditions or the Affiliate Program, please contact us directly via the support channels listed on our official domain:</p>
                <p className="mt-1">Website: <a href="https://bcsocialmediaservices.online/" className="text-indigo-600 hover:underline font-medium">https://bcsocialmediaservices.online/</a></p>
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
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">BC AI Business Solutions</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-400">
              <a href="#tools" className="hover:text-white transition-colors">Tools</a>
              <a href="#plans" className="hover:text-white transition-colors">Plans</a>
              <a href="#affiliate" className="hover:text-white transition-colors">Affiliate</a>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/about" className="hover:text-white transition-colors">About</Link>
              <Link to="/knowledge-base" className="hover:text-white transition-colors">Knowledge Base</Link>
              <Link to="/tutorial" className="hover:text-white transition-colors">Tutorial</Link>
              <Link to="/auth" className="hover:text-white transition-colors">Sign Up</Link>
            </div>
            <p className="text-xs text-gray-600 text-center">2026 BC AI Business Solutions. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
