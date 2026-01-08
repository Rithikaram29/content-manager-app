/*
  # Content Ops Dashboard Schema

  1. Enums
    - `content_stage`: Idea, Script, Shooting, Editing, Scheduled, Posted
    - `social_platform`: IG, YT, Podcast, Shorts

  2. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique, not null)
      - `created_at` (timestamptz)

    - `content_items`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key to categories)
      - `name` (text, not null)
      - `raw_file_urls` (text array, default empty)
      - `inspo_urls` (text array, default empty)
      - `final_url` (text, nullable)
      - `stage` (content_stage enum, default 'Idea')
      - `social` (social_platform enum, default 'IG')
      - `timeline_days` (integer, default 1)
      - `scheduled_date` (date, nullable - NULL means backlog)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Triggers
    - Auto-update `updated_at` timestamp on content_items

  4. Security
    - Enable RLS on both tables
    - Allow all CRUD operations for authenticated users
    - No access for anonymous users
*/

-- Create enums
DO $$ BEGIN
  CREATE TYPE content_stage AS ENUM ('Idea', 'Script', 'Shooting', 'Editing', 'Scheduled', 'Posted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE social_platform AS ENUM ('IG', 'YT', 'Podcast', 'Shorts');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create content_items table
CREATE TABLE IF NOT EXISTS content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  raw_file_urls text[] NOT NULL DEFAULT '{}',
  inspo_urls text[] NOT NULL DEFAULT '{}',
  final_url text,
  stage content_stage NOT NULL DEFAULT 'Idea',
  social social_platform NOT NULL DEFAULT 'IG',
  timeline_days int NOT NULL DEFAULT 1,
  scheduled_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to content_items
DROP TRIGGER IF EXISTS update_content_items_updated_at ON content_items;
CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Authenticated users can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for content_items
CREATE POLICY "Authenticated users can view content items"
  ON content_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert content items"
  ON content_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update content items"
  ON content_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete content items"
  ON content_items FOR DELETE
  TO authenticated
  USING (true);