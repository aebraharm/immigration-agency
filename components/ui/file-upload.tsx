'use client';

import { FileUp, Trash2, Image as ImageIcon, Video } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  value: string; onChange: (value: string) => void; accept?: string;
  kind?: 'image' | 'video' | 'any'; maxSizeMb?: number; label?: string;
  compact?: boolean; className?: string;
}

export function FileUpload({ value, onChange, accept = 'image/*', kind = 'image', maxSizeMb = 3, label = 'Upload from device', compact, className }: FileUploadProps) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  function readFile(file?: File) {
    if (!file) return;
    setError('');
    if (file.size > maxSizeMb * 1024 * 1024) { setError(`File is too large. Choose a file under ${maxSizeMb} MB.`); return; }
    if (kind === 'image' && !file.type.startsWith('image/')) { setError('Please choose an image file.'); return; }
    if (kind === 'video' && !file.type.startsWith('video/')) { setError('Please choose a video file.'); return; }
    const reader = new FileReader();
    reader.onprogress = (event) => { if (event.lengthComputable) setProgress(Math.round(event.loaded / event.total * 100)); };
    reader.onerror = () => { setError('This file could not be read. Please try another file.'); setProgress(0); };
    reader.onload = () => { onChange(String(reader.result)); setProgress(100); };
    reader.readAsDataURL(file);
  }

  const isVideo = value.startsWith('data:video') || (kind === 'video' && !value.startsWith('data:image'));
  return <div className={className}>
    <input ref={input} type="file" accept={accept} className="sr-only" onChange={(event) => { readFile(event.target.files?.[0]); event.target.value = ''; }} />
    <div className={cn('relative overflow-hidden rounded-xl border border-dashed border-ink-900/20 bg-cream', compact ? 'p-3' : 'p-4')}>
      {value ? <div className="flex items-center gap-3">
        <div className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white', compact ? 'h-12 w-16' : 'h-20 w-24')}>
          {isVideo ? <video src={value} className="h-full w-full object-cover" muted /> : <img src={value} alt="Current upload preview" className="h-full w-full object-contain" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-ink-900">{value.startsWith('data:') ? 'Device upload ready' : 'Current media'}</p>
          <p className="mt-1 text-[11px] text-ink-500">{isVideo ? 'Video preview available' : 'Preview updates immediately'}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => input.current?.click()}><FileUp className="h-3.5 w-3.5" />Replace</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { onChange(''); setProgress(0); }}><Trash2 className="h-3.5 w-3.5" />Remove</Button>
          </div>
        </div>
      </div> : <button type="button" onClick={() => input.current?.click()} className="btn flex w-full flex-col items-center justify-center rounded-lg border border-transparent px-4 py-5 text-center hover:bg-red-50">
        {kind === 'video' ? <Video className="mb-2 h-5 w-5 text-red-600" /> : <ImageIcon className="mb-2 h-5 w-5 text-red-600" />}
        <span className="text-xs font-bold">{label}</span><span className="mt-1 text-[11px] opacity-70">Up to {maxSizeMb} MB · Stored with this record</span>
      </button>}
      {progress > 0 && progress < 100 && <div className="absolute bottom-0 left-0 h-1 bg-red-600 transition-all" style={{ width: `${progress}%` }} />}
    </div>
    {error && <p className="mt-2 text-xs font-medium text-red-600" role="alert">{error}</p>}
  </div>;
}
