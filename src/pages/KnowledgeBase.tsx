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
      { heading: "Pricing", content: "GCash Cash In/Out is available as a standalone add-on for ₱299/month (was ₱699/month). It's also included in Pro (₱499/month), Pro Plus (₱1,499/month), and VIP plans." },
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
      { heading: "Pricing", content: "BMS is available as a standalone add-on for ₱999/month. It's also included in Pro (₱499/month, 1 user), Pro Plus (₱1,499/month, 3 users), and VIP (exclusive, 5 users) plans. Access is granted per user upon request. HR Management System is ₱999/month for up to 10 users (₱69/month per additional user)." },
      { heading: "Team Collaboration", content: "Business owners can add team members who can view and manage business data. Team members see a banner indicating they're viewing the owner's data. Access is controlled through the Team module." },
    ],
  },
  {
    id: "hr-management",
    title: "HR Management System",
    description: "Complete HR operations suite — employees, attendance, leave, shift roster, payroll, employee portal, and more.",
    category: "Business Tools",
    path: "/app/hr",
    icon: <Users className="w-5 h-5" />,
    color: "bg-cyan-500",
    gradient: "from-cyan-500 to-blue-500",
    sections: [
      { heading: "What is HR Management System?", content: "A standalone HR operations suite covering employee profiles, attendance tracking, leave management, shift roster scheduling, performance reviews, payroll engine with bonuses, company/office/department/designation management, and a dedicated Employee Portal for clock in/out and leave requests. Available as a standalone add-on (₱999/month for up to 10 users, ₱69/month per additional user) or included in Pro Plus (₱1,499/month) and VIP plans." },
      { heading: "Getting Started", content: "Access HR Management from the sidebar under 'HR Management'. Pro Plus and VIP users automatically get access. Free and Pro users can subscribe to the standalone HR add-on for ₱999/month (up to 10 users, ₱69/month per additional user). Once inside, you'll see the HR Dashboard with an overview of all HR metrics." },
      { heading: "Key Modules", content: "Employees: Manage employee profiles with roles and status. Attendance: Track daily attendance with time-in/time-out. Leave: Manage leave requests with different leave types. Shift Roster: Create and assign shift schedules — auto-syncs to attendance & payroll. Corrections: Handle attendance corrections. Performance: Track employee performance reviews. Payroll Engine: Generate automated payslips with attendance-based computation, deductions, and net pay breakdown. Employee Portal: Self-service portal for employees to clock in/out, view schedules, and submit leave requests." },
      { heading: "Company Setup", content: "Configure your organization structure: Company info (name, logo, address, TIN, SSS/PhilHealth/Pag-IBIG numbers), Offices (branches/locations), Departments (group employees by function), Designations (job titles/ranks), and an interactive Org Chart that visualizes your entire hierarchy." },
      { heading: "Employee Management", content: "Add and manage employee profiles with full details: first/last name, email, phone, position, department, designation, employment type (regular, probationary, contractual, part-time), daily rate, shift assignment, hire date, and status (active/inactive). Each employee can be linked to a Supabase auth account for portal access." },
      { heading: "Attendance Tracking", content: "Log daily attendance with time-in/time-out. The system auto-computes hours worked (accounting for lunch breaks), overtime hours, and tardiness minutes by comparing actual clock-in time against the employee's scheduled shift start time plus grace period. Supports statuses: present, late, absent, leave, half-day. View attendance filtered by payroll period." },
      { heading: "Shift Roster & Scheduling", content: "Create shift templates with name, start/end time, grace period, break schedule (break start/end, paid/unpaid), and description. Assign shifts to employees with effective dates. Assignments auto-sync to hr_employee_schedules (per day-of-week) which feeds into attendance tardiness computation and payroll." },
      { heading: "Leave Management", content: "Configure leave types (Sick Leave, Vacation Leave, Emergency Leave, etc.) with codes, allowed days, and descriptions. Employees can submit leave requests through the Employee Portal. Business owners can view, approve, or reject pending requests from the Leave Management page." },
      { heading: "Payroll Engine", content: "A complete payslip generation system that connects employee profiles, daily attendance, work schedules, payroll periods, and deductions. Automatically computes gross pay, deductions, and net pay for each employee based on their daily rate and attendance records. Supports fixed and percentage-based deductions." },
      { heading: "Performance Reviews", content: "Track employee performance with review entries including rating (1-5), review date, reviewer, and notes. View performance history per employee over time." },
      { heading: "Bonuses", content: "Manage employee bonuses with type (13th month, performance bonus, Christmas bonus, etc.), amount, and payout status." },
      { heading: "Attendance Corrections", content: "Handle attendance discrepancies by correcting time-in, time-out, status, and notes for any past attendance record." },
      { heading: "Pricing", content: "Standalone HR Management is ₱999/month for up to 10 users, with ₱69/month per additional user beyond 10. It's included free with Pro Plus (₱1,499/month) and VIP plans. Contact us via Facebook to activate the standalone add-on." },
    ],
  },
  {
    id: "employee-portal",
    title: "Employee Portal (Self-Service)",
    description: "Self-service portal for employees to clock in/out, view schedules, track attendance, and submit leave requests.",
    category: "Business Tools",
    path: "/employee/portal",
    icon: <Smartphone className="w-5 h-5" />,
    color: "bg-indigo-500",
    gradient: "from-indigo-500 to-purple-500",
    sections: [
      { heading: "What is Employee Portal?", content: "A dedicated self-service portal where employees can clock in/out, view their daily schedule (shift name, start/end time, break schedule, grace period), track their attendance history, and submit leave requests — all without needing to contact HR." },
      { heading: "How Employees Log In", content: "Employees go to /employee/auth and enter their email. The system looks up their company and displays the company logo and name. After signing in with their Supabase auth account, they're taken to the portal dashboard." },
      { heading: "Clock In / Clock Out", content: "The main clock card shows the employee's schedule for today (shift name, start/end time, break schedule, grace period). Tapping 'Clock In' records the time and auto-determines if they're 'present' or 'late' by comparing against the shift start time + grace period. Tapping 'Clock Out' calculates total hours worked. Rest days show a special message and disable clock in." },
      { heading: "Attendance History", content: "View the last 7 days of attendance records showing date, time in/out, status (present/late/absent), tardiness minutes, and hours worked." },
      { heading: "Leave Requests", content: "Employees can submit leave requests directly from the portal — select leave type, start/end date, and optional reason. View the status of all their submitted requests (pending, approved, rejected)." },
    ],
  },
  {
    id: "payroll-engine",
    title: "Payroll Engine (Payslip Generator)",
    description: "Generate automated payslips with attendance, schedules, deductions, and net pay computation.",
    category: "Business Tools",
    path: "/app/hr/payroll",
    icon: <FileText className="w-5 h-5" />,
    color: "bg-emerald-500",
    gradient: "from-emerald-500 to-teal-400",
    sections: [
      { heading: "What is Payroll Engine?", content: "A complete payslip generation system that connects employee profiles, daily attendance, work schedules, payroll periods, and deductions. Automatically computes gross pay, deductions, and net pay for each employee based on their daily rate and attendance records." },
      { heading: "How to Use", content: "1. Set each employee's daily rate in Employee Management. 2. Create weekly schedules (which days they work, what time). 3. Log daily attendance (present, absent, leave, half-day with time in/out). 4. Create a payroll period (e.g., May 1-15). 5. Click 'Generate All Payslips' — the system auto-computes days worked, tardiness, gross pay, deductions, and net pay. 6. View, approve, and mark payslips as paid." },
      { heading: "Auto-Computation Logic", content: "Gross Pay = days worked × daily rate. Days worked are counted from attendance records within the payroll period. Tardiness is calculated as minutes late vs scheduled start time. Deductions can be fixed amounts (e.g., SSS ₱1,200) or percentage-based (e.g., 10% tax of gross pay). Net Pay = Gross Pay − total deductions." },
      { heading: "Deduction Types", content: "Create deduction types like SSS, PhilHealth, Pag-IBIG, withholding tax, loans, uniform, or any custom deduction. Each can be a fixed amount (₱) or a percentage (%) of gross pay. Mark deductions as mandatory to auto-include them in every payslip." },
      { heading: "Payslip Management", content: "View all generated payslips filtered by payroll period. Each payslip shows employee info, days worked, gross pay, itemized deductions, and net pay. You can approve payslips and mark them as paid. The system tracks the generation date and status of each payslip." },
    ],
  },
  {
    id: "automated-payroll",
    title: "Automated Payroll Engine (PH Statutory Deductions)",
    description: "Server-side payroll engine that auto-computes SSS, PhilHealth, Pag-IBIG, and withholding tax using configurable bracket tables.",
    category: "Business Tools",
    path: "/app/business/payroll",
    icon: <Crown className="w-5 h-5" />,
    color: "bg-rose-500",
    gradient: "from-rose-500 to-pink-400",
    sections: [
      { heading: "What is Automated Payroll Engine?", content: "A server-side payroll processing system that automatically computes Philippine statutory deductions (SSS, PhilHealth, Pag-IBIG, Withholding Tax) for all employees. It uses configurable bracket tables stored in the database, so you can update rates anytime without code changes. The engine processes attendance, schedules, leaves, and applies the correct deduction brackets per employee." },
      { heading: "How It Works", content: "1. Configure your company settings (cutoff dates, which deductions apply on 1st/2nd cutoff). 2. Set up statutory deduction brackets in the Statutory tab (SSS brackets, PhilHealth rate, Pag-IBIG rate, BIR withholding tax brackets). 3. Optionally set per-employee overrides for specific deduction types. 4. Log employee attendance and schedules. 5. Create a payroll period. 6. Go to the Auto Payroll tab, select the period, and click 'Run Payroll'. The edge function processes all employees server-side and generates payslips." },
      { heading: "Computation Order", content: "1. Gross Pay = days worked × daily rate (or monthly salary ÷ 30 × days worked). 2. Subtract tardiness deductions (hourly rate ÷ 60 × tardiness minutes). 3. Subtract absence deductions (daily rate × absent days). 4. Compute SSS based on monthly compensation bracket. 5. Compute PhilHealth (5% total, 50/50 split, capped at ₱5,000). 6. Compute Pag-IBIG (2% of monthly comp, max ₱100 employee share). 7. Compute Withholding Tax on remaining taxable income using BIR graduated rates. 8. Net Pay = Gross Pay − total deductions." },
      { heading: "Configuring Statutory Brackets", content: "Go to the Statutory tab in Payroll Management. You'll see tabs for SSS, PhilHealth, Pag-IBIG, and Withholding Tax. Each tab shows the bracket table for that deduction type. You can add, edit, or delete brackets. For percentage-based deductions (like Pag-IBIG and withholding tax), enter the rate as a decimal (e.g., 0.02 for 2%). For fixed-amount deductions (like SSS), enter the peso amount directly. Changes take effect immediately on the next payroll run." },
      { heading: "Employee Deduction Overrides", content: "Some employees may have different deduction amounts (e.g., SSS voluntary members, or employees with existing Pag-IBIG loans). Go to the Overrides tab to enable per-employee overrides. Toggle the switch for an employee, then enter their custom employee share amount. The engine will use the override value instead of the bracket lookup for that employee." },
      { heading: "Cutoff Configuration", content: "In your company settings, you can configure which statutory deductions apply on the 1st cutoff (days 1-15) and which apply on the 2nd cutoff (days 16-31). For example, you might apply SSS on both cutoffs but only apply withholding tax on the 2nd cutoff. The engine checks these flags when processing each payroll period." },
      { heading: "Running Payroll", content: "1. Ensure all attendance records are logged for the period. 2. Create a payroll period (or select an existing one). 3. Go to the Auto Payroll tab. 4. Select the payroll period from the dropdown. 5. Click 'Run Payroll'. 6. The system calls the server-side edge function which processes all active employees. 7. Results appear as payslips in the Payslips tab. 8. Review, approve, and mark payslips as paid." },
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
