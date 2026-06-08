'use client';

import { useState, useRef } from 'react';
import { WardrobeItem } from '@/lib/supabase';

interface UploadItemProps {
  onItemAdded: (item: WardrobeItem) => void;
}

export default function UploadItem({ onItemAdded }: UploadItemProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WardrobeItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setResult(data.item);
      onItemAdded(data.item);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setFile(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const formalityLabel = (n: number) => {
    const labels = ['', 'Very Casual', 'Casual', 'Smart-Casual', 'Semi-Formal', 'Formal'];
    return labels[Math.round(n)] || '';
  };

  if (result) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-800">Item Added</h3>
        </div>
        <div className="flex gap-4">
          {result.image_base64 && (
            <img
              src={`data:${result.image_mime};base64,${result.image_base64}`}
              alt={result.metadata.garment_type}
              className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            <p className="font-medium text-slate-800 capitalize">{result.metadata.garment_type}</p>
            <p className="text-sm text-slate-500 mt-0.5">{result.metadata.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded-full capitalize">{result.metadata.style}</span>
              <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">{result.metadata.colour}</span>
              <span className="px-2 py-0.5 text-xs bg-amber-50 text-amber-700 rounded-full">{formalityLabel(result.metadata.formality)}</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="mt-4 w-full py-2.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors"
        >
          Add Another Item
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <h3 className="font-semibold text-slate-800 mb-1">Add Clothing Item</h3>
      <p className="text-sm text-slate-500 mb-4">Take or upload a photo and AI will analyze it automatically.</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        id="image-upload"
      />

      {!preview ? (
        <label
          htmlFor="image-upload"
          className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-slate-600">Tap to take photo or upload</span>
          <span className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP supported</span>
        </label>
      ) : (
        <div className="relative">
          <img src={preview} alt="Preview" className="w-full h-56 object-cover rounded-2xl" />
          <button
            onClick={handleReset}
            className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-50 rounded-xl text-sm text-red-600">{error}</div>
      )}

      {preview && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="mt-4 w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing...
            </>
          ) : (
            'Analyze & Save'
          )}
        </button>
      )}
    </div>
  );
}
