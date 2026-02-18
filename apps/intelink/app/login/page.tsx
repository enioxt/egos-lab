'use client';

/**
 * Login Page v2
 * 
 * Uses the new Auth v2.0 system with:
 * - JWT tokens in HTTP-only cookies
 * - Automatic token refresh
 * - Account lockout protection
 * - Full audit logging
 */

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    Shield, Loader2, Phone, Lock, Eye, EyeOff, 
    AlertCircle, CheckCircle, ArrowLeft, MessageCircle, KeyRound, User
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

type LoginStep = 'phone' | 'password' | 'otp' | 'reset' | 'create-password';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnUrl = searchParams.get('returnUrl') || '/';
    const { isAuthenticated, isLoading: authLoading, login, error: authError, clearError } = useAuth();

    // Form state
    const [step, setStep] = useState<LoginStep>('phone');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [memberName, setMemberName] = useState('');
    const [memberId, setMemberId] = useState('');
    const [requiresOtp, setRequiresOtp] = useState(false);
    const [capsLockOn, setCapsLockOn] = useState(false);
    // Removed: showRequestAccess, requestName, accessRequested (simplified flow)

    // Detect Caps Lock
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.getModifierState('CapsLock')) {
            setCapsLockOn(true);
        } else {
            setCapsLockOn(false);
        }
    };

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            router.push(returnUrl);
        }
    }, [isAuthenticated, authLoading, router, returnUrl]);

    // Normalize phone
    const normalizePhone = (input: string): string => {
        let digits = input.replace(/\D/g, '');
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
    };

    // Format phone for display
    const formatPhone = (digits: string): string => {
        if (digits.length === 11) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
        }
        if (digits.length === 10) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
        }
        return digits;
    };

    // Format phone while typing (mask)
    const formatPhoneInput = (value: string): string => {
        const digits = value.replace(/\D/g, '').slice(0, 11);
        if (digits.length === 0) return '';
        if (digits.length <= 2) return `(${digits}`;
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    };

    // Handle phone input change
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneInput(e.target.value);
        setPhone(formatted);
    };

    // Check if phone exists
    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const normalizedPhone = normalizePhone(phone);

        if (normalizedPhone.length < 10) {
            setError('Telefone inválido');
            setLoading(false);
            return;
        }

        try {
            // Check if phone exists and if has password
            const res = await fetch('/api/v2/auth/check-phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: normalizedPhone }),
            });

            const data = await res.json();

            if (!data.success) {
                setError(data.error || 'Erro ao verificar telefone');
                setLoading(false);
                return;
            }

            // API auto-creates member if not exists, so we always have a member now
            setMemberId(data.memberId || '');
            
            // If auto-created, clear the name so user can choose their own
            // Otherwise use the existing name from the database
            setMemberName(data.autoCreated ? '' : (data.memberName || ''));

            // Check if has password
            if (data.hasPassword) {
                setStep('password');
            } else {
                // No password - go to create password
                const greeting = data.autoCreated 
                    ? `Bem-vindo! Este é seu primeiro acesso.`
                    : `Olá ${data.memberName}! Crie sua senha para acessar.`;
                setSuccess(greeting);
                setStep('create-password');
            }
        } catch (e) {
            setError('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    // Removed: handleRequestAccess (simplified flow - auto-create members)

    // Handle login
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const normalizedPhone = normalizePhone(phone);

        try {
            const res = await fetch('/api/v2/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    phone: normalizedPhone,
                    password,
                    rememberMe,
                }),
            });

            const data = await res.json();

            // Check if requires OTP (2FA for super_admin)
            if (data.requiresOtp) {
                setMemberId(data.memberId);
                setMemberName(data.memberName);
                setRequiresOtp(true);
                setStep('otp');
                setSuccess('Código enviado para seu Telegram');
                setLoading(false);
                return;
            }

            // Check if needs password setup (member exists but no password)
            if (data.needsPasswordSetup) {
                setMemberName(data.memberName || '');
                setSuccess(`Olá ${data.memberName}! Vamos criar sua senha.`);
                setStep('create-password');
                setLoading(false);
                return;
            }

            if (!res.ok || !data.success) {
                setError(data.error || 'Erro ao fazer login');
                setLoading(false);
                return;
            }

            // Success!
            setSuccess(`Bem-vindo, ${data.member?.name || memberName}!`);
            
            // Also save to localStorage for legacy compatibility
            if (data.member) {
                localStorage.setItem('intelink_member_id', data.member.id);
                localStorage.setItem('intelink_username', data.member.name);
                localStorage.setItem('intelink_role', data.member.role);
                localStorage.setItem('intelink_phone', normalizedPhone);
                localStorage.setItem('intelink_chat_id', normalizedPhone);
            }

            setTimeout(() => router.push(returnUrl), 1500);
        } catch (e) {
            setError('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    // Handle OTP verification
    const handleOtpVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/v2/auth/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    memberId,
                    otp,
                    rememberMe,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.error || 'Código inválido');
                setLoading(false);
                return;
            }

            // Save to localStorage for legacy compatibility
            if (data.member) {
                localStorage.setItem('intelink_member_id', data.member.id);
                localStorage.setItem('intelink_username', data.member.name);
                localStorage.setItem('intelink_role', data.member.role || '');
            }

            setSuccess(`Bem-vindo, ${data.member?.name}!`);
            // Use window.location for full page reload (ensures cookies are read)
            setTimeout(() => window.location.href = returnUrl, 1500);
        } catch (e) {
            setError('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    // Send OTP
    const sendOtp = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/v2/auth/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.error || 'Erro ao enviar código');
            } else {
                setSuccess('Código enviado para seu Telegram!');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (e) {
            setError('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    // Request password reset
    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/v2/auth/password/reset-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: normalizePhone(phone) }),
            });

            const data = await res.json();
            setSuccess(data.message || 'Se o telefone estiver cadastrado, você receberá o código.');
            setTimeout(() => {
                setStep('phone');
                setSuccess('');
            }, 5000);
        } catch (e) {
            setError('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    // Create password for new users
    const handleCreatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password.length < 6) {
            setError('Senha deve ter no mínimo 6 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/v2/auth/create-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    phone: normalizePhone(phone),
                    password,
                    confirmPassword,
                    name: memberName.trim() || undefined,
                    rememberMe,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.error || 'Erro ao criar senha');
                setLoading(false);
                return;
            }

            // Success! Save to localStorage and redirect
            if (data.member) {
                localStorage.setItem('intelink_member_id', data.member.id);
                localStorage.setItem('intelink_username', data.member.name);
                localStorage.setItem('intelink_role', data.member.role || '');
            }

            setSuccess('Senha criada com sucesso! Entrando...');
            setTimeout(() => window.location.href = returnUrl, 1500);
        } catch (e) {
            setError('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    // Back button handler
    const handleBack = () => {
        setError('');
        setSuccess('');
        if (step === 'password' || step === 'create-password') {
            setStep('phone');
            setPassword('');
            setConfirmPassword('');
        } else if (step === 'otp') {
            setStep('password');
            setOtp('');
        } else if (step === 'reset') {
            setStep('phone');
        }
    };

    // Loading state
    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
                        <Shield className="w-8 h-8 text-cyan-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">INTELINK</h1>
                    <p className="text-slate-400 text-sm mt-1">Sistema de Inteligência Policial</p>
                </div>

                {/* Card */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur">
                    {/* Success message */}
                    {success && (
                        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                            <span className="text-emerald-400 text-sm">{success}</span>
                        </div>
                    )}

                    {/* Error message */}
                    {(error || authError) && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                            <span className="text-red-400 text-sm">{error || authError}</span>
                        </div>
                    )}

                    {/* Step: Phone */}
                    {step === 'phone' && (
                        <form onSubmit={handlePhoneSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm text-slate-400 mb-2">Telefone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    {/* Hidden field for password managers - stores only digits */}
                                    <input
                                        type="hidden"
                                        name="username"
                                        autoComplete="username"
                                        value={normalizePhone(phone)}
                                    />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        placeholder="(00) 00000-0000"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                                        autoFocus
                                        autoComplete="tel"
                                        name="phone"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !phone}
                                className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continuar'}
                            </button>
                        </form>
                    )}

                    {/* Step: Password */}
                    {step === 'password' && (
                        <form onSubmit={handleLogin}>
                            {/* Hidden username for password managers - only digits */}
                            <input
                                type="hidden"
                                name="username"
                                autoComplete="username"
                                value={normalizePhone(phone)}
                            />
                            <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
                                <p className="text-slate-400 text-sm">Olá, <span className="text-white font-medium">{memberName}</span></p>
                                <p className="text-slate-500 text-xs">{formatPhone(normalizePhone(phone))}</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm text-slate-400 mb-2">Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        onKeyUp={handleKeyDown}
                                        placeholder="Sua senha"
                                        className="w-full pl-10 pr-12 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                                        autoFocus
                                        autoComplete="current-password"
                                        name="password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {capsLockOn && (
                                    <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Caps Lock está ativado
                                    </p>
                                )}
                            </div>

                            <div className="mb-4 flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
                                    />
                                    <span className="text-sm text-slate-400">Lembrar-me</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setStep('reset')}
                                    className="text-sm text-cyan-500 hover:text-cyan-400"
                                >
                                    Esqueci a senha
                                </button>
                            </div>

                            <div className="space-y-2">
                                <button
                                    type="submit"
                                    disabled={loading || !password}
                                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="w-full py-3 text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Voltar
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step: Create Password (for new users without password) */}
                    {step === 'create-password' && (
                        <form onSubmit={handleCreatePassword}>
                            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                <p className="text-emerald-400 font-medium mb-1">🎉 Primeiro Acesso!</p>
                                <p className="text-slate-400 text-sm">Complete seu cadastro escolhendo um nome e senha.</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm text-slate-400 mb-2">
                                    Escolha seu Nome <span className="text-emerald-400">*</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="text"
                                        value={memberName}
                                        onChange={(e) => setMemberName(e.target.value)}
                                        placeholder="Ex: João Silva"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                        autoFocus
                                    />
                                </div>
                                <p className="text-slate-500 text-xs mt-1">Este nome será exibido para sua equipe</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm text-slate-400 mb-2">Nova Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Mínimo 6 caracteres"
                                        className="w-full pl-10 pr-12 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm text-slate-400 mb-2">Confirmar Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Digite novamente"
                                        className={`w-full pl-10 pr-12 py-3 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 outline-none ${
                                            confirmPassword && password !== confirmPassword 
                                                ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                                                : 'border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {confirmPassword && password !== confirmPassword && (
                                    <p className="text-red-400 text-xs mt-1">As senhas não coincidem</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <button
                                    type="submit"
                                    disabled={loading || !memberName.trim() || !password || password.length < 6 || password !== confirmPassword}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar Senha e Entrar'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="w-full py-3 text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Voltar
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step: OTP */}
                    {step === 'otp' && (
                        <form onSubmit={handleOtpVerify}>
                            <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <MessageCircle className="w-5 h-5 text-cyan-500" />
                                    <span className="text-cyan-400 font-medium">Verificação via Telegram</span>
                                </div>
                                <p className="text-slate-400 text-sm">Digite o código de 6 dígitos enviado para seu Telegram.</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm text-slate-400 mb-2">Código OTP</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        maxLength={6}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-center text-xl tracking-widest font-mono placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <button
                                    type="submit"
                                    disabled={loading || otp.length !== 6}
                                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verificar'}
                                </button>
                                <button
                                    type="button"
                                    onClick={sendOtp}
                                    disabled={loading}
                                    className="w-full py-2 text-cyan-500 hover:text-cyan-400 text-sm"
                                >
                                    Reenviar código
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="w-full py-2 text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Voltar
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step: Reset Password */}
                    {step === 'reset' && (
                        <form onSubmit={handleResetRequest}>
                            <div className="mb-4">
                                <h3 className="text-white font-medium mb-1">Recuperar Senha</h3>
                                <p className="text-slate-400 text-sm">
                                    Informe seu telefone para receber o código de recuperação via Telegram.
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm text-slate-400 mb-2">Telefone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="(00) 00000-0000"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <button
                                    type="submit"
                                    disabled={loading || !phone}
                                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Código'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="w-full py-3 text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Voltar para login
                                </button>
                            </div>
                        </form>
                    )}
                </div>

            </div>
        </div>
    );
}

// Wrap with Suspense for useSearchParams
export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
