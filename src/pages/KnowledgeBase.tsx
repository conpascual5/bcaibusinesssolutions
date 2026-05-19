import { Link } from 'react-router';
import { ArrowLeft, Sparkles, ChevronRight, Search, BookOpen, Wand2, BarChart3, Target, Eye, FileSearch, FileText, Smartphone, Building2, Package, Library, Users, Crown } from 'lucide-react';
import { useState } from 'react';
import AnimatedSection from '@/components/AnimatedSection';

interface KBEntry {
  id: string;
  title: string;
  description: string;
  category: string;
  path: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  sections: { heading: string; content: string }[];
}

const entries: KBEntry[] = [
  {
    id: "sales-wizard",
    title: "Sales Wizard",
    description: "Generate AI-powered sales messages using 20+ proven frameworks.",
    category: "AI Tools",
    path: "/app/sales-wizard",
    icon: <Wand2 className="w-5 h-5" />,
    color: "bg-blue-500",
    gradient: "from-blue-500 to-cyan-400",
    sections: [
      { heading: "What is Sales Wizard?", content: "Sales Wizard is an AI-powered tool that generates persuasive sales messages using over 20 proven copywriting frameworks including AIDA, PAS, BAB, FAB, 4Ps, and more. It supports Taglish, Filipino, and English languages." },
      { heading: "How to Use", content: "1. Select a copywriting framework from the dropdown. 2. Choose your preferred language (English, Taglish, or Filipino). 3. Enter details about your product or service. 4. Click Generate and the AI will create a tailored sales message based on the selected framework." },
      { heading: "Tips", content: "Experiment with different frameworks for the same product to see which resonates best. AIDA works well for general sales, PAS is great for problem-solving products, and BAB is effective for before-and-after transformations." },
    ],
  },
  {
    id: "sales-report",
    title: "Historical Sales Report Tracker",
    description: "Track daily, weekly, monthly, and yearly sales with charts and summaries.",
    category: "Business Tools",
    path: "/app/sales-report",
    icon: <BarChart3 className="w-5 h-5" />,
    color: "bg-rose-500",
    gradient: "from-rose-500 to-pink-400",
    sections: [
      { heading: "What is Sales Report?", content: "A comprehensive sales tracking tool that lets you record and visualize your sales data over time. Import from Excel or add entries manually. View summaries by day, week, month, or year with interactive charts." },
      { heading: "How to Use", content: "1. Go to Sales Report from the sidebar. 2. Add sales entries manually or import from an Excel/CSV file. 3. Use the date filters to view specific periods. 4. Charts automatically update to show trends and summaries." },
      { heading: "Importing Data", content: "You can bulk import sales data from Excel or CSV files. Make sure your file has columns for date, amount, and optionally product name and notes. The system will map and import them automatically." },
    ],
  },
  {
    id: "fb-ads-targeting",
    title: "FB Ads Targeting Generator",
    description: "Generate detailed buyer personas with Facebook targeting keywords.",
    category: "AI Tools",
    path: "/app/fb-ads-targeting",
    icon: <Target className="w-5 h-5" />,
    color: "bg-emerald-500",
    gradient: "from-emerald-500 to-teal-400",
    sections: [
      { heading: "What is FB Ads Targeting?", content: "An AI tool that generates 3 detailed buyer personas complete with demographics, interests, behaviors, and exact Facebook targeting keywords. Choose between Philippines or International markets." },
      { heading: "How to Use", content: "1. Describe your product or service. 2. Select your target market (Philippines or International). 3. Click Generate. 4. The AI will produce 3 distinct buyer personas with specific Facebook ad targeting parameters you can copy directly into Ads Manager." },
      { heading: "Exporting Personas", content: "Each persona includes age range, gender, location, interests, behaviors, and suggested ad copy angles. You can copy the targeting keywords directly into Facebook Ads Manager's detailed targeting section." },
    ],
  },
  {
    id: "image-ad-analyzer",
    title: "Image Ad Analyzer",
    description: "Analyze ad images for psychological triggers and improvement tips.",
    category: "AI Tools",
    path: "/app/image-ad-analyzer",
    icon: <Eye className="w-5 h-5" />,
    color: "bg-violet-500",
    gradient: "from-violet-500 to-purple-400",
    sections: [
      { heading: "What is Image Ad Analyzer?", content: "Upload an ad image and get AI-powered analysis of visual elements, psychological triggers, color psychology, composition, and actionable improvement suggestions." },
      { heading: "How to Use", content: "1. Upload your ad image (JPG, PNG, or WEBP). 2. The AI analyzes the image for visual hierarchy, color usage, emotional triggers, and composition. 3. Receive a detailed report with specific recommendations to improve your ad's effectiveness." },
      { heading: "What Gets Analyzed", content: "The tool examines: color psychology and contrast, visual hierarchy and focal points, emotional triggers, text readability, call-to-action placement, and overall composition. Each area gets a score and specific suggestions." },
    ],
  },
  {
    id: "ad-analyzer",
    title: "Ad Analyzer (Competitor Analysis)",
    description: "Paste competitor ad copy for psychological trigger analysis.",
    category: "AI Tools",
    path: "/app/competitor-analysis",
    icon: <FileSearch className="w-5 h-5" />,
    color: "bg-indigo-500",
    gradient: "from-indigo-500 to-purple-400",
    sections: [
      { heading: "What is Ad Analyzer?", content: "Paste any competitor's ad copy and get AI-powered psychological trigger analysis, counter-positioning strategies, and specific improvement tips to make your ads more effective." },
      { heading: "How to Use", content: "1. Copy your competitor's ad text. 2. Paste it into the analyzer. 3. The AI identifies psychological triggers used (scarcity, social proof, urgency, etc.). 4. Get counter-positioning strategies to differentiate your brand." },
      { heading: "Strategic Value", content: "Understanding competitor tactics helps you position your brand more effectively. The analysis reveals what emotional triggers your competitors are using and suggests ways to counter or outperform them." },
    ],
  },
  {
    id: "invoices",
    title: "Invoice Generator",
    description: "Create professional PDF invoices with itemized billing.",
    category: "Business Tools",
    path: "/app/invoices",
    icon: <FileText className="w-5 h-5" />,
    color: "bg-amber-500",
    gradient: "from-amber-500 to-orange-400",
    sections: [
      { heading: "What is Invoice Generator?", content: "Create professional invoices in seconds. Add your business details, client information, itemized billing, and payment terms. Generate and download PDF invoices instantly." },
      { heading: "How to Use", content: "1. Fill in your business details (name, address, contact info). 2. Add client information. 3. Add line items with descriptions, quantities, and prices. 4. Set payment terms and due date. 5. Preview and download as PDF." },
      { heading: "Invoice Management", content: "All created invoices are saved in your account. You can view, download, or delete them anytime. Track which invoices have been paid and which are still outstanding." },
    ],
  },
  {
    id: "gcash",
    title: "GCash Cash In/Out",
    description: "Track digital wallet, physical cash, and run reconciliations.",
    category: "Business Tools",
    path: "/app/gcash",
    icon: <Smartphone className="w-5 h-5" />,
    color: "bg-blue-500",
    gradient: "from-blue-500 to-teal-400",
    sections: [
      { heading: "What is GCash Cash In/Out?", content: "A dual-balance tracking system for businesses that accept GCash payments. Monitor your digital wallet balance alongside physical cash in the drawer. Log cash in/out transactions, float replenishments, and run end-of-day reconciliations." },
      { heading: "Recording Transactions", content: "1. Click 'New Transaction' to log a cash in or cash out. 2. Enter the amount, fee (if any), reference number, and customer name. 3. Mark as paid or unpaid (utang). 4. Transactions appear in the log with verification status." },
      { heading: "End-of-Day Reconciliation", content: "At the end of each day, click 'New Reconciliation'. Enter your actual digital wallet balance and physical cash drawer amount. The system automatically calculates expected balances based on the day's transactions and flags any variances (short/over)." },
      { heading: "Managing Unpaid (Utang)", content: "Transactions marked as 'unpaid' are highlighted in red. You can toggle payment status by clicking the badge. The unpaid total is shown in the summary cards for easy tracking." },
      { heading: "Float Replenishment", content: "When you add cash to your GCash wallet (e.g., via 7-Eleven or bank transfer), log it as a 'Float Replenish'. This updates the expected digital balance calculation for accurate reconciliation." },
      { heading: "Pricing", content: "GCash Cash In/Out is available as a standalone add-on for ₱999/month (was ₱699/month). It's also included in Pro (₱499/month), Pro Plus (₱1,499/month), and VIP plans." },
    ],
  },
  {
    id: "bms",
    title: "Business Management System",
    description: "Full suite of business trackers: products, inventory, sales, expenses, and more.",
    category: "Business Tools",
    path: "/app/business",
    icon: <Building2 className="w-5 h-5" />,
    color: "bg-indigo-500",
    gradient: "from-indigo-500 to-purple-500",
    sections: [
      { heading: "What is BMS?", content: "The Business Management System is a comprehensive suite of 16+ trackers covering products, inventory, sales, expenses, pricing, finance, customers, invoices, receipts, targets, records, team management, and HR (employees, attendance, leave management)." },
      { heading: "Getting Started", content: "Access BMS from the sidebar under 'Business Management'. If you don't see it, contact the admin to request access. Once granted, you'll see the Biz Dashboard with an overview of all your business metrics." },
      { heading: "Key Modules", content: "Products: Manage your product catalog. Inventory: Track stock levels. Sales: Log daily sales. Expenses: Record business expenses. Pricing: Calculate optimal prices. Finance: View profit/loss. Customers: Manage client list. HR: Employees, attendance, and leave management." },
      { heading: "Pricing", content: "BMS is available as a standalone add-on for ₱999/month. It's also included in Pro (₱499/month, 1 user), Pro Plus (₱1,499/month, 3 users), and VIP (exclusive, 5 users) plans. Access is granted per user upon request." },
      { heading: "Team Collaboration", content: "Business owners can add team members who can view and manage business data. Team members see a banner indicating they're viewing the owner's data. Access is controlled through the Team module." },
    ],
  },
  {
    id: "hr-management",
    title: "HR Management System",
    description: "Complete HR operations suite — employees, attendance, leave, shift roster, payroll, and more.",
    category: "Business Tools",
    path: "/app/hr",
    icon: <Users className="w-5 h-5" />,
    color: "bg-cyan-500",
    gradient: "from-cyan-500 to-blue-500",
    sections: [
      { heading: "What is HR Management System?", content: "A standalone HR operations suite covering employee profiles, attendance tracking, leave management, shift roster scheduling, performance reviews, payroll engine with bonuses, and company/office/department/designation management. Available as a standalone add-on (₱999/month) or included in Pro Plus (₱1,499/month) and VIP plans." },
      { heading: "Getting Started", content: "Access HR Management from the sidebar under 'HR Management'. Pro Plus and VIP users automatically get access. Free and Pro users can subscribe to the standalone HR add-on for ₱999/month. Once inside, you'll see the HR Dashboard with an overview of all HR metrics." },
      { heading: "Key Modules", content: "Employees: Manage employee profiles with roles and status. Attendance: Track daily attendance with time-in/time-out. Leave: Manage leave requests with different leave types. Shift Roster: Create and assign shift schedules. Corrections: Handle attendance corrections. Performance: Track employee performance reviews. Payroll: Generate payroll with bonuses and deductions." },
      { heading: "Pricing", content: "Standalone HR Management is ₱999/month as an add-on to any plan. It's included free with Pro Plus (₱1,499/month) and VIP plans. Contact us via Facebook to activate the standalone add-on." },
    ],
  },
  {
    id: "my-assets",
    title: "My Assets",
    description: "Store and manage your digital assets and files.",
    category: "Account",
    path: "/app/my-assets",
    icon: <Package className="w-5 h-5" />,
    color: "bg-teal-500",
    gradient: "from-teal-500 to-emerald-400",
    sections: [
      { heading: "What is My Assets?", content: "A centralized storage for your digital assets including images, documents, and files. Upload, organize, and access your assets anytime." },
      { heading: "How to Use", content: "1. Go to My Assets from the sidebar. 2. Upload files by clicking the upload button. 3. Files are stored securely and can be downloaded anytime. 4. Use assets across different tools within the app." },
    ],
  },
  {
    id: "library",
    title: "Library",
    description: "Browse saved content, templates, and resources.",
    category: "Account",
    path: "/library",
    icon: <Library className="w-5 h-5" />,
    color: "bg-cyan-500",
    gradient: "from-cyan-500 to-blue-400",
    sections: [
      { heading: "What is Library?", content: "Your personal library of saved content, templates, and resources generated from various tools. Access everything you've created in one place." },
      { heading: "How to Use", content: "Navigate to Library from the sidebar. Browse your saved items by category or search for specific content. Click any item to view or reuse it." },
    ],
  },
];

