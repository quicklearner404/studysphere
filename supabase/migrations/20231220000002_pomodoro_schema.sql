-- Create pomodoro_settings table
CREATE TABLE IF NOT EXISTS pomodoro_settings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  work_duration integer NOT NULL DEFAULT 25,
  break_duration integer NOT NULL DEFAULT 5,
  long_break_duration integer NOT NULL DEFAULT 15,
  sessions_before_long_break integer NOT NULL DEFAULT 4,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS pomodoro_settings_user_id_idx ON pomodoro_settings(user_id);

-- Create pomodoro_sessions table
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  study_session_id uuid REFERENCES study_sessions(id) ON DELETE SET NULL,
  start_time timestamp with time zone NOT NULL DEFAULT now(),
  end_time timestamp with time zone,
  completed_sessions integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS pomodoro_sessions_user_id_idx ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS pomodoro_sessions_study_session_id_idx ON pomodoro_sessions(study_session_id);

-- Enable Row Level Security
ALTER TABLE pomodoro_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for pomodoro_settings
CREATE POLICY "Users can view their own pomodoro settings"
  ON pomodoro_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pomodoro settings"
  ON pomodoro_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pomodoro settings"
  ON pomodoro_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for pomodoro_sessions
CREATE POLICY "Users can view their own pomodoro sessions"
  ON pomodoro_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pomodoro sessions"
  ON pomodoro_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pomodoro sessions"
  ON pomodoro_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for pomodoro_settings
CREATE TRIGGER update_pomodoro_settings_updated_at
  BEFORE UPDATE ON pomodoro_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();