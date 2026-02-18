-- Migration: Harden RLS Policies (Session 2026-02-18)
-- Description: Restrict overly permissive policies to service_role

-- 1. reward_ledger
DROP POLICY IF EXISTS "Service role full access ledger" ON public.reward_ledger;
CREATE POLICY "Service role full access ledger" ON public.reward_ledger TO service_role USING (true) WITH CHECK (true);

-- 2. user_tiers
DROP POLICY IF EXISTS "Service role full access on user_tiers" ON public.user_tiers;
CREATE POLICY "Service role full access on user_tiers" ON public.user_tiers TO service_role USING (true) WITH CHECK (true);

-- 3. risk_events
DROP POLICY IF EXISTS "Service role can insert risk events" ON public.risk_events;
CREATE POLICY "Service role can insert risk events" ON public.risk_events TO service_role WITH CHECK (true);

-- 4. pending_claims
DROP POLICY IF EXISTS "Service can insert pending claims" ON public.pending_claims;
CREATE POLICY "Service can insert pending claims" ON public.pending_claims TO service_role WITH CHECK (true);

-- 5. intelink_telemetry (Allow anon insert, but explicit)
-- Was: "anon_insert_intelink_telemetry" WITH CHECK (true)
-- We keep it but maybe it's fine. The linter warns about "true".
-- Let's leave anon policies for now if they are intended for telemetry.

-- 6. Lock down legacy/unused volante tables in this project to service_role
-- volante_instructors
DROP POLICY IF EXISTS "volante_instructors_all" ON public.volante_instructors;
CREATE POLICY "volante_instructors_all" ON public.volante_instructors TO service_role USING (true) WITH CHECK (true);

-- volante_lessons
DROP POLICY IF EXISTS "volante_lessons_all" ON public.volante_lessons;
CREATE POLICY "volante_lessons_all" ON public.volante_lessons TO service_role USING (true) WITH CHECK (true);

-- volante_candidates
DROP POLICY IF EXISTS "volante_candidates_all" ON public.volante_candidates;
CREATE POLICY "volante_candidates_all" ON public.volante_candidates TO service_role USING (true) WITH CHECK (true);

-- volante_availability
DROP POLICY IF EXISTS "volante_availability_all" ON public.volante_availability;
CREATE POLICY "volante_availability_all" ON public.volante_availability TO service_role USING (true) WITH CHECK (true);
