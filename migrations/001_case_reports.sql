CREATE TABLE IF NOT EXISTS case_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  network TEXT NOT NULL,
  incident_type TEXT NOT NULL,
  public_reference TEXT,
  incident_date DATE,
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS case_reports_user_created_idx ON case_reports (user_id, created_at DESC);
