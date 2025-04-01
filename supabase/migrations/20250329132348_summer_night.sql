/*
  # Hardware Components Schema

  1. New Tables
    - `disk_types`
      - `id` (uuid, primary key)
      - `size_gb` (integer) - Size in gigabytes
      - `name` (text) - Formatted name (e.g., "1.92 TB")
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `processors`
      - `id` (uuid, primary key)
      - `name` (text) - Full processor name
      - `cores` (integer) - Number of cores
      - `frequency` (text) - Clock frequency
      - `generation` (text) - Processor generation
      - `spec_int_base` (integer) - SPECint Rate base score
      - `tdp` (integer) - Thermal Design Power in watts
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read data
*/

-- Create disk_types table
CREATE TABLE IF NOT EXISTS disk_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    size_gb integer NOT NULL,
    name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create processors table
CREATE TABLE IF NOT EXISTS processors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    cores integer NOT NULL,
    frequency text NOT NULL,
    generation text NOT NULL,
    spec_int_base integer NOT NULL,
    tdp integer NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE disk_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE processors ENABLE ROW LEVEL SECURITY;

-- Create policies for disk_types
CREATE POLICY "Allow read access for all authenticated users on disk_types"
    ON disk_types
    FOR SELECT
    TO authenticated
    USING (true);

-- Create policies for processors
CREATE POLICY "Allow read access for all authenticated users on processors"
    ON processors
    FOR SELECT
    TO authenticated
    USING (true);

-- Insert disk types data
INSERT INTO disk_types (size_gb, name) VALUES
    (240, '240 GB'),
    (480, '480 GB'),
    (960, '960 GB'),
    (1966, '1.92 TB'),
    (2048, '2 TB'),
    (3932, '3.84 TB'),
    (4096, '4 TB'),
    (6144, '6 TB'),
    (7864, '7.68 TB'),
    (8192, '8 TB'),
    (10240, '10 TB'),
    (12288, '12 TB'),
    (14336, '14 TB'),
    (15729, '15.36 TB'),
    (16384, '16 TB'),
    (18432, '18 TB'),
    (20480, '20 TB'),
    (22528, '22 TB'),
    (24576, '24 TB');

-- Insert processors data
INSERT INTO processors (name, cores, frequency, generation, spec_int_base, tdp) VALUES
    ('Intel Xeon Platinum 8480+', 56, '2.0 GHz', '4th Gen', 98, 270),
    ('Intel Xeon Gold 6448H', 48, '2.4 GHz', '4th Gen', 89, 240),
    ('Intel Xeon Silver 4416+', 20, '2.6 GHz', '4th Gen', 75, 165),
    ('Intel Xeon Bronze 3408U', 16, '2.1 GHz', '4th Gen', 65, 100),
    ('Intel Xeon Platinum 8592+', 64, '2.1 GHz', '5th Gen', 105, 285),
    ('Intel Xeon Gold 6534H', 52, '2.2 GHz', '5th Gen', 95, 250),
    ('Intel Xeon Silver 4524+', 24, '2.4 GHz', '5th Gen', 82, 185),
    ('Intel Xeon Bronze 3425', 18, '2.0 GHz', '5th Gen', 72, 110),
    ('Intel Xeon Platinum 8490H', 60, '2.0 GHz', '5th Gen', 102, 280),
    ('Intel Xeon Gold 6442Y', 32, '2.6 GHz', '4th Gen', 86, 225),
    ('Intel Xeon Silver 4412Y', 24, '2.4 GHz', '4th Gen', 78, 175),
    ('Intel Xeon Platinum 8580+', 56, '2.5 GHz', '5th Gen', 100, 275);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_disk_types_updated_at
    BEFORE UPDATE ON disk_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processors_updated_at
    BEFORE UPDATE ON processors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();