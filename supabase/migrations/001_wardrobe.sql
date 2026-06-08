-- Wardrobe items table
create table if not exists wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'demo',
  image_base64 text,
  image_mime text default 'image/jpeg',
  metadata jsonb not null,
  created_at timestamptz default now()
);

-- Index for fast user queries
create index if not exists wardrobe_items_user_id_idx on wardrobe_items(user_id);

-- metadata shape:
-- {
--   garment_type: string,
--   colour: string,
--   colours: string[],
--   style: string,
--   formality: number (1-5),
--   season: string[],
--   description: string,
--   tags: string[]
-- }
