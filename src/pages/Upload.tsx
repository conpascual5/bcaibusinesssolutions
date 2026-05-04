import { useState, useEffect, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Trash2, Check, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

interface SampleImage {
  url: string;
  name: string;
}

export default function UploadPage() {
  const [images, setImages] = useState<SampleImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSamples = useCallback(async () => {
    try {
      const res = await fetch('/api/samples');
      const data = await res.json();
      if (data.images) setImages(data.images);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchSamples();
  }, [fetchSamples]);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Only image files are allowed' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `${file.name} uploaded successfully!` });
        await fetchSamples();
      } else {
        setMessage({ type: 'error', text: data.error || 'Upload failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const deleteImage = async (name: string) => {
    try {
      await fetch(`/api/samples/${name}`, { method: 'DELETE' });
      await fetchSamples();
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            <h1 className="text-3xl font-extrabold text-gray-900">Manage Portfolio Images</h1>
            <p className="text-gray-500 mt-1">Upload the ad creatives you want to showcase on your landing page.</p>
          </div>
        </div>

        {/* Upload Area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            dragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <input
            id="file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-600 font-medium">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Upload className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-700 font-semibold">
                  Drop an image here or click to browse
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Supports JPG, PNG, GIF, WebP
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className={`mt-4 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <Check className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )}
            {message.text}
          </div>
        )}

        {/* Uploaded Images */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-500" />
            Uploaded Images ({images.length})
          </h2>

          {images.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No images uploaded yet</p>
              <p className="text-sm text-gray-400 mt-1">Drop your ad creatives above to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img) => (
                <div key={img.name} className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-[4/3] relative">
                    <img
                      src={img.url}
                      alt={img.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500 truncate flex-1">{img.name}</span>
                    <button
                      onClick={() => deleteImage(img.name)}
                      className="w-7 h-7 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-10 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-bold text-blue-900 mb-2">How it works</h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Upload your ad creative images above</li>
            <li>They will automatically appear in the <strong>"Static Ad Creatives"</strong> section on the homepage</li>
            <li>Visitors can click to view them full-size in a lightbox</li>
            <li>Delete any image by hovering and clicking the trash icon</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
