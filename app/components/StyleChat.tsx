'use client';

import { useState } from 'react';
import { WardrobeItem } from '@/lib/supabase';

interface OutfitSlot {
  item_id: string;
  reason: string;
  item?: WardrobeItem;
}

interface OutfitSuggestion {
  outfit: {
    top: OutfitSlot | null;
    bottom: OutfitSlot | null;
    footwear: OutfitSlot | null;
    outerwear: OutfitSlot | null;
    accessories: OutfitSlot[];
  };
  styling_notes: string;
  occasion_fit: string;
}

interface StyleResponse {
  suggestion: OutfitSuggestion | null;
  message?: string;
}

const QUICK_PROMPTS = [
  'Professional meeting, indoors',
  'Casual weekend brunch',
  'First date, evening',
  'Gym session',
  'Job interview',
  'Outdoor summer picnic',
];

function OutfitCard({ slot, label }: { slot: OutfitSlot | null; label: string }) {
  if (!slot || !slot.item) return null;
  const { item } = slot;
  return (
    <div className="flex gap-3 bg-white rounded-xl p-3 border border-slate-100">
      <div className="flex-shrink-0">
        {item.image_base64 ? (
          <img
            src={`data:${item.image_mime};base64,${item.image_base64}`}
            alt={item.metadata.garment_type}
            className="w-14 h-14 object-cover rounded-lg"
          />
        ) : (
          <div className="w-14 h-14 bg-slate-100 rounded-lg" />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">{label}</span>
        </div>
        <p className="text-sm font-medium text-slate-800 capitalize mt-0.5">{item.metadata.garment_type}</p>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{slot.reason}</p>
      </div>
    </div>
  );
}

export default function StyleChat() {
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<StyleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (text?: string) => {
    const query = text ?? context;
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fetch('/api/style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: query }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const suggestion = response?.suggestion;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-1">What are you dressing for?</h3>
        <p className="text-sm text-slate-500 mb-4">Tell me the occasion, weather, or vibe and I'll pick the perfect outfit.</p>

        <div className="flex gap-2">
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. casual lunch, 22°C, outdoors"
            className="flex-1 px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          />
          <button
            onClick={() => handleSubmit()}
            disabled={loading || !context.trim()}
            className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            )}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => { setContext(p); handleSubmit(p); }}
              disabled={loading}
              className="px-3 py-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-full hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors disabled:opacity-60"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 rounded-xl text-sm text-red-600">{error}</div>
      )}

      {response?.message && !suggestion && (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
          <p className="text-sm text-amber-700">{response.message}</p>
        </div>
      )}

      {suggestion && (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <h4 className="font-semibold text-slate-800 mb-3">Your Outfit</h4>
          <div className="flex flex-col gap-2">
            <OutfitCard slot={suggestion.outfit.top} label="Top" />
            <OutfitCard slot={suggestion.outfit.bottom} label="Bottom" />
            <OutfitCard slot={suggestion.outfit.footwear} label="Footwear" />
            <OutfitCard slot={suggestion.outfit.outerwear} label="Outerwear" />
            {suggestion.outfit.accessories.map((acc, i) => (
              <OutfitCard key={i} slot={acc} label="Accessory" />
            ))}
          </div>

          <div className="mt-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1">Styling Notes</p>
            <p className="text-sm text-indigo-900">{suggestion.styling_notes}</p>
          </div>
          <div className="mt-2 p-3 bg-white rounded-xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Why This Works</p>
            <p className="text-sm text-slate-700">{suggestion.occasion_fit}</p>
          </div>
        </div>
      )}
    </div>
  );
}
