-- Add show_military_public column to users table
-- Controls visibility of military information (rank, unit, specialty) on public profile
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_military_public boolean DEFAULT false;
