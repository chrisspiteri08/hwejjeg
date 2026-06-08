'use client';

import { WardrobeItem } from '@/lib/supabase';

interface WardrobeGridProps {
  items: WardrobeItem[];
  loading: boolean;
}

const formalityStars = (n: number) => {
  const rounded = Math.round(n);
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < rounded ? 'text-amber-400' : 'text-slate-200'}>★</span>
  ));
};

const styleColor: Record<string, string> = {
  casual: 'bg-green-50 text-green-700',
  'smart-casual': 'bg-blue-50 text-blue-700',
  formal: 'bg-purple-50 text-purple-700',
  athletic: 'bg-orange-50 text-orange-700',
  bohemian: 'bg-pink-50 text-pink-700',
  streetwear: 'bg-slate-100 text-slate-700',
  classic: 'bg-amber-50 text-amber-700',
};

export default function WardrobeGrid({ items, loading }: WardrobeGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-slate-100 rounded-2xl h-52 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="font-medium text-slate-600">No items yet</p>
        <p className="text-sm text-slate-400 mt-1">Upload photos to build your wardrobe</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
          {item.image_base64 ? (
            <img
              src={`data:${item.image_mime};base64,${item.image_base64}`}
              alt={item.metadata.garment_type}
              className="w-full h-36 object-cover"
            />
          ) : (
            <div className="w-full h-36 bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="p-3">
            <p className="font-medium text-slate-800 text-sm capitalize truncate">{item.metadata.garment_type}</p>
            <p className="text-xs text-slate-400 mt-0.5">{item.metadata.colour}</p>
            <div className="flex items-center justify-between mt-2">
              <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${styleColor[item.metadata.style] || 'bg-slate-100 text-slate-600'}`}>
                {item.metadata.style}
              </span>
              <span className="text-xs flex">{formalityStars(item.metadata.formality)}</span>
            </div>
            {item.metadata.season && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.metadata.season.slice(0, 2).map((s) => (
                  <span key={s} className="text-xs text-slate-400 capitalize">{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
