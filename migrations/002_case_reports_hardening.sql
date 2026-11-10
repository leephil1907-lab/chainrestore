ALTER TABLE case_reports
  ADD CONSTRAINT case_reports_user_id_nonempty CHECK (user_id IS NOT NULL),
  ADD CONSTRAINT case_reports_details_length CHECK (length(trim(details)) BETWEEN 12 AND 5000),
  ADD CONSTRAINT case_reports_reference_length CHECK (public_reference IS NULL OR length(public_reference) <= 180);
