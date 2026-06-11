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

interface WeatherInfo {
  temp: number;
  condition: string;
  emoji: string;
}

const WMO_CODES: Record<number, { condition: string; emoji: string }> = {
  0: { condition: 'clear sky', emoji: '☀️' },
  1: { condition: 'mainly clear', emoji: '🌤️' },
  2: { condition: 'partly cloudy', emoji: '⛅' },
  3: { condition: 'overcast', emoji: '☁️' },
  45: { condition: 'foggy', emoji: '🌫️' },
  48: { condition: 'foggy', emoji: '🌫️' },
  51: { condition: 'light drizzle', emoji: '🌦️' },
  53: { condition: 'drizzle', emoji: '🌦️' },
  55: { condition: 'heavy drizzle', emoji: '🌧️' },
  61: { condition: 'light rain', emoji: '🌧️' },
  63: { condition: 'rain', emoji: '🌧️' },
  65: { condition: 'heavy rain', emoji: '🌧️' },
  71: { condition: 'light snow', emoji: '🌨️' },
  73: { condition: 'snow', emoji: '❄️' },
  75: { condition: 'heavy snow', emoji: '❄️' },
  80: { condition: 'rain showers', emoji: '🌦️' },
  81: { condition: 'rain showers', emoji: '🌧️' },
  82: { condition: 'heavy rain showers', emoji: '⛈️' },
  95: { condition: 'thunderstorm', emoji: '⛈️' },
  99: { condition: 'thunderstorm with hail', emoji: '⛈️' },
};

const QUICK_PROMPTS = [
  'Professional meeting, indoors',
  'Casual weekend brunch',
  'First date, evening',
  'Gym session',
  'Job interview',
  'Outdoor picnic',
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
        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">{label}</span>
        <p className="text-sm font-medium text-slate-800 capitalize mt-0.5">{item.metadata.garment_type}</p>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{slot.reason}</p>
      </div>
    </div>
  );
}

async function fetchWeather(): Promise<WeatherInfo> {
  const position = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
  );
  const { latitude, longitude } = position.coords;
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode&timezone=auto`
  );
  const data = await res.json();
  const temp = Math.round(data.current.temperature_2m);
  const code = data.current.weathercode as number;
  const { condition, emoji } = WMO_CODES[code] ?? { condition: 'unknown', emoji: '🌡️' };
  return { temp, condition, emoji };
}

export default function StyleChat() {
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<StyleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const loadWeather = async () => {
    setWeatherLoading(true);
    try {
      const w = await fetchWeather();
      setWeather(w);
    } catch {
      setError('Could not get location. Allow location access and try again.');
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleSubmit = async (text?: string) => {
    const query = text ?? context;
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const weatherSuffix = weather
        ? `. Current weather: ${weather.temp}°C, ${weather.condition}`
        : '';
      const res = await fetch('/api/style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: query + weatherSuffix }),
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
        <p className="text-sm text-slate-500 mb-3">Tell me the occasion and I'll pick the perfect outfit.</p>

        {/* Weather strip */}
        <div className="flex items-center gap-2 mb-3">
          {weather ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 border border-sky-100 rounded-xl text-sm text-sky-700">
              <span>{weather.emoji}</span>
              <span className="font-medium">{weather.temp}°C</span>
              <span className="capitalize">{weather.condition}</span>
              <button onClick={loadWeather} className="ml-1 text-sky-400 hover:text-sky-600">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={loadWeather}
              disabled={weatherLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-sky-50 hover:border-sky-200 hover:text-sky-600 transition-colors disabled:opacity-60"
            >
              {weatherLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              )}
              {weatherLoading ? 'Getting weather...' : 'Use my current weather'}
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. casual lunch, outdoors"
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
              className="px-3 py-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-full hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors disabled:opacity-60 cursor-pointer"
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
