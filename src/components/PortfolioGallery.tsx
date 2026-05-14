import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Camera, ImageOff, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router';

interface PortfolioImage {
  name: string;
  url: string;
}

export default function PortfolioGallery() {
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadImages = useCallback(async () => {
    try {
      const { data, error } = await supabase.storage
        .from("portfolio")
        .list("", { sortBy: { column: "created_at", order: "desc" } });

      if (error) throw error;

      const portfolioImages: PortfolioImage[] = (data || [])
        .filter((f) => f.metadata?.mimetype?.startsWith("image/"))
        .map((f) => {
          const { data: urlData } = supabase.storage
            .from("portfolio")
            .getPublicUrl(f.name);
          return { name: f.name, url: urlData.publicUrl };
        });

      setImages(portfolioImages);
    } catch (err) {
      console.error("Error loading portfolio images:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);

  const goPrev = () => {
    setSelectedIndex((prev) =>
      prev !== null ? (prev === 0 ? images.length - 1 : prev - 1) : null
    );
  };

  const goNext = () => {
    setSelectedIndex((prev) =>
      prev !== null ? (prev === images.length - 1 ? 0 : prev + 1) : null
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
        <ImageOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No portfolio images yet</p>
        <Link
          to="/upload"
          className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Upload images
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {images.map((img, index) => (
          <button
            key={img.name}
            onClick={() => openLightbox(index)}
            className="group relative overflow-hidden rounded-2xl bg-gray-100 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="aspect-[4/3] relative">
              <img
                src={img.url}
                alt={img.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center backdrop-blur">
                  <Camera className="w-5 h-5 text-gray-900" />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div
            className="max-w-4xl max-h-[85vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[selectedIndex].url}
              alt={images[selectedIndex].name}
              className="w-full h-full object-contain rounded-2xl shadow-2xl"
            />
            <div className="flex items-center justify-between mt-4 px-2">
              <p className="text-white/70 text-sm">
                {images[selectedIndex].name.replace(/\\.[^/.]+$/, '')}
              </p>
              <p className="text-white/50 text-sm">
                {selectedIndex + 1} / {images.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
