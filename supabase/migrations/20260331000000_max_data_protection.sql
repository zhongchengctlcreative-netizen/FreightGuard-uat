-- MAX DATA PROTECTION RLS POLICIES
-- This migration enforces strict Row Level Security on all tables.
-- WARNING: This requires Supabase Auth to function. The 'anon' role is restricted.

BEGIN;

-- 1. Enable RLS on ALL tables
ALTER TABLE "public"."freight_raw_full" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."app_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."destination_regions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."carriers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."destinations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."financial_metrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."app_email_config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."app_notifications" ENABLE ROW LEVEL SECURITY;

-- 2. Revoke ALL from anon to prevent unauthenticated access
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- 3. Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated Access" ON "public"."freight_raw_full";
DROP POLICY IF EXISTS "Authenticated Access" ON "public"."app_users";
DROP POLICY IF EXISTS "Authenticated Access" ON "public"."destination_regions";
DROP POLICY IF EXISTS "Authenticated Access" ON "public"."carriers";
DROP POLICY IF EXISTS "Authenticated Access" ON "public"."destinations";
DROP POLICY IF EXISTS "Authenticated Access" ON "public"."financial_metrics";
DROP POLICY IF EXISTS "Authenticated Access" ON "public"."app_email_config";
DROP POLICY IF EXISTS "Authenticated Access" ON "public"."app_notifications";
DROP POLICY IF EXISTS "Allow Anon Application Access" ON "public"."app_notifications";
DROP POLICY IF EXISTS "Admins Full Access" ON "public"."freight_raw_full";
DROP POLICY IF EXISTS "Requesters Own Data" ON "public"."freight_raw_full";
DROP POLICY IF EXISTS "Approvers Assigned Data" ON "public"."freight_raw_full";
DROP POLICY IF EXISTS "Users View Own Profile" ON "public"."app_users";
DROP POLICY IF EXISTS "Admins Manage Users" ON "public"."app_users";

-- 4. Helper Function for Admin Check
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM app_users 
    WHERE email = auth.jwt() ->> 'email' 
    AND role = 'ADMIN' 
    AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Strict Policies for freight_raw_full
CREATE POLICY "Admins Full Access Freight" ON "public"."freight_raw_full"
FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Requesters Own Data Freight" ON "public"."freight_raw_full"
FOR ALL TO authenticated 
USING (requester_email = auth.jwt() ->> 'email' OR cc_emails ILIKE '%' || (auth.jwt() ->> 'email') || '%')
WITH CHECK (requester_email = auth.jwt() ->> 'email');

CREATE POLICY "Approvers Assigned Data Freight" ON "public"."freight_raw_full"
FOR ALL TO authenticated 
USING (
  first_approver = auth.jwt() ->> 'email' OR 
  second_approver = auth.jwt() ->> 'email' OR
  approved_by = UPPER((SELECT name FROM app_users WHERE email = auth.jwt() ->> 'email')) OR
  rejected_by = UPPER((SELECT name FROM app_users WHERE email = auth.jwt() ->> 'email'))
)
WITH CHECK (
  first_approver = auth.jwt() ->> 'email' OR second_approver = auth.jwt() ->> 'email'
);

-- 6. Strict Policies for app_users
CREATE POLICY "Users View Own Profile" ON "public"."app_users"
FOR SELECT TO authenticated USING (email = auth.jwt() ->> 'email');

CREATE POLICY "Users Update Own Profile" ON "public"."app_users"
FOR UPDATE TO authenticated USING (email = auth.jwt() ->> 'email') WITH CHECK (email = auth.jwt() ->> 'email');

CREATE POLICY "Admins Manage Users" ON "public"."app_users"
FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- 7. Strict Policies for app_notifications
CREATE POLICY "Users Manage Own Notifications" ON "public"."app_notifications"
FOR ALL TO authenticated USING (user_email = auth.jwt() ->> 'email') WITH CHECK (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Admins View All Notifications" ON "public"."app_notifications"
FOR SELECT TO authenticated USING (is_admin());

-- 8. Read-Only Reference Tables (Admins can ALL, others SELECT)
-- destination_regions
CREATE POLICY "Admins Manage Destination Regions" ON "public"."destination_regions"
FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Authenticated View Destination Regions" ON "public"."destination_regions"
FOR SELECT TO authenticated USING (true);

-- carriers
CREATE POLICY "Admins Manage Carriers" ON "public"."carriers"
FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Authenticated View Carriers" ON "public"."carriers"
FOR SELECT TO authenticated USING (true);

-- destinations
CREATE POLICY "Admins Manage Destinations" ON "public"."destinations"
FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Authenticated View Destinations" ON "public"."destinations"
FOR SELECT TO authenticated USING (true);

-- financial_metrics
CREATE POLICY "Admins Manage Financial Metrics" ON "public"."financial_metrics"
FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Authenticated View Financial Metrics" ON "public"."financial_metrics"
FOR SELECT TO authenticated USING (true);

-- app_email_config
CREATE POLICY "Admins Manage Email Config" ON "public"."app_email_config"
FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Authenticated View Email Config" ON "public"."app_email_config"
FOR SELECT TO authenticated USING (true);

COMMIT;
