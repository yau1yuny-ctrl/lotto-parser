-- Migration: Add draw_date column to lottery_results table
-- This column stores the date of the lottery draw in YYYY-MM-DD format
-- Used for matching results with other programs and for cleanup

-- Add the draw_date column (allows NULL initially for existing records)
ALTER TABLE lottery_results
ADD COLUMN IF NOT EXISTS draw_date DATE;

-- Create an index on draw_date for faster cleanup queries
CREATE INDEX IF NOT EXISTS idx_lottery_results_draw_date 
ON lottery_results(draw_date);

-- Optional: Update existing records to set draw_date from scraped_at
-- (Only if you have existing data you want to preserve)
UPDATE lottery_results
SET draw_date = DATE(scraped_at AT TIME ZONE 'America/Panama')
WHERE draw_date IS NULL;

-- Make draw_date NOT NULL after backfilling (optional, for data integrity)
-- ALTER TABLE lottery_results
-- ALTER COLUMN draw_date SET NOT NULL;
