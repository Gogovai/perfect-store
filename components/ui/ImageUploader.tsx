'use client';

import { useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

type ImageUploaderProps = {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  className?: string;
};

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function ImageUploader({
  value,
  onChange,
  folder = 'products',
  label = 'Product Image',
  className = '',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [mode, setMode] = useState<'upload' | 'url'>(value ? 'url' : 'upload');
  const [urlInput, setUrlInput] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please upload a JPEG, PNG, WebP, or GIF image.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('Image must be smaller than 5MB.');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(path);

      onChange(urlData.publicUrl);
      setUrlInput(urlData.publicUrl);
      setMode('url');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [folder, onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleUrlApply = () => {
    if (urlInput && urlInput.startsWith('http')) {
      onChange(urlInput);
      setError(null);
    } else if (urlInput) {
      setError('Please enter a valid URL starting with http:// or https://');
    }
  };

  const handleRemove = () => {
    onChange('');
    setUrlInput('');
    setMode('upload');
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            mode === 'upload'
              ? 'bg-[#0f2b5b] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Upload from device
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            mode === 'url'
              ? 'bg-[#0f2b5b] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Paste URL
        </button>
      </div>

      {/* Upload Mode */}
      {mode === 'upload' && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFileChange}
            className="hidden"
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              <p className="text-sm text-gray-500">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16V4m0 0L8 8m4-4l4 4" />
              </svg>
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-[#0f2b5b]">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-400">JPEG, PNG, WebP or GIF (max 5MB)</p>
            </div>
          )}
        </div>
      )}

      {/* URL Mode */}
      {mode === 'url' && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {urlInput !== value && (
            <button
              type="button"
              onClick={handleUrlApply}
              className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Apply
            </button>
          )}
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="mt-3 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Preview"
            className="h-24 w-24 rounded-lg object-cover border border-gray-200"
          />
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Remove image
            </button>
            <p className="text-xs text-gray-400 break-all max-w-[200px]">{value}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
