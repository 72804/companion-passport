-- Feedback improvements: category + optional contact email for logged-out testers

ALTER TABLE feedback
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

CREATE INDEX IF NOT EXISTS feedback_category_idx ON feedback(category);
