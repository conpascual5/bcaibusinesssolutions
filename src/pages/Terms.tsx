import { Link } from "react-router";
import { ArrowLeft, FileText, Shield, CreditCard, Gift, AlertTriangle, Mail } from "lucide-react";

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

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            <h1 className="text-3xl font-extrabold text-gray-900">Terms and Conditions</h1>
          </div>
          <p className="text-sm text-gray-400 mb-8">Last Updated: May 18, 2026</p>

          <div className="prose prose-sm max-w-none text-gray-600 space-y-6 leading-relaxed">
            <p className="font-medium text-gray-800">
              Welcome to BC Social Media Services (the "Website," "Platform," "Service," "we," "us," or "our"), available at{" "}
              <a href="https://bcsocialmediaservices.online/" className="text-indigo-600 hover:underline font-medium">https://bcsocialmediaservices.online/</a>.
            </p>
            <p>
              Please read these Terms and Conditions ("Terms") carefully before using our website, platform, software, or enrolling in our Affiliate Program. By accessing or using any part of the Service, you ("User," "Client," or "Affiliate") agree to be bound by these Terms. If you do not agree to all of these Terms, you may not access the Website or use our services.
            </p>

            {/* 1 */}
            <div className="pt-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" />
                1. Acceptance & Eligibility
              </h3>
              <p className="mt-2">
                By using this Website, you represent and warrant that you are at least 18 years of age and possess the legal capacity to enter into a binding agreement. If you are using our Service on behalf of a business or entity, you represent that you have the authority to bind that entity to these Terms.
              </p>
            </div>

            {/* 2 */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-500" />
                2. Services & Subscriptions
              </h3>
              <div className="mt-2 space-y-3">
                <p><strong>Account Creation:</strong> To access certain software tools or features, you must create an account. You are responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account.</p>
                <p><strong>Pricing and Payments:</strong> All subscription plans, digital services, and transaction processing are handled securely. You agree to provide accurate, current, and complete billing information.</p>
                <p><strong>Subscription Renewal:</strong> Subscriptions automatically renew at the end of each billing cycle (monthly or annually) unless canceled by the user prior to the renewal date via your account dashboard.</p>
                <p><strong>Cancellation and Refunds:</strong> Users can cancel their subscriptions at any time. Refunds are governed by our standard refund policy window, which is subject to internal audit to prevent platform and API credit abuse.</p>
              </div>
            </div>

            {/* 3 */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-indigo-500" />
                3. Prohibited Uses
              </h3>
              <p className="mt-2">You agree not to use the Website, software, or services to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Violate any local, national, or international laws or regulations.</li>
                <li>Upload, post, or transmit fraudulent, deceptive, or malicious code, scripts, or automated bots.</li>
                <li>Reverse engineer, decompile, or attempt to extract the source code of any software hosted on the Vercel, Node.js, or Supabase infrastructure powering the Platform.</li>
                <li>Circumvent or attempt to abuse the API quotas, database thresholds, or storage limits of the Service.</li>
              </ul>
            </div>

            {/* 4 */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                4. Intellectual Property Rights
              </h3>
              <p className="mt-2">
                All content, branding, user interfaces, code, databases, graphics, layout, and software tools available on{" "}
                <a href="https://bcsocialmediaservices.online/" className="text-indigo-600 hover:underline font-medium">https://bcsocialmediaservices.online/</a>{" "}
                are the exclusive intellectual property of BC Social Media Services or its licensors. You are granted a limited, non-transferable, revocable license to access the platform strictly for personal or business marketing operations in accordance with your subscription plan.
              </p>
            </div>

            {/* 5 */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Gift className="w-5 h-5 text-indigo-500" />
                5. Affiliate Program Terms
              </h3>
              <p className="mt-2">By registering as an Affiliate, you agree to the following program rules:</p>
              <div className="mt-3 space-y-3">
                <p><strong>Commission Structure:</strong> Affiliates earn a flat 30% recurring monthly commission for every valid, paying customer referred through their unique affiliate link.</p>
                <p><strong>Lifetime Attribution:</strong> The 30% commission applies to all successful, subsequent monthly subscription payments made by the referred user for as long as their subscription remains active. If the referred customer cancels, downgrades, churns, or receives a refund, affiliate commissions for that user will cease immediately.</p>
                <p><strong>30-Day Commission Lock (Safety Window):</strong> To mitigate credit card fraud, processing errors, and user refunds, all generated commissions are held in a "Pending" status for a mandatory 30-day buffer period from the date of the user's initial payment.</p>
                <p><strong>Payout Eligibility:</strong> Commissions only become eligible for withdrawal or payout once the 30-day lock period has cleared and the status updates to "Eligible". Payout cycles are executed monthly for all amounts clearing the threshold. After approval, payouts are sent within 1–2 business days.</p>
                <div>
                  <p className="font-semibold text-gray-800">Prohibited Marketing Methods:</p>
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>Affiliates may not engage in "Self-Referrals" (signing up for a paid plan using your own affiliate link).</li>
                    <li>Affiliates may not use spam emails, misleading advertisements, or cookie-stuffing tactics.</li>
                    <li>Affiliates may not bid on branded PPC keywords (e.g., Google Ads targeting "BC Social Media Services") without prior written consent.</li>
                  </ul>
                </div>
                <p><strong>Termination of Affiliate Account:</strong> We reserve the right to investigate, reject, or void commissions, and permanently ban any affiliate who violates these guidelines or attempts to abuse the tracking system.</p>
              </div>
            </div>

            {/* 6 */}
            <div>
              <h3 className="text-lg font-bold text-gray-900">6. Disclaimer of Warranties</h3>
              <p className="mt-2">
                The Service is provided on an "AS IS" and "AS AVAILABLE" basis. BC Social Media Services makes no warranties, expressed or implied, regarding the continuous, error-free, or uninterrupted operation of its serverless databases, edge functions, or hosting nodes. We are not liable for transient system downtimes, external API disruptions, or data syncing delays.
              </p>
            </div>

            {/* 7 */}
            <div>
              <h3 className="text-lg font-bold text-gray-900">7. Limitation of Liability</h3>
              <p className="mt-2">
                To the maximum extent permitted by applicable law, in no event shall BC Social Media Services, its founders, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses resulting from your access to or inability to use the platform. Our total cumulative liability shall not exceed the amount you paid us in the preceding three (3) months.
              </p>
            </div>

            {/* 8 */}
            <div>
              <h3 className="text-lg font-bold text-gray-900">8. Modifications to Terms</h3>
              <p className="mt-2">
                We reserve the right, at our sole discretion, to modify, update, or replace these Terms and Conditions at any time. When updates occur, the "Last Updated" date at the top of this document will change. Continued use of the platform or enrollment in the affiliate program after modifications constitute your acceptance of the revised Terms.
              </p>
            </div>

            {/* 9 */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-500" />
                9. Contact Information
              </h3>
              <p className="mt-2">
                If you have any questions, concerns, or requests regarding these Terms and Conditions or the Affiliate Program, please contact us directly via the support channels listed on our official domain:
              </p>
              <p className="mt-1">
                Website:{" "}
                <a href="https://bcsocialmediaservices.online/" className="text-indigo-600 hover:underline font-medium">https://bcsocialmediaservices.online/</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
