-- Add unique constraint on user_id
ALTER TABLE pomodoro_settings DROP CONSTRAINT IF EXISTS unique_user_settings;
ALTER TABLE pomodoro_settings ADD CONSTRAINT unique_user_settings UNIQUE (user_id);

-- Clean up any duplicate settings
WITH ranked_settings AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM pomodoro_settings
)
DELETE FROM pomodoro_settings
WHERE id IN (
  SELECT id 
  FROM ranked_settings 
  WHERE rn > 1
);