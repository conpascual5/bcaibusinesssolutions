import { useAuth } from "@/providers/auth";
import { useBusinessTeam } from "@/providers/business-team";
import BusinessLayout from "@/components/BusinessLayout";
import {
  Building2, ShoppingCart, ClipboardList, DollarSign, Receipt,
  Calculator, Wallet, Users, FileText, FileSearch, Target, Database,
  UserPlus, BarChart3, Clock, Umbrella, BookOpen, ChevronDown,
  ChevronRight, Search, Lightbulb, AlertTriangle, CheckCircle2,
  ArrowRight, Star, Play, Info
} from "lucide-react";
import { useState } from "react";

const sections = [
  {
    id: "getting-started",
    icon: Play,
    label: "Getting Started",
    color: "bg-emerald-500",
    content: [
      {
        q: "What is the Business Management System?",
        a: "The BMS is a complete business operations dashboard that helps you manage products, inventory, sales, expenses, customers, invoices, receipts, pricing, targets, team members, and HR — all in one place. Each module is accessible from the sidebar on the left."
      },
      {
        q: "How do I navigate the BMS?",
        a: "Click any item in the left sidebar to switch between modules. The sidebar is organized into logical groups: Operations (Dashboard, Products, Inventory, Sales, Expenses), Financial (Pricing, Finance, Customers, Invoices, Receipts), Planning (Targets, Records), People (Team), and HR (HR Dashboard, Employees, Attendance, Leave Mgmt)."
      },
      {
        q: "Can I add team members to help manage the business?",
        a: "Yes! Go to the Team page and click 'Add Member'. Enter their email and assign a role. They'll need to create an account and will see your business data when they access the BMS."
      },
    ]
  },
  {
    id: "dashboard",
    icon: Building2,
    label: "Dashboard",
    color: "bg-indigo-500",
    content: [
      {
        q: "What's on the main Dashboard?",
        a: "The Dashboard gives you a bird's-eye view of your business: total products, inventory value, today's sales, pending invoices, recent transactions, and quick-action buttons to jump into any module."
      },
      {
        q: "How do I use the quick actions?",
        a: "Cards on the Dashboard have 'View Details' buttons that take you directly to the relevant module. Use these to quickly add a product, record a sale, or check inventory."
      },
    ]
  },
  {
    id: "products",
    icon: ShoppingCart,
    label: "Products",
    color: "bg-blue-500",
    content: [
      {
        q: "How do I add a new product?",
        a: "Click the 'Add Product' button. Fill in the name, description, category, unit price, cost price, and initial stock quantity. The system will automatically calculate your profit margin."
      },
      {
        q: "Can I edit or delete a product?",
        a: "Yes. Each product row has Edit (pencil icon) and Delete (trash icon) buttons. Editing preserves the product ID and history. Deleting removes it permanently."
      },
      {
        q: "What does the profit margin mean?",
        a: "Profit margin = ((Unit Price - Cost Price) / Unit Price) × 100%. It shows how much profit you make on each unit sold. A higher margin means more profit per sale."
      },
    ]
  },
  {
    id: "inventory",
    icon: ClipboardList,
    label: "Inventory",
    color: "bg-cyan-500",
    content: [
      {
        q: "How do I record stock changes?",
        a: "Click 'Add Stock Movement'. Choose the product, select 'In' for restocking or 'Out' for removal/damage, enter the quantity, and optionally add a reason. The system updates stock levels automatically."
      },
      {
        q: "What do the stock status colors mean?",
        a: "Green = In Stock (sufficient), Yellow = Low Stock (below threshold), Red = Out of Stock. You can set custom low-stock thresholds per product."
      },
      {
        q: "Can I see my stock movement history?",
        a: "Yes. The Inventory page shows a log of all stock movements with timestamps, quantities, and reasons. Use the filter to narrow down by product or date range."
      },
    ]
  },
  {
    id: "sales",
    icon: DollarSign,
    label: "Sales Tracker",
    color: "bg-emerald-500",
    content: [
      {
        q: "How do I record a sale?",
        a: "Click 'Record Sale'. Select the customer (or leave blank for walk-in), choose products and quantities, and the system auto-calculates the total. You can also add a discount or mark as paid/unpaid."
      },
      {
        q: "Can I track unpaid sales?",
        a: "Yes. Each sale has a payment status (Paid/Unpaid/Partial). Use the filter to show only unpaid sales and follow up with those customers."
      },
      {
        q: "How do I view sales reports?",
        a: "The Sales page shows daily, weekly, and monthly totals. You can also filter by date range, product, or customer to generate custom reports."
      },
    ]
  },
  {
    id: "expenses",
    icon: Receipt,
    label: "Expenses",
    color: "bg-rose-500",
    content: [
      {
        q: "How do I log an expense?",
        a: "Click 'Add Expense'. Enter the amount, category (e.g., Utilities, Rent, Supplies), date, and optional notes. Categorizing helps you see where your money goes."
      },
      {
        q: "Can I see expense trends?",
        a: "Yes. The Expenses page shows a breakdown by category and a chart of expenses over time. Use the period filter to view weekly, monthly, or yearly trends."
      },
    ]
  },
  {
    id: "pricing",
    icon: Calculator,
    label: "Pricing",
    color: "bg-purple-500",
    content: [
      {
        q: "How does the Pricing Calculator work?",
        a: "Enter your cost price and desired markup percentage. The calculator instantly shows the recommended selling price, profit per unit, and profit margin. You can apply the calculated price directly to a product."
      },
      {
        q: "What's the difference between markup and margin?",
        a: "Markup = (Selling Price - Cost) / Cost × 100%. Margin = (Selling Price - Cost) / Selling Price × 100%. Markup is based on cost, margin is based on selling price."
      },
    ]
  },
  {
    id: "finance",
    icon: Wallet,
    label: "Finance",
    color: "bg-amber-500",
    content: [
      {
        q: "What financial reports are available?",
        a: "The Finance page shows profit & loss summaries, revenue vs expenses charts, cash flow tracking, and key metrics like net profit, gross profit margin, and operating expenses ratio."
      },
      {
        q: "How do I set a budget?",
        a: "Use the Budget section to set monthly or yearly spending limits per category. The system will alert you when you're approaching or exceeding your budget."
      },
    ]
  },
  {
    id: "customers",
    icon: Users,
    label: "Customers",
    color: "bg-sky-500",
    content: [
      {
        q: "How do I add a customer?",
        a: "Click 'Add Customer'. Enter their name, contact info, and any notes. You can also create customers automatically when recording a sale with a new name."
      },
      {
        q: "Can I see a customer's purchase history?",
        a: "Yes. Click on any customer to view their profile, which includes all their past purchases, total spent, outstanding balance, and contact information."
      },
    ]
  },
  {
    id: "invoices",
    icon: FileText,
    label: "Invoices",
    color: "bg-orange-500",
    content: [
      {
        q: "How do I create an invoice?",
        a: "Click 'Create Invoice'. Select a customer, add line items (products or custom entries), set due date, and the system calculates totals including tax. You can mark it as sent, paid, or overdue."
      },
      {
        q: "Can I send invoices to customers?",
        a: "Yes. After creating an invoice, use the 'Send' button to email it directly to the customer. The system tracks whether it's been viewed."
      },
    ]
  },
  {
    id: "receipts",
    icon: FileSearch,
    label: "Receipts",
    color: "bg-teal-500",
    content: [
      {
        q: "How do receipts differ from invoices?",
        a: "Receipts are proof of payment for completed transactions. Invoices are requests for payment. A sale generates a receipt automatically when marked as paid."
      },
      {
        q: "Can I print or download receipts?",
        a: "Yes. Each receipt has a Print button for physical copies and a Download button for PDF versions. Receipts include all transaction details."
      },
    ]
  },
  {
    id: "targets",
    icon: Target,
    label: "Targets",
    color: "bg-red-500",
    content: [
      {
        q: "How do I set business targets?",
        a: "Go to Targets and click 'Set Target'. Choose the type (Revenue, Sales Count, New Customers, etc.), set the target value, and select the period (monthly, quarterly, yearly)."
      },
      {
        q: "How do I track progress?",
        a: "The Targets page shows a progress bar for each target with percentage complete, actual vs target values, and days remaining. Green means on track, yellow means at risk, red means behind."
      },
    ]
  },
  {
    id: "records",
    icon: Database,
    label: "Records",
    color: "bg-slate-500",
    content: [
      {
        q: "What's in the Records module?",
        a: "Records is your data archive. It stores all historical transactions, logs, and backups. You can search, filter, and export data for auditing or analysis."
      },
      {
        q: "Can I export my data?",
        a: "Yes. Use the Export button to download data as CSV or Excel. You can export individual modules or the entire business database."
      },
    ]
  },
  {
    id: "team",
    icon: UserPlus,
    label: "Team",
    color: "bg-violet-500",
    content: [
      {
        q: "How do I add a team member?",
        a: "Click 'Add Member'. Enter their email address and select a role (Admin, Manager, Staff). They'll receive an invitation and need to create an account to access your business."
      },
      {
        q: "What permissions do different roles have?",
        a: "Admins have full access to all modules. Managers can view and edit most data but can't delete or add team members. Staff have view-only access to assigned modules."
      },
      {
        q: "Can I remove a team member?",
        a: "Yes. Go to the Team page and click the Remove button next to the member. This revokes their access immediately."
      },
    ]
  },
  {
    id: "hr-dashboard",
    icon: BarChart3,
    label: "HR Dashboard",
    color: "bg-indigo-500",
    content: [
      {
        q: "What does the HR Dashboard show?",
        a: "The HR Dashboard is your command center for people analytics. It shows: employee counts (total, active, inactive), attendance stats (perfect attendance, total hours, late arrivals, absences), gender distribution, leave usage breakdown by type, and a payroll-ready summary with regular pay, overtime pay, late deductions, and total payroll."
      },
      {
        q: "How do I change the reporting period?",
        a: "Use the tabs at the top: 'This Week', 'This Month', or 'This Quarter'. All charts and numbers update automatically based on your selection."
      },
      {
        q: "How is payroll calculated?",
        a: "The payroll summary uses an estimated hourly rate (₱150/hr by default). Regular Pay = total hours × rate. Overtime Pay = OT hours × rate × 1.5. Late Deductions = tardiness hours × rate. You can adjust the rate in the code to match your actual rates."
      },
    ]
  },
  {
    id: "employees",
    icon: Users,
    label: "Employees",
    color: "bg-blue-500",
    content: [
      {
        q: "How do I add a new employee?",
        a: "Click 'Add Employee'. Fill in their first name, last name, email, phone, position, department, hire date, and gender. The system auto-calculates their tenure in years, months, and days."
      },
      {
        q: "How do I mark an employee as inactive?",
        a: "Use the toggle switch in the Status column. Toggle to 'Inactive' when an employee resigns or is terminated. Inactive employees won't appear in attendance or leave dropdowns but their records are preserved."
      },
      {
        q: "What happens when I set a resignation date?",
        a: "Setting a resignation date doesn't automatically deactivate the employee — you need to toggle the status separately. The resignation date is for record-keeping and tenure calculations."
      },
      {
        q: "Can I edit an employee's details?",
        a: "Yes. Click the Edit (pencil) button on any employee row. You can update their name, contact info, position, department, and dates."
      },
    ]
  },
  {
    id: "attendance",
    icon: Clock,
    label: "Attendance",
    color: "bg-cyan-500",
    content: [
      {
        q: "How do I record daily attendance?",
        a: "Navigate to the Attendance page. You'll see a weekly grid with employees on the left and days across the top. For each employee each day, use the dropdown to select their status: Present, Late, Absent, Half Day, Holiday, Rest Day, or On Leave."
      },
      {
        q: "How does time-in/time-out work?",
        a: "When you select 'Present' or 'Late', time-in and time-out fields appear. The default is 8:00 AM to 5:00 PM. You can adjust these. The system automatically calculates: hours worked (minus 1-hour lunch break), overtime (hours beyond 8), and tardiness (minutes past 8:00 AM)."
      },
      {
        q: "How do I navigate between weeks?",
        a: "Use the left/right arrow buttons at the top of the attendance table to move between weeks. The current week is highlighted with an indigo background."
      },
      {
        q: "What do the color-coded statuses mean?",
        a: "Green = Present, Amber = Late, Red = Absent, Blue = On Leave, Yellow = Holiday/Rest Day. The legend at the bottom of the page shows all colors."
      },
      {
        q: "How do I set up holidays and rest days?",
        a: "Scroll down to the 'Holidays & Rest Days' section below the attendance table and click to expand it. Click 'Add Holiday' to add a company holiday (it will auto-fill as 'Holiday' on that date). Click 'Add Rest Day' to set weekly rest days (e.g., Sunday)."
      },
      {
        q: "What are conflict alerts?",
        a: "If you try to mark an employee as 'Present' on a day they have an approved leave, or on a company holiday, a red warning alert appears: 'On leave this day' or 'Company holiday'. This prevents accidental double-booking."
      },
      {
        q: "Can I filter by employee?",
        a: "Yes. Use the employee filter dropdown above the table to view attendance for a single employee instead of everyone."
      },
    ]
  },
  {
    id: "leave",
    icon: Umbrella,
    label: "Leave Management",
    color: "bg-purple-500",
    content: [
      {
        q: "How do I set up leave types?",
        a: "Go to the Leave Management page and click the 'Leave Types' tab. Click 'Add Leave Type'. Enter a code (e.g., VL for Vacation Leave, SL for Sick Leave), name, description, and max days per year. These are fully customizable per year."
      },
      {
        q: "How do I set per-employee leave entitlements?",
        a: "Click the 'Entitlements' tab. Click 'Set Entitlement'. Choose the employee, leave type, year, and max days. This overrides the default max days from the leave type for that specific employee."
      },
      {
        q: "How do I approve a leave request?",
        a: "Click the 'Leave Requests' tab. Click 'New Leave Request'. Select the employee, leave type, start/end dates, and optionally mark as half-day. The system checks their remaining balance and shows it before you approve. If they have enough days, click 'Approve & Save'."
      },
      {
        q: "How does half-day leave work?",
        a: "Check the 'Half day' box when creating a leave request. This deducts 0.5 days instead of a full day. For example, a 3-day leave with half-day checked deducts 2.5 days."
      },
      {
        q: "How do I check an employee's remaining leave balance?",
        a: "When creating a leave request, after selecting the employee and leave type, a blue info box appears showing 'X / Y days remaining'. You can also see all entitlements with remaining balances in the Entitlements tab."
      },
      {
        q: "Can I delete a leave request?",
        a: "Yes. Click the trash icon on any leave request row to delete it. This frees up the leave days back into the employee's balance."
      },
    ]
  },
];