const categories = ["All", "AI Tools", "Business Tools", "Account"];

export default function KnowledgeBase() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = entries.filter(e => {
    const matchesSearch = search === "" ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.sections.some(s => s.content.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = activeCategory === "All" || e.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-gray-900">Knowledge Base</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        {/* Hero */}
        <AnimatedSection>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              <BookOpen className="w-3 h-3" /> Complete Guide
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
              How to Use BC AI
            </h1>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Everything you need to know about every feature. Search, browse by category, or dive into detailed guides.
            </p>
          </div>
        </AnimatedSection>

        {/* Search & Filters */}
        <AnimatedSection delay={100}>
          <div className="mb-10 space-y-4">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search the knowledge base..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all ${
                    activeCategory === cat
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">No results found</p>
            <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filtered.map((entry, i) => (
              <AnimatedSection key={entry.id} delay={i * 100} direction="up">
                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6 sm:p-8">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-6">
                      <div className={`w-12 h-12 bg-gradient-to-r ${entry.gradient} rounded-xl flex items-center justify-center text-white shadow-sm shrink-0`}>
                        {entry.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-xl font-extrabold text-gray-900">{entry.title}</h2>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            entry.category === "AI Tools" ? "bg-blue-100 text-blue-700" :
                            entry.category === "Business Tools" ? "bg-emerald-100 text-emerald-700" :
                            "bg-purple-100 text-purple-700"
                          }`}>
                            {entry.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{entry.description}</p>
                      </div>
                    </div>

                    {/* Sections */}
                    <div className="space-y-4">
                      {entry.sections.map((section, si) => (
                        <div key={si}>
                          <h3 className="text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${entry.gradient}`} />
                            {section.heading}
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed ml-3.5">
                            {section.content}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <Link
                        to={entry.path}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        Open {entry.title} <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        )}

        {/* CTA */}
        <AnimatedSection delay={500} direction="up">
          <div className="mt-16 text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-10 sm:p-12 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/30 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/30 rounded-full blur-[80px]" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                Still Have Questions?
              </h2>
              <p className="text-indigo-100 mb-6 max-w-md mx-auto text-sm">
                Watch our video tutorials for step-by-step walkthroughs of each feature.
              </p>
              <Link
                to="/tutorial"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl"
              >
                Watch Tutorials <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">BC AI Business Solutions</span>
          </div>
          <p className="text-xs text-gray-600">2026 BC AI Business Solutions. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
