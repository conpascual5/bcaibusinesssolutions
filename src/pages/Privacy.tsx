import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 mb-8 text-gray-500 hover:text-gray-900 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign Up
        </Link>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Privacy Policy</h1>
          
          <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
            <p>
              Your privacy is important to us. This policy outlines how BC AI Business Solutions collects, uses, and protects your information.
            </p>

            <h3 className="text-lg font-bold text-gray-900 mt-6">1. Information We Collect</h3>
            <p>
              We collect information you provide when signing up, including your name, email address, and any content you generate using our tools.
            </p>

            <h3 className="text-lg font-bold text-gray-900 mt-6">2. How We Use Your Information</h3>
            <p>
              We use your information to provide and improve our services, communicate with you about your account, and send occasional service-related updates.
            </p>

            <h3 className="text-lg font-bold text-gray-900 mt-6">3. Data Security</h3>
            <p>
              We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.
            </p>

            <h3 className="text-lg font-bold text-gray-900 mt-6">4. Third-Party Services</h3>
            <p>
              We may use third-party services (e.g., Supabase) to host and process your data. These providers are bound by their own privacy and security policies.
            </p>

            <h3 className="text-lg font-bold text-gray-900 mt-6">5. Your Rights</h3>
            <p>
              You may request access to, correction of, or deletion of your personal data at any time by contacting us through our Facebook page.
            </p>

            <h3 className="text-lg font-bold text-gray-900 mt-6">6. Changes to This Policy</h3>
            <p>
              We may update this privacy policy from time to time. We will notify you of any material changes via email or through the platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
