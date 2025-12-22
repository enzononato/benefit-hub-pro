-- Remove foreign key constraints that reference auth.users
ALTER TABLE benefit_requests DROP CONSTRAINT IF EXISTS benefit_requests_user_id_fkey;
ALTER TABLE benefit_requests DROP CONSTRAINT IF EXISTS benefit_requests_reviewed_by_fkey;