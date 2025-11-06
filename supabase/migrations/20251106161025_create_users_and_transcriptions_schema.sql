/*
  # VoiceScribe Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `energy_points` (integer, default 100 - free starting points)
      - `subscription_plan` (text, default 'free')
      - `subscription_status` (text, default 'active')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `transcriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `input_type` (text) - 'file', 'youtube', or 'recording'
      - `input_source` (text) - file name, YouTube URL, or 'live_recording'
      - `transcription_text` (text) - the resulting transcription
      - `duration_seconds` (integer) - audio duration
      - `energy_cost` (integer) - points used for this transcription
      - `status` (text, default 'processing') - 'processing', 'completed', 'failed'
      - `created_at` (timestamptz)
    
    - `subscription_plans`
      - `id` (uuid, primary key)
      - `name` (text) - plan name (Basic, Pro, Enterprise)
      - `price` (numeric) - monthly price
      - `energy_points` (integer) - monthly energy points allocation
      - `features` (jsonb) - plan features as JSON
      - `active` (boolean, default true)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Public read access to subscription_plans
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  energy_points integer DEFAULT 100 NOT NULL,
  subscription_plan text DEFAULT 'free' NOT NULL,
  subscription_status text DEFAULT 'active' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create transcriptions table
CREATE TABLE IF NOT EXISTS transcriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  input_type text NOT NULL CHECK (input_type IN ('file', 'youtube', 'recording')),
  input_source text NOT NULL,
  transcription_text text,
  duration_seconds integer,
  energy_cost integer NOT NULL,
  status text DEFAULT 'processing' NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transcriptions"
  ON transcriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcriptions"
  ON transcriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcriptions"
  ON transcriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcriptions"
  ON transcriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  price numeric(10, 2) NOT NULL,
  energy_points integer NOT NULL,
  features jsonb NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (active = true);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, price, energy_points, features) VALUES
  ('Basic', 9.99, 500, '{"maxDuration": 30, "formats": ["mp3", "wav"], "priority": "standard", "history": 30}'),
  ('Pro', 19.99, 1500, '{"maxDuration": 120, "formats": ["mp3", "wav", "m4a", "flac"], "priority": "high", "history": 90}'),
  ('Enterprise', 49.99, 5000, '{"maxDuration": 300, "formats": ["all"], "priority": "highest", "history": 365, "api": true}')
ON CONFLICT (name) DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS transcriptions_user_id_idx ON transcriptions(user_id);
CREATE INDEX IF NOT EXISTS transcriptions_created_at_idx ON transcriptions(created_at DESC);
