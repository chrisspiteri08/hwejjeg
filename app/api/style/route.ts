import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase, WardrobeItem } from '@/lib/supabase';

const STYLIST_SYSTEM_PROMPT = `You are an expert personal fashion stylist. Your job is to select the perfect outfit from a user's wardrobe for their specific occasion and context.

When given a list of wardrobe items (with their metadata) and the user's context, select items to form a complete outfit. Consider:
- Colour coordination: complementary or matching colours, avoid clashing
- Formality: match the occasion's formality level
- Weather/temperature: select appropriate weights and layers
- Style coherence: items should work together aesthetically
- Practicality: suitable for the stated activity

Respond with ONLY a valid JSON object with this exact structure:
{
  "outfit": {
    "top": { "item_id": "uuid", "reason": "brief reason" } or null if no suitable top,
    "bottom": { "item_id": "uuid", "reason": "brief reason" } or null if no suitable bottom,
    "footwear": { "item_id": "uuid", "reason": "brief reason" } or null if no suitable footwear,
    "outerwear": { "item_id": "uuid", "reason": "brief reason" } or null,
    "accessories": []
  },
  "styling_notes": "2-3 sentences of overall styling advice and how to wear the outfit",
  "occasion_fit": "1 sentence explaining why this outfit works for the occasion"
}

If the wardrobe has no items, return: { "error": "Your wardrobe is empty. Add some items first!" }
If there are insufficient items for a complete outfit, do your best with what's available and note it in styling_notes.`;

export interface OutfitItem {
  item_id: string;
  reason: string;
}

export interface OutfitSuggestion {
  outfit: {
    top: OutfitItem | null;
    bottom: OutfitItem | null;
    footwear: OutfitItem | null;
    outerwear: OutfitItem | null;
    accessories: OutfitItem[];
  };
  styling_notes: string;
  occasion_fit: string;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY is not configured. Add it in Vercel Environment Variables.' },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
    });

    const { context } = await req.json();

    if (!context || typeof context !== 'string') {
      return NextResponse.json({ error: 'Context is required' }, { status: 400 });
    }

    const { data: items, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', 'demo')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({
        suggestion: null,
        message: 'Your wardrobe is empty! Upload some clothing photos first to get outfit suggestions.',
      });
    }

    const wardrobeForAI = items.map((item: WardrobeItem) => ({
      id: item.id,
      metadata: item.metadata,
    }));

    const userMessage = `User's wardrobe (${items.length} items):
${JSON.stringify(wardrobeForAI, null, 2)}

User's occasion/context: "${context}"

Please suggest an outfit from the items above.`;

    const response = await client.chat.completions.create({
      model: 'meta-llama/llama-4-maverick:free',
      messages: [
        { role: 'system', content: STYLIST_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    });

    const responseText = response.choices[0]?.message?.content ?? '';
    let suggestion: OutfitSuggestion;

    try {
      suggestion = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
      }
      suggestion = JSON.parse(jsonMatch[0]);
    }

    if ('error' in suggestion) {
      return NextResponse.json({ suggestion: null, message: (suggestion as { error: string }).error });
    }

    const itemMap = new Map(items.map((item: WardrobeItem) => [item.id, item]));

    const populateItem = (slot: OutfitItem | null) => {
      if (!slot) return null;
      const item = itemMap.get(slot.item_id);
      return item ? { ...slot, item } : null;
    };

    const populatedSuggestion = {
      ...suggestion,
      outfit: {
        top: populateItem(suggestion.outfit.top),
        bottom: populateItem(suggestion.outfit.bottom),
        footwear: populateItem(suggestion.outfit.footwear),
        outerwear: populateItem(suggestion.outfit.outerwear),
        accessories: suggestion.outfit.accessories.map((a) => populateItem(a)).filter(Boolean),
      },
    };

    return NextResponse.json({ suggestion: populatedSuggestion });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
