import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";

export default function Upload() {
  const [images, setImages] = useState<{ url: string; name: string }[]>([]);

  useEffect(() => {
    // Uploads/samples were backed by a Vercel filesystem endpoint.
    // On serverless this isn't reliable, so this page is now a simple gallery placeholder.
    setImages([]);
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center shadow-sm">
            <ImageIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Uploads</h1>
            <p className="text-sm text-gray-500">Uploads are being upgraded for serverless hosting.</p>
          </div>
        </div>

        {images.length === 0 && (
          <div className="mt-6 text-sm text-gray-500">No images available.</div>
        )}
      </div>
    </div>
  );
}
