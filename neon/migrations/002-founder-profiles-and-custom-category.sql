-- Extend Product Discovery submissions without changing existing records.
ALTER TABLE fk_product_submissions
  ADD COLUMN IF NOT EXISTS custom_category VARCHAR(80),
  ADD COLUMN IF NOT EXISTS founder_x TEXT;
