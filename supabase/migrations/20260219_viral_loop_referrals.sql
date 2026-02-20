-- EGOS M2M API - Viral Gamification (BYOK)
-- Objective: Viral Loop for "First 3 Audits Free" and Referral Bonuses
-- Date: 2026-02-19

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    github_handle VARCHAR(100),
    referral_code VARCHAR(20) UNIQUE NOT NULL,    -- Auto-generated simple code (e.g. EGOS-F4A2)
    referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    free_audits_remaining INTEGER DEFAULT 3,     -- Baseline 3 free audits per new user
    total_audits_run INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX idx_user_audits_user_id ON public.user_audits(user_id);
CREATE INDEX idx_user_audits_referral_code ON public.user_audits(referral_code);

-- Trigger to increment referrer's free audits when the referred user signs up
CREATE OR REPLACE FUNCTION award_referral_bonus()
RETURNS TRIGGER AS $$
BEGIN
    -- Only award the +10 free audits once per user registration who used a referral code
    IF NEW.referred_by IS NOT NULL THEN
        UPDATE public.user_audits
        SET free_audits_remaining = free_audits_remaining + 10,
            updated_at = timezone('utc', now())
        WHERE user_id = NEW.referred_by;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_referred_signup
    AFTER INSERT ON public.user_audits
    FOR EACH ROW
    EXECUTE FUNCTION award_referral_bonus();

-- Helper function to generate a simple referral code
CREATE OR REPLACE FUNCTION generate_egos_referral_code()
RETURNS VARCHAR AS $$
DECLARE
    code VARCHAR;
    is_unique BOOLEAN;
BEGIN
    LOOP
        code := 'EGOS-' || upper(substring(md5(random()::text) from 1 for 4));
        SELECT NOT EXISTS (SELECT 1 FROM public.user_audits WHERE referral_code = code) INTO is_unique;
        EXIT WHEN is_unique;
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.user_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own audits" ON public.user_audits
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users update own audits" ON public.user_audits
    FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users insert own audits" ON public.user_audits
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users delete own audits" ON public.user_audits
    FOR DELETE USING ((SELECT auth.uid()) = user_id);

COMMIT;
