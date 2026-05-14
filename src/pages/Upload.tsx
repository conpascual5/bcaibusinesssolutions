import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload as UploadIcon,
  ImageIcon,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  ExternalLink,
  Sparkles,
  Database,
} from "lucide-react";

interface PortfolioImage {
  name: string;
  url: string;
  id: string | null;
  created_at: string | null;
}

export default function Upload() {
  const navigate = useNavigate();
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPortfolioImages = useCallback(async () => {
    try {
      const { data, error } = await supabase.storage
        .from("portfolio")
        .list("", { sortBy: { column: "created_at", order: "desc" } });

      if (error) throw error;

      const images: PortfolioImage[] = (data || [])
        .filter((f) => f.metadata?.mimetype?.startsWith("image/"))
        .map((f) => {
          const { data: urlData } = supabase.storage
            .from("portfolio")
            .getPublicUrl(f.name);
          return {
            name: f.name,
            url: urlData.publicUrl,
            id: f.id,
            created_at: f.created_at,
          };
        });

      setPortfolioImages(images);
    } catch (err) {
      console.error("Error loading portfolio:", err);
    } finally {
      setLoadingGallery(false);
    }
  }, []);

  useEffect(() => {
    loadPortfolioImages();
  }, [loadPortfolioImages]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).filter((f) =>
        f.type.startsWith("image/")
      );
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setErrors([]);
    setUploaded([]);

    const uploadedNames: string[] = [];
    const errorMessages: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      const { error } = await supabase.storage
        .from("portfolio")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        errorMessages.push(`${file.name}: ${error.message}`);
      } else {
        uploadedNames.push(file.name);
      }
    }

    setUploaded(uploadedNames);
    setErrors(errorMessages);
    setFiles([]);
    setUploading(false);
    loadPortfolioImages();
  };

  const handleDelete = async (name: string) => {
    setDeleting(name);
    const { error } = await supabase.storage.from("portfolio").remove([name]);
    if (error) {
      console.error("Delete error:", error);
    }
    setDeleting(null);
    loadPortfolioImages();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-200">
                <UploadIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">
                  Portfolio Uploads
                </h1>
                <p className="text-sm text-gray-500">
                  Upload images to showcase on the landing page
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/")}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Landing Page
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 ${
            dragOver
              ? "border-blue-400 bg-blue-50/50 shadow-lg shadow-blue-100"
              : "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-4">
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all ${
                dragOver
                  ? "bg-blue-100 scale-110"
                  : "bg-gray-100"
              }`}
            >
              <UploadIcon
                className={`w-8 h-8 ${
                  dragOver ? "text-blue-600" : "text-gray-400"
                }`}
              />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {dragOver
                  ? "Drop images here"
                  : "Drag & drop images here"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or{" "}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 font-medium hover:text-blue-700 underline underline-offset-2"
                >
                  browse files
                </button>
              </p>
            </div>
            <p className="text-xs text-gray-400">
              Supports JPG, PNG, WebP, GIF — Max 10MB each
            </p>
          </div>
        </div>

        {/* Selected Files Preview */}
        {files.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-500" />
                {files.length} file{files.length > 1 ? "s" : ""} selected
              </h2>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-4 h-4" />
                    Upload to Portfolio
                  </>
                )}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 border border-gray-200"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-[10px] text-white truncate font-medium">
                      {file.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seed Samples Button */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-500" />
                Seed Sample Images
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Upload the 5 sample images from the project to the portfolio
              </p>
            </div>
            <button
              onClick={async () => {
                setUploading(true);
                const sampleFiles = [
                  "1f608e4b-cee6-4069-8b6f-71ebc58b3d3e.jpg",
                  "929ce640-0d58-4597-8191-69e557286a4e.jpg",
                  "abbd3a9e-bea3-43b7-a808-34c426fab15d.jpg",
                  "4336db6d-972e-4b85-b621-8675601b4826.jpg",
                  "a33a1a17-0438-4e6a-aee8-0b7854f9099c.jpg",
                ];
                const uploadedNames: string[] = [];
                const errorMessages: string[] = [];

                for (const fileName of sampleFiles) {
                  try {
                    const response = await fetch(`/samples/${fileName}`);
                    const blob = await response.blob();
                    const file = new File([blob], fileName, { type: "image/jpeg" });

                    const { error } = await supabase.storage
                      .from("portfolio")
                      .upload(fileName, file, {
                        cacheControl: "3600",
                        upsert: true,
                      });

                    if (error) {
                      errorMessages.push(`${fileName}: ${error.message}`);
                    } else {
                      uploadedNames.push(fileName);
                    }
                  } catch (err) {
                    errorMessages.push(`${fileName}: Failed to fetch`);
                  }
                }

                setUploaded(uploadedNames);
                setErrors(errorMessages);
                setUploading(false);
                loadPortfolioImages();
              }}
              disabled={uploading}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-md shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Seeding...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Seed Samples
                </>
              )}
            </button>
          </div>
        </div>

        {/* Upload Results */}
        {uploaded.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-800 text-sm">
                {uploaded.length} file{uploaded.length > 1 ? "s" : ""} uploaded successfully!
              </p>
              <ul className="mt-1 text-xs text-emerald-700 space-y-0.5">
                {uploaded.map((name, i) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-800 text-sm">Upload errors</p>
              <ul className="mt-1 text-xs text-red-700 space-y-0.5">
                {errors.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Portfolio Gallery */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                Portfolio Gallery
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                These images appear on the landing page
              </p>
            </div>
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              {portfolioImages.length} image{portfolioImages.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loadingGallery ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/3] bg-gray-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : portfolioImages.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
              <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No portfolio images yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Upload images above to showcase your work
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {portfolioImages.map((img) => (
                <div
                  key={img.name}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm hover:shadow-lg transition-all"
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                  <button
                    onClick={() => handleDelete(img.name)}
                    disabled={deleting === img.name}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 hover:bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                  >
                    {deleting === img.name ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white truncate font-medium">
                      {img.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
