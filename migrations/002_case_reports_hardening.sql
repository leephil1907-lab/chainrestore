-- Defensive database constraints for owner-scoped incident records.
ALTER TABLE case_reports
  ADD CONSTRAINT case_reports_user_id_nonempty CHECK (length(trim(user_id)) > 0),
  ADD CONSTRAINT case_reports_details_length CHECK (length(trim(details)) BETWEEN 12 AND 5000),
  ADD CONSTRAINT case_reports_reference_length CHECK (public_reference IS NULL OR length(public_reference) <= 180);
CREATE INDEX IF NOT EXISTS case_reports_owner_id_idx ON case_reports (user_id, id);