import { Shield } from "lucide-react";

export default function Setup() {
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Setup</h1>
            <p className="text-sm text-gray-500">Setup is handled via Supabase database and Admin Panel.</p>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-600 leading-relaxed">
          If you need an admin account, promote an existing user in the database by setting <code className="px-1.5 py-0.5 bg-gray-100 rounded">profiles.is_admin</code> to <strong>true</strong>.
        </div>
      </div>
    </div>
  );
}
