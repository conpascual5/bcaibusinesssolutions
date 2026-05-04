import { useState, useRef, useEffect } from 'react';
import { X, Type, Download, RotateCcw, Check } from 'lucide-react';

interface TextOverlayModalProps {
  imageUrl: string;
  onClose: () => void;
  onSave: (text: string, settings: any, finalImageUrl: string) => void;
  initialText?: string;
  initialSettings?: any;
}

export default function TextOverlayModal({ imageUrl, onClose, onSave, initialText, initialSettings }: TextOverlayModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState(initialText || 'SALE\n50% OFF');
  const [font, setFont] = useState(initialSettings?.font || 'Inter');
  const [fontSize, setFontSize] = useState(initialSettings?.size || 48);
  const [color, setColor] = useState(initialSettings?.color || '#FFFFFF');
  const [position, setPosition] = useState(initialSettings?.position || 'center');
  const [shadow, setShadow] = useState(true);
  const [bgOpacity, setBgOpacity] = useState(0.3);
  const [isBold, setIsBold] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      drawCanvas(ctx, img);
      setLoading(false);
    };
    img.onerror = () => setLoading(false);
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => drawCanvas(ctx, img);
    img.src = imageUrl;
  }, [text, font, fontSize, color, position, shadow, bgOpacity, isBold]);

  function drawCanvas(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(img, 0, 0);

    if (!text.trim()) return;

    const lines = text.split('\n');
    const padding = 20;
    const lineHeight = fontSize * 1.3;
    const totalHeight = lines.length * lineHeight;

    if (bgOpacity > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${bgOpacity})`;
      let y = getYPosition(ctx.canvas.height, totalHeight, position);
      ctx.fillRect(0, y - lineHeight / 2, ctx.canvas.width, totalHeight + lineHeight / 2);
    }

    ctx.font = `${isBold ? 'bold' : 'normal'} ${fontSize}px ${font}, sans-serif`;
    ctx.textAlign = position === 'left' ? 'left' : position === 'right' ? 'right' : 'center';
    
    const x = position === 'left' ? padding : position === 'right' ? ctx.canvas.width - padding : ctx.canvas.width / 2;
    let y = getYPosition(ctx.canvas.height, totalHeight, position);

    lines.forEach((line) => {
      if (shadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      }
      ctx.fillStyle = color;
      ctx.fillText(line, x, y);
      
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      y += lineHeight;
    });
  }

  function getYPosition(canvasHeight: number, totalHeight: number, pos: string) {
    if (pos === 'top') return fontSize + 10;
    if (pos === 'bottom') return canvasHeight - totalHeight + fontSize;
    return canvasHeight / 2 - totalHeight / 2 + fontSize;
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `ad-with-text-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const finalUrl = canvas.toDataURL('image/png');
    onSave(text, { font, color, size: fontSize, position, shadow, bgOpacity, isBold }, finalUrl);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Type className="w-5 h-5 text-blue-600" />
            Add Text to Image
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          <div className="flex-1 bg-gray-900 flex items-center justify-center p-4 overflow-auto">
            {loading && (
              <div className="text-white text-sm">Loading image...</div>
            )}
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
              style={{ display: loading ? 'none' : 'block' }}
            />
          </div>

          <div className="w-full lg:w-80 border-l border-gray-100 overflow-y-auto p-5 space-y-5">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Text</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter text... (use newline for multiple lines)"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Font</label>
              <select
                value={font}
                onChange={(e) => setFont(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Inter">Inter (Modern)</option>
                <option value="Georgia">Georgia (Elegant)</option>
                <option value="Arial Black">Arial Black (Bold)</option>
                <option value="Courier New">Courier New (Retro)</option>
                <option value="Brush Script MT">Brush Script (Stylish)</option>
                <option value="Impact">Impact (Strong)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Size ({fontSize}px)</label>
              <input
                type="range"
                min={16}
                max={120}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Color</label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {['#FFFFFF', '#000000', '#FF0000', '#FFD700', '#00FF00', '#0099FF', '#FF69B4', '#FF8C00'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-gray-900 scale-110' : 'border-gray-200'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Position</label>
              <div className="flex gap-1 mt-2">
                <button onClick={() => setPosition('top')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${position === 'top' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>Top</button>
                <button onClick={() => setPosition('center')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${position === 'center' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>Center</button>
                <button onClick={() => setPosition('bottom')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${position === 'bottom' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>Bottom</button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isBold} onChange={(e) => setIsBold(e.target.checked)} className="w-4 h-4" />
                <span className="text-sm text-gray-700">Bold text</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={shadow} onChange={(e) => setShadow(e.target.checked)} className="w-4 h-4" />
                <span className="text-sm text-gray-700">Text shadow</span>
              </label>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Background Bar ({Math.round(bgOpacity * 100)}%)</label>
              <input
                type="range"
                min={0}
                max={80}
                value={Math.round(bgOpacity * 100)}
                onChange={(e) => setBgOpacity(Number(e.target.value) / 100)}
                className="w-full mt-2"
              />
            </div>

            <div className="pt-4 space-y-2">
              <button
                onClick={handleSave}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Save to Library
              </button>
              <button
                onClick={handleDownload}
                className="w-full py-3 bg-blue-50 text-blue-700 rounded-xl font-semibold hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </button>
              <button
                onClick={() => { setText(''); setBgOpacity(0); }}
                className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Text
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
