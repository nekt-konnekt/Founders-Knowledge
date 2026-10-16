CREATE TABLE IF NOT EXISTS fk_product_submissions (
  id BIGSERIAL PRIMARY KEY,
  product_name VARCHAR(120) NOT NULL,
  founder_name VARCHAR(120) NOT NULL,
  contact_email VARCHAR(254) NOT NULL,
  product_website TEXT,
  category VARCHAR(40) NOT NULL,
  product_stage VARCHAR(40) NOT NULL,
  location VARCHAR(120) NOT NULL,
  description VARCHAR(280) NOT NULL,
  problem_solved TEXT NOT NULL,
  target_users VARCHAR(500) NOT NULL,
  demo_url TEXT,
  founder_linkedin TEXT,
  consent_to_review BOOLEAN NOT NULL DEFAULT FALSE,
  review_status VARCHAR(40) NOT NULL DEFAULT 'New' CHECK (review_status IN ('New','Reviewing','Needs information','Approved','Published','Declined')),
  review_notes TEXT NOT NULL DEFAULT '',
  notion_sync_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (notion_sync_status IN ('pending','synced','failed')),
  notion_page_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS fk_product_submissions_status_created_idx ON fk_product_submissions (review_status, created_at DESC);
CREATE INDEX IF NOT EXISTS fk_product_submissions_email_idx ON fk_product_submissions (contact_email);
