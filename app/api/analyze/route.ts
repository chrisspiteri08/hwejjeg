import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase, WardrobeItemMetadata } from '@/lib/supabase';

const ANALYSIS_PROMPT = `You are a fashion analysis AI. Analyze the clothing item in the image and return a JSON object with exactly these fields:
- garment_type: string (e.g. "t-shirt", "jeans", "sneakers", "blazer", "dress", "coat", "skirt", "shorts", "sweater", "boots")
- colour: string (primary colour name)
- colours: array of strings (all notable colours present)
- style: string (e.g. "casual", "smart-casual", "formal", "athletic", "bohemian", "streetwear", "classic")
- formality: number from 1 to 5 (1=very casual like gym wear, 3=smart-casual, 5=very formal like black tie)
- season: array of strings from ["spring", "summer", "autumn", "winter"] (suitable seasons)
- description: string (one sentence natural language description of the item)
- tags: array of strings (searchable tags for this item, e.g. ["slim fit", "cotton", "navy", "work"])

Return ONLY valid JSON. No markdown, no explanation, no code blocks.`;

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

    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';

    const response = await client.chat.completions.create({
      model: process.env.OPENROUTER_VISION_MODEL ?? 'mistralai/mistral-small-3.1-24b-instruct:free',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            { type: 'text', text: ANALYSIS_PROMPT },
          ],
        },
      ],
    });

    const responseText = response.choices[0]?.message?.content ?? '';
    let metadata: WardrobeItemMetadata;

    try {
      metadata = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
      }
      metadata = JSON.parse(jsonMatch[0]);
    }

    const { data, error } = await supabase
      .from('wardrobe_items')
      .insert({
        user_id: 'demo',
        image_base64: base64,
        image_mime: mimeType,
        metadata,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
