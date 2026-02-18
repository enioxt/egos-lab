/**
 * OTP Verification API
 * 
 * Verifies a 6-digit OTP for critical operations.
 * Returns a one-time token that can be used to authorize the action.
 * 
 * @security Requires authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';
import crypto from 'crypto';

interface VerifyRequest {
  otp: string;
  action: string;
}

async function handlePost(req: NextRequest, auth: AuthContext) {
  const supabase = getSupabaseAdmin();

  try {
    const body: VerifyRequest = await req.json();
    const { otp, action } = body;

    if (!otp || otp.length !== 6) {
      return NextResponse.json({ error: 'OTP inválido' }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    // Hash the provided OTP for comparison
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Find valid OTP for this user and action
    const { data: otpRecord, error: findError } = await supabase
      .from('intelink_otp_tokens')
      .select('*')
      .eq('member_id', auth.memberId)
      .eq('otp_hash', otpHash)
      .eq('action', action)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (findError || !otpRecord) {
      return NextResponse.json(
        { error: 'Código inválido ou expirado' },
        { status: 401 }
      );
    }

    // Mark OTP as used
    await supabase
      .from('intelink_otp_tokens')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', otpRecord.id);

    // Generate authorization token (valid for 2 minutes)
    const authToken = crypto.randomBytes(32).toString('hex');
    const authTokenExpiry = new Date(Date.now() + 2 * 60 * 1000);

    // Store auth token
    await supabase
      .from('intelink_otp_tokens')
      .update({
        auth_token: crypto.createHash('sha256').update(authToken).digest('hex'),
        auth_token_expires_at: authTokenExpiry.toISOString(),
      })
      .eq('id', otpRecord.id);

    console.log(`[OTP Verify] Verified OTP for ${auth.memberName}, action: ${action}`);

    return NextResponse.json({
      success: true,
      authToken,
      expiresAt: authTokenExpiry.toISOString(),
      context: otpRecord.context,
    });
  } catch (error) {
    console.error('[OTP Verify] Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export const POST = withSecurity(handlePost, { requiredRole: 'unit_admin' });
