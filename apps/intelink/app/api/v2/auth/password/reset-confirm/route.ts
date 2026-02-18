/**
 * Auth v2.0 - Password Reset Confirm Endpoint
 * 
 * POST /api/v2/auth/password/reset-confirm
 * 
 * Confirms reset code and sets new password
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
    isAccessCodeExpired,
    hashPassword,
    validatePassword,
    logPasswordResetCompleted,
    AUTH_ERRORS,
    AUTH_SUCCESS,
} from '@/lib/auth';

// ============================================================================
// VALIDATION
// ============================================================================

const resetConfirmSchema = z.object({
    phone: z.string().min(10).max(15),
    code: z.string().length(6).regex(/^[A-Z]{3}[0-9]{3}$/i),
    newPassword: z.string().min(6),
});

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const getSupabase = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(supabaseUrl, supabaseKey);
};

// ============================================================================
// PHONE NORMALIZATION
// ============================================================================

function normalizePhone(phone: string): string {
    let digits = phone.replace(/\D/g, '');
    if (digits.length >= 12 && digits.startsWith('55')) {
        digits = digits.substring(2);
    }
    if (digits.length === 10) {
        const ddd = digits.substring(0, 2);
        const firstDigit = digits.charAt(2);
        if (['6', '7', '8', '9'].includes(firstDigit)) {
            return ddd + '9' + digits.substring(2);
        }
    }
    return digits;
}

// ============================================================================
// HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = resetConfirmSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: 'Dados inválidos' },
                { status: 400 }
            );
        }

        const { phone, code, newPassword } = validation.data;
        const normalizedPhone = normalizePhone(phone);
        const upperCode = code.toUpperCase();

        // Validate password
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            return NextResponse.json(
                { success: false, error: passwordValidation.error },
                { status: 400 }
            );
        }

        const supabase = getSupabase();

        // Find member with reset code
        const { data: member, error: memberError } = await supabase
            .from('intelink_unit_members')
            .select('id, reset_code, reset_code_expires_at')
            .or(`phone.eq.${normalizedPhone},phone.ilike.%${normalizedPhone}%`)
            .single();

        if (memberError || !member) {
            return NextResponse.json(
                { success: false, error: AUTH_ERRORS.INVALID_RESET_CODE },
                { status: 400 }
            );
        }

        // Verify reset code
        if (!member.reset_code || member.reset_code !== upperCode) {
            return NextResponse.json(
                { success: false, error: AUTH_ERRORS.INVALID_RESET_CODE },
                { status: 400 }
            );
        }

        // Check expiration
        if (isAccessCodeExpired(member.reset_code_expires_at)) {
            return NextResponse.json(
                { success: false, error: 'Código expirado. Solicite um novo.' },
                { status: 400 }
            );
        }

        // Hash new password
        const passwordHash = await hashPassword(newPassword);

        // Update password and clear reset code
        const { error: updateError } = await supabase
            .from('intelink_unit_members')
            .update({
                password_hash: passwordHash,
                reset_code: null,
                reset_code_expires_at: null,
                failed_login_attempts: 0,
                locked_until: null,
            })
            .eq('id', member.id);

        if (updateError) {
            console.error('[Reset] Update error:', updateError);
            return NextResponse.json(
                { success: false, error: AUTH_ERRORS.SERVER_ERROR },
                { status: 500 }
            );
        }

        // Log event
        await logPasswordResetCompleted(member.id, request);

        return NextResponse.json({
            success: true,
            message: AUTH_SUCCESS.PASSWORD_RESET,
        });

    } catch (error) {
        console.error('[Reset] Confirm error:', error);
        return NextResponse.json(
            { success: false, error: AUTH_ERRORS.SERVER_ERROR },
            { status: 500 }
        );
    }
}
