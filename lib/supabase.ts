import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface WardrobeItemMetadata {
  garment_type: string;
  colour: string;
  colours: string[];
  style: string;
  formality: number;
  season: string[];
  description: string;
  tags: string[];
}

export interface WardrobeItem {
  id: string;
  user_id: string;
  image_base64: string | null;
  image_mime: string;
  metadata: WardrobeItemMetadata;
  created_at: string;
}
