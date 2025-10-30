-- Migration: Remove UNIQUE constraint on habit_logs to allow multiple logs per day
-- Date: 2025-10-30
-- Purpose: Enable users to log the same habit multiple times per day

-- Drop the UNIQUE constraint on (habit_id, date)
-- The constraint name is typically auto-generated, so we need to find it first
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find the constraint name
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'habit_logs'::regclass
    AND contype = 'u'
    AND array_length(conkey, 1) = 2
    AND conkey[1] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'habit_logs'::regclass AND attname = 'habit_id')
    AND conkey[2] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'habit_logs'::regclass AND attname = 'date');

  -- Drop the constraint if found
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE habit_logs DROP CONSTRAINT ' || quote_ident(constraint_name);
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  ELSE
    RAISE NOTICE 'No UNIQUE constraint found on (habit_id, date)';
  END IF;
END $$;

-- Verify the change
-- After this migration, multiple habit_logs entries with the same habit_id and date are allowed
