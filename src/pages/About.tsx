import { ArrowLeft, BookOpen, Award, Target, Quote } from "lucide-react";
import { useNavigate } from "react-router";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Back button */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 pt-8 pb-12">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
          {/* Photo */}
          <div className="flex-shrink-0">
            <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 p-1 shadow-lg">
              <div className="w-full h-full rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face"
                  alt="Con Pascual"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              The Founder's Story:{" "}
              <span className="text-emerald-600">Built for You, Because of You</span>
            </h1>
            <p className="text-lg text-gray-500 mt-3 max-w-xl">
              From 6-Figure Success to Solving Your Daily Marketing Struggles
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10">
          <div className="flex items-start gap-4 mb-8">
            <Quote className="w-8 h-8 text-emerald-500 flex-shrink-0 mt-1" />
            <p className="text-lg text-gray-700 leading-relaxed italic">
              I'm <strong>Con Pascual</strong>, and if there's one thing my journey has taught me, it's that the best tools aren't born in a vacuum. They are born from listening to the people in the trenches.
            </p>
          </div>

          <p className="text-gray-600 leading-relaxed mb-6">
            As an entrepreneur and digital marketer based in the Philippines, I've spent years navigating the high-stakes world of affiliate marketing and network marketing. I know the thrill of reaching 6-figure multiple earner status, but I also know the exhaustion that comes with it.
          </p>

          {/* The "Why" */}
          <div className="bg-emerald-50 rounded-2xl p-6 md:p-8 mb-8 border border-emerald-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              The "Why" Behind the Wizard
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              I didn't build the BC AI Marketing Tool just to add another SaaS to my portfolio. I built it because of you.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Through my work as the co-founder of Blueprint VA Solutions and the founder of BC AI Business Solutions, I spoke with hundreds of entrepreneurs. I heard the same frustrations over and over:
            </p>
            <ul className="space-y-2">
              {[
                '"I don\'t know how to write copy that sells."',
                '"Facebook targeting feels like throwing money into a void."',
                '"I\'m drowning in admin work and BIR compliance."',
              ].map((quote, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-600">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span className="italic">{quote}</span>
                </li>
              ))}
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              I realized that while I had developed the systems to reach success, my customers were still struggling with the "how." So, I took my experience as a SaaS founder—the same expertise used to develop CreateClip AI and SMM Assistant—and poured it into one "Sales Wizard" designed to solve those exact pains.
            </p>
          </div>

          {/* Track Record */}
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            A Track Record of Results
          </h2>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[
              {
                icon: BookOpen,
                title: "Affiliate Expert",
                desc: "Leveraging years of experience as a top earner to automate high-converting sales frameworks.",
              },
              {
                icon: BookOpen,
                title: "Published Authority",
                desc: "Author of 16 high-content books on Amazon, bringing the art of persuasive storytelling to your AI-generated copy.",
              },
              {
                icon: Award,
                title: "Tech Innovator",
                desc: "Based in Tarlac City, I manage a suite of AI platforms focused on video, voice, and marketing automation.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-xl p-5 border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-3">
                  <item.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Mission */}
          <div className="bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              The Mission
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Guided by the principles of Stoicism, I believe in focusing energy where it matters most. My mission is to remove the "noise" of marketing and admin work so you can focus on your vision.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              The BC AI Marketing Tool is my way of giving you the same "unfair advantage" I used to scale my own businesses. You told me what you needed, and I built it.
            </p>
            <p className="text-gray-900 font-semibold text-lg">
              Let's stop the guesswork and start scaling together.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