export default function BusinessHelp() {
  const [search, setSearch] = useState("");
  const [openSection, setOpenSection] = useState<string | null>("getting-started");
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set(["getting-started-0"]));

  const toggleQuestion = (id: string) => {
    const next = new Set(openQuestions);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpenQuestions(next);
  };

  const filteredSections = sections.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.label.toLowerCase().includes(q) ||
      s.content.some(c => c.q.toLowerCase().includes(q) || c.a.toLowerCase().includes(q));
  });

  return (
    <BusinessLayout title="Help & Knowledge Base" description="Complete guide to using the Business Management System">
      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search the knowledge base..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-2">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => { setOpenSection(s.id); setSearch(""); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                openSection === s.id
                  ? `${s.color} text-white`
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <s.icon className="w-3 h-3" />
              {s.label}
            </button>
          ))}
        </div>

        {/* Sections */}
        {filteredSections.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No results found for "{search}"</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSections.map(section => (
              <div key={section.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                {/* Section Header */}
                <button
                  onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${section.color}`}>
                      <section.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-sm">{section.label}</h3>
                      <p className="text-xs text-muted-foreground">{section.content.length} topics</p>
                    </div>
                  </div>
                  {openSection === section.id ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                {/* Questions */}
                {openSection === section.id && (
                  <div className="border-t border-border divide-y divide-border">
                    {section.content.map((item, i) => {
                      const qId = `${section.id}-${i}`;
                      const isOpen = openQuestions.has(qId);
                      return (
                        <div key={qId}>
                          <button
                            onClick={() => toggleQuestion(qId)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/20 transition-colors"
                          >
                            <div className="flex items-start gap-2.5">
                              <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                              <span className="text-sm font-medium">{item.q}</span>
                            </div>
                            {isOpen ? (
                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            )}
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 pl-11">
                              <div className="flex items-start gap-2.5">
                                <ArrowRight className="w-3.5 h-3.5 text-indigo-500 mt-1 shrink-0" />
                                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tips Footer */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-indigo-700 dark:text-indigo-400 mb-1">Pro Tips</h4>
              <ul className="space-y-1.5 text-sm text-indigo-600/80 dark:text-indigo-300/80">
                <li>• Use the <strong>Team</strong> page to give your staff access — they'll see your business data under their own account.</li>
                <li>• Set up <strong>Holidays & Rest Days</strong> in the Attendance page first — they auto-populate in the weekly grid.</li>
                <li>• Configure <strong>Leave Types</strong> before creating entitlements or approving leave requests.</li>
                <li>• The <strong>HR Dashboard</strong> payroll summary uses an estimated rate — adjust it to match your actual hourly rates.</li>
                <li>• <strong>Conflict alerts</strong> in Attendance prevent you from accidentally marking someone present on a leave day or holiday.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </BusinessLayout>
  );
}
