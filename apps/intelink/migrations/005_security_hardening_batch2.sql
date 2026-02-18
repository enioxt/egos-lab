-- Migration: Harden RLS Policies Batch 2 (Session 2026-02-18)
-- Description: Restrict unused/legacy/admin tables to service_role only

-- 1. intelink_role_permissions (Used only in admin API)
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.intelink_role_permissions;
CREATE POLICY "Allow all for authenticated" ON public.intelink_role_permissions TO service_role USING (true) WITH CHECK (true);

-- 2. messages_v3 (Unused in codebase)
DROP POLICY IF EXISTS "messages_v3_delete" ON public.messages_v3;
DROP POLICY IF EXISTS "messages_v3_insert" ON public.messages_v3;
DROP POLICY IF EXISTS "messages_v3_update" ON public.messages_v3;
CREATE POLICY "messages_v3_all" ON public.messages_v3 TO service_role USING (true) WITH CHECK (true);

-- 3. pattern_feedback (Unused in codebase)
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.pattern_feedback;
CREATE POLICY "pattern_feedback_all" ON public.pattern_feedback TO service_role USING (true) WITH CHECK (true);

-- 4. telemetry_events_v2 (Unused in codebase - we use telemetry_events)
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.telemetry_events_v2;
DROP POLICY IF EXISTS "Allow public insert" ON public.telemetry_events_v2;
CREATE POLICY "telemetry_events_v2_all" ON public.telemetry_events_v2 TO service_role USING (true) WITH CHECK (true);

-- 5. volante_gift_lessons (Unused in codebase)
DROP POLICY IF EXISTS "volante_gift_lessons_all" ON public.volante_gift_lessons;
CREATE POLICY "volante_gift_lessons_all" ON public.volante_gift_lessons TO service_role USING (true) WITH CHECK (true);

-- 6. volante_instructor_applications (Unused in codebase)
DROP POLICY IF EXISTS "Allow public insert applications" ON public.volante_instructor_applications;
CREATE POLICY "volante_instructor_applications_all" ON public.volante_instructor_applications TO service_role USING (true) WITH CHECK (true);

-- 7. intelink_telemetry (Unused in codebase - we use telemetry_events)
DROP POLICY IF EXISTS "anon_insert_intelink_telemetry" ON public.intelink_telemetry;
CREATE POLICY "intelink_telemetry_all" ON public.intelink_telemetry TO service_role USING (true) WITH CHECK (true);
