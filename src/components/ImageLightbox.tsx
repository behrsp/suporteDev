import React from 'react';
import { X, ZoomIn, Download } from 'lucide-react';

interface ImageLightboxProps {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  imageUrl,
  title,
  onClose,
}) => {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-3 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-blue-500/30 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-2 min-w-0">
            <ZoomIn className="h-4 w-4 text-blue-400 shrink-0" />
            <span className="text-sm font-semibold text-slate-200 truncate">
              {title || 'Visualização de Imagem'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              download={`suporte-protheus-${Date.now()}.jpg`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition"
            >
              <Download className="h-3.5 w-3.5 text-blue-400" />
              <span>Baixar</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-300 p-1.5 text-slate-400 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center bg-slate-950">
          <img
            src={imageUrl}
            alt={title || 'Anexo'}
            className="max-h-[78vh] w-auto object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

