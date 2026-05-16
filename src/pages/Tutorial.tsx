import { Link } from 'react-router';
import { ArrowLeft, Play, Wand2, Target, BarChart3, FileSearch, FileText, Sparkles, ChevronRight } from 'lucide-react';
import AnimatedSection from '@/components/AnimatedSection';

interface TutorialVideo {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  reelId: string;
  duration: string;
}

const tutorials: TutorialVideo[] = [
  {
    id: "sales-wizard",
    title: "Sales Wizard",
    description: "Learn how to generate AI-powered sales messages using 20+ frameworks (AIDA, PAS, BAB, and more). Choose from Taglish, Filipino, or English.",
    icon: <Wand2 className="w-6 h-6" />,
    color: "bg-blue-500",
    gradient: "from-blue-500 to-cyan-400",
    reelId: "1334334298589942",
    duration: "2:30",
  },
  {
    id: "sales-report",
    title: "Historical Sales Report Tracker",
    description: "Track your sales daily, weekly, monthly, and yearly. Import from Excel or add entries manually with charts and summaries.",
    icon: <BarChart3 className="w-6 h-6" />,
    color: "bg-rose-500",
    gradient: "from-rose-500 to-pink-400",
    reelId: "4679296552300710",
    duration: "2:15",
  },
  {
    id: "competitor-analysis",
    title: "Competitor Analysis",
    description: "Paste competitor ad copy and get AI-powered psychological trigger analysis, counter-positioning strategies, and improvement tips.",
    icon: <FileSearch className="w-6 h-6" />,
    color: "bg-indigo-500",
    gradient: "from-indigo-500 to-purple-400",
    reelId: "1312536147072262",
    duration: "2:45",
  },
  {
    id: "fb-ads-targeting",
    title: "FB Ads Targeting Generator",
    description: "Generate 3 detailed buyer personas with demographics, interests, behaviors, and exact Facebook targeting keywords for Philippines or International.",
    icon: <Target className="w-6 h-6" />,
    color: "bg-emerald-500",
    gradient: "from-emerald-500 to-teal-400",
    reelId: "1531899181612088",
    duration: "2:20",
  },
  {
    id: "invoice-generator",
    title: "Invoice Generator",
    description: "Create professional invoices in seconds. Generate PDF invoices with your business details, client info, itemized billing, and payment terms.",
    icon: <FileText className="w-6 h-6" />,
    color: "bg-amber-500",
    gradient: "from-amber-500 to-orange-400",
    reelId: "997436722769451",
    duration: "2:10",
  },
];

export default function Tutorial() {
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
            <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-gray-900">BC AI Tutorials</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        {/* Hero */}
        <AnimatedSection>
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              <Play className="w-3 h-3" /> Video Tutorials
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
              Learn How to Use BC AI
            </h1>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Watch step-by-step video walkthroughs of each tool. See exactly how the features work
              before you sign up — no account needed.
            </p>
          </div>
        </AnimatedSection>

        {/* Tutorial Videos */}
        <div className="space-y-12">
          {tutorials.map((tutorial, i) => (
            <AnimatedSection key={tutorial.id} delay={i * 150} direction="up">
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                  {/* Video */}
                  <div className="lg:col-span-3 bg-gray-100 relative overflow-hidden">
                    <div className="aspect-video relative">
                      <iframe
                        src={`https://www.facebook.com/plugins/video.php?height=314&href=${encodeURIComponent(`https://www.facebook.com/reel/${tutorial.reelId}/`)}&show_text=false&width=560&t=0`}
                        className="absolute inset-0 w-full h-full"
                        style={{ border: 'none', overflow: 'hidden' }}
                        scrolling="no"
                        frameBorder="0"
                        allowFullScreen
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                        title={tutorial.title}
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="lg:col-span-2 p-6 sm:p-8 flex flex-col justify-center">
                    <div className={`w-12 h-12 bg-gradient-to-r ${tutorial.gradient} rounded-xl flex items-center justify-center text-white mb-4 shadow-sm`}>
                      {tutorial.icon}
                    </div>
                    <h2 className="text-xl font-extrabold text-gray-900 mb-2">
                      {tutorial.title}
                    </h2>
                    <p className="text-sm text-gray-500 leading-relaxed mb-4">
                      {tutorial.description}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        <Play className="w-3 h-3" /> {tutorial.duration}
                      </span>
                      <Link
                        to="/auth"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Try it free <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* CTA */}
        <AnimatedSection delay={500} direction="up">
          <div className="mt-16 text-center bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-10 sm:p-12 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/30 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/30 rounded-full blur-[80px]" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                Ready to Try It Yourself?
              </h2>
              <p className="text-blue-100 mb-6 max-w-md mx-auto text-sm">
                Sign up for free and get access to all 6 AI tools. No credit card needed.
              </p>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl"
              >
                Get Started Free <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
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
