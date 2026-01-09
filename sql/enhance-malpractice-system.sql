-- AI Malpractice Flagging System Enhancement

-- 1. Add malpractice_score (0-100) to quantify the severity/confidence of the malpractice.
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS malpractice_score INTEGER DEFAULT 0;

-- 2. Add malpractice_details to store a description or JSON log of events.
-- Using TEXT so it can be flexible (stringified JSON or plain text description).
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS malpractice_details TEXT;

-- 3. (Optional) Create an index if we plan to filter by score often.
CREATE INDEX IF NOT EXISTS idx_candidates_malpractice_score ON candidates(malpractice_score);

-- Comment:
-- malpractice (BOOLEAN) already exists.
-- New columns allow for granular flags:
-- malpractice_score > 0 indicates suspicion.
-- malpractice_score > 80 indicates high probability/blocker.
