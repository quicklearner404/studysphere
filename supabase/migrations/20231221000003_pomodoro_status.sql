-- Create pomodoro_status table for real-time status updates
CREATE TABLE IF NOT EXISTS pomodoro_status (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  study_session_id uuid REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('focus', 'break', 'long-break', 'idle')),
  time_left integer,
  updated_at timestamp with time zone DEFAULT now()
);

-- Create unique constraint to ensure one status per user per session
CREATE UNIQUE INDEX pomodoro_status_user_session_idx ON pomodoro_status(user_id, study_session_id);

-- Add indexes for quick lookups
CREATE INDEX pomodoro_status_session_idx ON pomodoro_status(study_session_id);

-- Enable RLS
ALTER TABLE pomodoro_status ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all pomodoro status in their study session"
  ON pomodoro_status FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM study_sessions ss
      LEFT JOIN attendance_records ar ON ar.study_session_id = ss.id
      WHERE ss.id = pomodoro_status.study_session_id
      AND (ar.student_id = auth.uid() OR ss.host_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own pomodoro status"
  ON pomodoro_status FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pomodoro status"
  ON pomodoro_status FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pomodoro status"
  ON pomodoro_status FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pomodoro_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamp
CREATE TRIGGER update_pomodoro_status_updated_at
  BEFORE UPDATE ON pomodoro_status
  FOR EACH ROW
  EXECUTE FUNCTION update_pomodoro_status_timestamp();