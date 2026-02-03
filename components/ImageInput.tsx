
import React from 'react';
import { Upload, X } from 'lucide-react';
import { UploadedImage } from '../types';

interface ImageInputProps {
  label: string;
  description?: string;
  onUpload: (image: UploadedImage) => void;
  onRemove?: (id: string) => void;
  images?: UploadedImage[];
  multiple?: boolean;
  maxFiles?: number;
}

const ImageInput: React.FC<ImageInputProps> = ({
  label,
  description,
  onUpload,
  onRemove,
  images = [],
  multiple = false,
  maxFiles = 5,
}) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      if (multiple && images.length + i >= maxFiles) break;
      
      const file = files[i];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const base64 = dataUrl.split(',')[1];
          onUpload({
            id: Math.random().toString(36).substr(2, 9),
            url: dataUrl,
            base64,
            mimeType: file.type,
            name: file.name,
            width: img.width,
            height: img.height,
          });
        };
        img.src = dataUrl;
      };
      
      reader.readAsDataURL(file);
      if (!multiple) break; 
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-slate-100">{label}</h3>
        {description && <p className="text-sm text-slate-400">{description}</p>}
      </div>

      <div className={`${multiple ? 'grid grid-cols-2 sm:grid-cols-3' : 'block'} gap-4`}>
        {images.map((img) => (
          <div key={img.id} className="relative group rounded-xl overflow-hidden border border-white/10 bg-slate-900 shadow-lg mb-4 last:mb-0">
            <img 
              src={img.url} 
              alt={img.name} 
              className="w-full h-auto block" 
            />
            {onRemove && (
              <button
                onClick={() => onRemove(img.id)}
                className="absolute top-2 right-2 p-1.5 bg-red-500/90 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 shadow-xl"
              >
                <X size={16} />
              </button>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[10px] text-white/70 truncate">{img.name}</p>
            </div>
          </div>
        ))}

        {(multiple ? images.length < maxFiles : images.length === 0) && (
          <label className={`relative ${multiple ? 'aspect-[2/3]' : 'aspect-video'} flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30 hover:bg-indigo-600/5 hover:border-indigo-500/50 cursor-pointer transition-all group`}>
            <div className="p-3 rounded-full bg-slate-800 group-hover:bg-indigo-600/20 group-hover:scale-110 transition-all mb-3">
              <Upload className="text-slate-500 group-hover:text-indigo-400" size={24} />
            </div>
            <span className="text-xs text-slate-500 group-hover:text-indigo-400 font-bold uppercase tracking-wider">
              {multiple ? `Add (${images.length}/${maxFiles})` : 'Upload Poster'}
            </span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              multiple={multiple}
            />
          </label>
        )}
      </div>
    </div>
  );
};

export default ImageInput;
