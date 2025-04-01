/*
  # Update RLS Policies

  This migration updates the RLS policies to allow public access to the tables.

  1. Changes
    - Update policies to allow public access to disk_types and processors tables
*/

-- Update policies for disk_types
DROP POLICY IF EXISTS "Allow read access for all authenticated users on disk_types" ON disk_types;
CREATE POLICY "Allow public read access on disk_types"
    ON disk_types
    FOR SELECT
    TO public
    USING (true);

-- Update policies for processors
DROP POLICY IF EXISTS "Allow read access for all authenticated users on processors" ON processors;
CREATE POLICY "Allow public read access on processors"
    ON processors
    FOR SELECT
    TO public
    USING (true);