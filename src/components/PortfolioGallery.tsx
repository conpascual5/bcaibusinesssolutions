import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Camera, ImageOff } from 'lucide-react';

const images = [
  {
    id: '1axYdgO_t_GaHrQ50CDw1_KQjh2MrQkNh',
    title: 'Ad Creative 1',
  },
  {
    id: '125WxWquWkrqKo2_hszuzzbLhOfgJvYQa',
    title: 'Ad Creative 2',
  },
  {
    id: '1EsoKmhnEWWiEDx1XgsUexSjZqVLoaPuI',
    title: 'Ad Creative 3',
  },
  {
    id: '13fOuNkaoT1POrsjIUf0HbtZGSxmrKw7N',
    title: 'Ad Creative 4',
  },
  {
    id: '1sd55Ib-JmJ9l1VyTbTxz_l__up4osg6E',
    title: 'Ad Creative 5',
  },
  {
    id: '117w_EICNTKayshn-XBiz219oDkCxoXxW',
    title: 'Ad Creative 6',
  },
];

function getDirectUrl(fileId: string) {
  // Use Google's image serving CDN for reliable embedding
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

export default function PortfolioGallery() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageError = (id: string) => {
    setFailedImages((prev) => new Set(prev).add(id));
  };

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

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {images.map((img, index) => (
          <button
            key={img.id}
            onClick={() => openLightbox(index)}
            className="group relative overflow-hidden rounded-2xl bg-gray-100 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="aspect-[4/3] relative">
              {failedImages.has(img.id) ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                  <ImageOff className="w-8 h-8 mb-2" />
                  <span className="text-xs">Image unavailable</span>
                </div>
              ) : (
                <img
                  src={getDirectUrl(img.id)}
                  alt={img.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  onError={() => handleImageError(img.id)}
                />
              )}
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
            {failedImages.has(images[selectedIndex].id) ? (
              <div className="w-full aspect-video flex flex-col items-center justify-center bg-gray-800 rounded-2xl text-gray-400">
                <ImageOff className="w-12 h-12 mb-3" />
                <span className="text-sm">Image failed to load</span>
              </div>
            ) : (
              <img
                src={getDirectUrl(images[selectedIndex].id)}
                alt={images[selectedIndex].title}
                className="w-full h-full object-contain rounded-2xl shadow-2xl"
                onError={() => handleImageError(images[selectedIndex].id)}
              />
            )}
            <div className="flex items-center justify-between mt-4 px-2">
              <p className="text-white/70 text-sm">
                {images[selectedIndex].title}
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
