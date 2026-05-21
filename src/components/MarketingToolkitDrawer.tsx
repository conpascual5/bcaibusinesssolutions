import { useNavigate } from "react-router";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Wand2, Target, BarChart3, FileText, Package,
  ShoppingCart, ArrowRight, Sparkles
} from "lucide-react";

const toolkitItems = [
  {
    icon: Wand2,
    label: "Sales Wizard",
    desc: "Generate AI-powered sales content",
    path: "/app/sales-wizard",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
  {
    icon: Target,
    label: "FB Ads Targeting",
    desc: "Find your perfect audience",
    path: "/app/fb-ads-targeting",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    icon: BarChart3,
    label: "Sales Report",
    desc: "Analyze your sales performance",
    path: "/app/sales-report",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    icon: FileText,
    label: "Invoices",
    desc: "Create & manage invoices",
    path: "/app/invoices",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
  },
  {
    icon: Package,
    label: "My Assets",
    desc: "View your generated content",
    path: "/app/my-assets",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    icon: ShoppingCart,
    label: "Tracker Shop",
    desc: "Browse available trackers",
    path: "/app/shop",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
];

interface MarketingToolkitDrawerProps {
  children: React.ReactNode;
}

export default function MarketingToolkitDrawer({ children }: MarketingToolkitDrawerProps) {
  const navigate = useNavigate();

  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <DrawerTitle className="text-base">Marketing Toolkit</DrawerTitle>
              <DrawerDescription className="text-xs">
                All your AI marketing tools in one place
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>
        <div className="px-4 pb-6 overflow-y-auto">
          <div className="grid grid-cols-1 gap-2">
            {toolkitItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                }}
                className={`group flex items-center gap-3 p-3.5 rounded-xl border ${item.border} ${item.bg}/50 hover:${item.bg} hover:shadow-md hover:-translate-y-0.5 transition-all text-left`}
              >
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-400 truncate">{item.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
