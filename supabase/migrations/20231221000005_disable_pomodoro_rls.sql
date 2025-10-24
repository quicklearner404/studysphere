-- Temporarily disable RLS on pomodoro tables
ALTER TABLE pomodoro_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions DISABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own pomodoro settings" ON pomodoro_settings;
DROP POLICY IF EXISTS "Users can insert their own pomodoro settings" ON pomodoro_settings;
DROP POLICY IF EXISTS "Users can update their own pomodoro settings" ON pomodoro_settings;

DROP POLICY IF EXISTS "Users can view their own pomodoro sessions" ON pomodoro_sessions;
DROP POLICY IF EXISTS "Users can insert their own pomodoro sessions" ON pomodoro_sessions;
DROP POLICY IF EXISTS "Users can update their own pomodoro sessions" ON pomodoro_sessions;