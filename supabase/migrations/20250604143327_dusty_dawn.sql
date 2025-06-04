/*
  # Create initial schema for Star Vote application

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - Matches Auth user ID
      - `email` (text, unique)
      - `name` (text)
      - `role` (text) - Either 'admin' or 'voter'
      - `created_at` (timestamptz)
    - `events`
      - `id` (text, primary key) - Short unique ID
      - `title` (text)
      - `description` (text, nullable)
      - `admin_id` (uuid, foreign key to users.id)
      - `start_timestamp` (timestamptz)
      - `end_timestamp` (timestamptz)
      - `status` (text) - 'draft', 'open', or 'closed'
      - `created_at` (timestamptz)
    - `categories`
      - `id` (uuid, primary key)
      - `event_id` (text, foreign key to events.id)
      - `name` (text)
      - `created_at` (timestamptz)
    - `items`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key to categories.id)
      - `name` (text)
      - `thumbnail_url` (text, nullable)
      - `created_at` (timestamptz)
    - `votes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users.id)
      - `item_id` (uuid, foreign key to items.id)
      - `stars` (integer) - Between 0 and 5
      - `timestamp` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'voter')),
  created_at timestamptz DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text,
  admin_id uuid REFERENCES users(id) NOT NULL,
  start_timestamp timestamptz NOT NULL,
  end_timestamp timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'open', 'closed')) DEFAULT 'draft',
  created_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  thumbnail_url text,
  created_at timestamptz DEFAULT now()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  item_id uuid REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  stars integer NOT NULL CHECK (stars >= 0 AND stars <= 5),
  timestamp timestamptz DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Set up RLS policies for users table
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Set up RLS policies for events table
CREATE POLICY "Anyone can read events"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update their own events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (admin_id = auth.uid());

CREATE POLICY "Admins can delete their own events"
  ON events
  FOR DELETE
  TO authenticated
  USING (admin_id = auth.uid() AND status = 'draft');

-- Set up RLS policies for categories table
CREATE POLICY "Anyone can read categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = categories.event_id 
      AND events.admin_id = auth.uid()
    )
  );

-- Set up RLS policies for items table
CREATE POLICY "Anyone can read items"
  ON items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage items"
  ON items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM categories
      JOIN events ON events.id = categories.event_id
      WHERE categories.id = items.category_id
      AND events.admin_id = auth.uid()
    )
  );

-- Set up RLS policies for votes table
CREATE POLICY "Users can read all votes"
  ON votes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own votes"
  ON votes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own votes"
  ON votes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create a function to handle user creation after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', new.email), 'voter');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function after a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();