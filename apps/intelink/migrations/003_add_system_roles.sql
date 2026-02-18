-- Migration: Add system roles to unit members
-- Run this in Supabase SQL Editor

-- Add system_role column to control access levels
ALTER TABLE intelink_unit_members 
ADD COLUMN IF NOT EXISTS system_role TEXT DEFAULT 'member';

-- Add check constraint for valid roles (including visitor)
DO $$ BEGIN
    ALTER TABLE intelink_unit_members 
    ADD CONSTRAINT check_system_role 
    CHECK (system_role IN ('super_admin', 'unit_admin', 'member', 'intern', 'visitor'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Set is_chief members as unit_admin by default
UPDATE intelink_unit_members 
SET system_role = 'unit_admin' 
WHERE is_chief = true AND system_role = 'member';

-- Add comment for documentation
COMMENT ON COLUMN intelink_unit_members.system_role IS 'System access level: super_admin (full access), unit_admin (manage unit), member (investigations), intern (read-only)';

-- Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_unit_members_system_role ON intelink_unit_members(system_role);

-- IMPORTANT: Set at least one super_admin manually after running this migration
-- Example: UPDATE intelink_unit_members SET system_role = 'super_admin' WHERE telegram_username = 'your_username';
