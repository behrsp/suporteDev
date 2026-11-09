import React, { useRef, useState } from 'react';
import { Upload, Camera, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { processDeviceImage } from '../utils/image';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  label?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  label = 'Anexar Imagem / Print do Dispositivo',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const processed: string[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.type.startsWith('image/')) {
          const base64 = await processDeviceImage(file);
          processed.push(base64);
        }
      }
      if (processed.length > 0) {
        onChange([...images, ...processed]);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao carregar imagem.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-blue-300/90">
          {label}
        </label>
        <span className="text-[11px] text-slate-400">
          Galeria, Câmera ou Ctrl+V
        </span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`relative rounded-xl border-2 border-dashed p-4 transition-all ${
          dragOver
            ? 'border-blue-400 bg-blue-500/15'
            : 'border-slate-700/80 bg-slate-900/60 hover:border-blue-500/50 hover:bg-slate-900/90'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/20">
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ImageIcon className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">
                {isProcessing
                  ? 'Otimizando imagem...'
                  : 'Envie print do erro, tela do Protheus ou foto'}
              </p>
              <p className="text-xs text-slate-400">
                PNG, JPG ou WEBP — arraste, escolha do dispositivo ou cole (Ctrl+V)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 px-3 py-2 text-xs font-medium text-blue-200 transition cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Dispositivo</span>
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isProcessing}
              className="inline-flex sm:hidden items-center justify-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition cursor-pointer"
            >
              <Camera className="h-3.5 w-3.5 text-blue-400" />
              <span>Câmera</span>
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
          {errorMsg}
        </p>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="group relative aspect-video rounded-lg overflow-hidden border border-blue-500/30 bg-slate-950"
            >
              <img
                src={img}
                alt={`Anexo ${idx + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950/85 text-slate-200 hover:bg-red-600 hover:text-white transition shadow-md cursor-pointer"
                title="Remover imagem"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

