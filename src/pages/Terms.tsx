import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
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
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Terms and Conditions</h1>
          
          <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
            <p>
              By signing up for BC AI Business Solutions — Marketing Tool Kit, you agree to the following terms:
            </p>
            
            <h3 className="text-lg font-bold text-gray-900 mt-6">1. Account Responsibility</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>

            <h3 className="text-lg font-bold text-gray-900 mt-6">2. Fair Usage Policy</h3>
            <p>
              All plans are subject to a fair usage policy. Excessive or abusive use of the platform may result in restricted access.
            </p>

            <h3 className="text-lg font-bold text-gray-900 mt-6">3. No Refund Policy</h3>
            <p>
              All payments are non-refundable unless otherwise stated. Please review your plan carefully before purchasing.
            </p>

            <h3 className="text-lg font-bold text-gray-900 mt-6">4. Service Availability</h3>
            <p>
              While we strive for 100% uptime, we do not guarantee uninterrupted access to the platform. We reserve the right to modify or discontinue features at any time.
            </p>

            <h3 className="text-lg font-bold text-gray-900 mt-6">5. Content Ownership</h3>
            <p>
              You retain ownership of any content you generate using our tools. However, you grant us a license to use anonymized data for improving our services.
            </p>

            <h3 className="text-lg font-bold text-gray-900 mt-6">6. Limitation of Liability</h3>
            <p>
              BC AI Business Solutions shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
