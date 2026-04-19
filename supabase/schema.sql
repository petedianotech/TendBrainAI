-- Create users table (Extending Supabase Auth if needed, or standalone)
CREATE TABLE users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name TEXT,
  subscription_tier TEXT DEFAULT 'free', -- 'free', 'tier1', 'tier2'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Profiles for Brand settings
CREATE TABLE brand_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  niche TEXT NOT NULL,
  tone TEXT NOT NULL,
  platforms JSONB DEFAULT '[]'::jsonb, -- ['twitter', 'linkedin', 'facebook']
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- AI Generated Posts
CREATE TABLE posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'published'
  scheduled_for TIMESTAMP WITH TIME ZONE,
  platforms JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS (Row Level Security) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view own brand profiles" ON brand_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own brand profiles" ON brand_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can edit own brand profiles" ON brand_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own posts" ON posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can edit own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
