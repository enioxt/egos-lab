/**
 * Email Service - Resend Integration
 * 
 * Free tier: 3000 emails/month
 * Used for: Password recovery, access codes
 */

import { Resend } from 'resend';

// Lazy initialization to avoid build errors when env var is not set
let resend: Resend | null = null;

function getResend(): Resend | null {
    if (!process.env.RESEND_API_KEY) {
        return null;
    }
    if (!resend) {
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
}

// Use verified domain. If not verified yet, emails will fail for non-admin recipients.
// Domain verified at: https://resend.com/domains
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@intelink.ia.br';
const FROM_NAME = 'INTELINK';

interface SendCodeEmailParams {
    to: string;
    memberName: string;
    code: string;
    type: 'access' | 'recovery';
}

export async function sendCodeEmail({ to, memberName, code, type }: SendCodeEmailParams): Promise<boolean> {
    const client = getResend();
    if (!client) {
        console.error('[Email] RESEND_API_KEY not configured');
        return false;
    }

    const subject = type === 'recovery' 
        ? '🔐 INTELINK - Recuperação de Senha'
        : '🔐 INTELINK - Código de Acesso';

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="max-width: 500px;">
                    <!-- Logo -->
                    <tr>
                        <td align="center" style="padding-bottom: 30px;">
                            <h1 style="color: #3b82f6; font-size: 28px; margin: 0;">🔒 INTELINK</h1>
                            <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">Sistema de Inteligência Policial</p>
                        </td>
                    </tr>
                    
                    <!-- Card -->
                    <tr>
                        <td style="background-color: #1e293b; border-radius: 16px; padding: 40px;">
                            <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 10px 0; text-align: center;">
                                ${type === 'recovery' ? 'Recuperação de Senha' : 'Código de Acesso'}
                            </h2>
                            <p style="color: #94a3b8; font-size: 14px; margin: 0 0 30px 0; text-align: center;">
                                Olá, <strong style="color: #ffffff;">${memberName}</strong>
                            </p>
                            
                            <!-- Code Box -->
                            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
                                <p style="color: #93c5fd; font-size: 12px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2px;">Seu código</p>
                                <p style="color: #ffffff; font-size: 36px; font-family: monospace; font-weight: bold; margin: 0; letter-spacing: 8px;">${code}</p>
                            </div>
                            
                            <!-- Instructions -->
                            <div style="background-color: #334155; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                                <p style="color: #94a3b8; font-size: 13px; margin: 0 0 15px 0; font-weight: bold;">Como usar:</p>
                                <ol style="color: #cbd5e1; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.8;">
                                    <li>Acesse <a href="https://intelink.ia.br" style="color: #60a5fa;">intelink.ia.br</a></li>
                                    <li>Digite seu telefone</li>
                                    <li>Digite o código <strong style="color: #ffffff;">${code}</strong></li>
                                    <li>Crie sua nova senha</li>
                                </ol>
                            </div>
                            
                            <!-- Expiry -->
                            <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
                                ⏱️ Este código expira em <strong>7 dias</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding-top: 30px; text-align: center;">
                            <p style="color: #475569; font-size: 11px; margin: 0;">
                                Se você não solicitou este código, ignore este email.
                            </p>
                            <p style="color: #475569; font-size: 11px; margin: 10px 0 0 0;">
                                © 2025 INTELINK - Sistema de Inteligência Policial
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();

    try {
        const { data, error } = await client.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: [to],
            subject,
            html,
        });

        if (error) {
            console.error('[Email] Send error:', error);
            return false;
        }

        console.log('[Email] Sent successfully to:', to, 'ID:', data?.id);
        return true;
    } catch (e) {
        console.error('[Email] Exception:', e);
        return false;
    }
}
