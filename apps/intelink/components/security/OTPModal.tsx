'use client';

/**
 * OTPModal - Two-Factor Authentication via Telegram
 * 
 * Used for critical operations like role elevation.
 * Sends OTP to linked Telegram and verifies it.
 */

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Shield, MessageCircle, RefreshCw } from 'lucide-react';

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (authToken: string) => void;
  action: 'role_elevation' | 'delete_investigation' | 'merge_entities';
  context?: {
    targetMemberId?: string;
    targetRole?: string;
    targetMemberName?: string;
  };
}

export function OTPModal({
  isOpen,
  onClose,
  onVerified,
  action,
  context,
}: OTPModalProps) {
  const [step, setStep] = useState<'sending' | 'input' | 'verifying' | 'error'>('sending');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Generate OTP on modal open
  useEffect(() => {
    if (isOpen) {
      generateOTP();
    } else {
      // Reset state when closed
      setStep('sending');
      setOtp(['', '', '', '', '', '']);
      setError('');
    }
  }, [isOpen]);

  const generateOTP = async () => {
    setStep('sending');
    setError('');

    try {
      const res = await fetch('/api/otp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, context }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao enviar OTP');
        setStep('error');
        return;
      }

      setTelegramUsername(data.telegramUsername);
      setExpiresAt(new Date(data.expiresAt));
      setStep('input');
      
      // Focus first input
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError('Erro de conexão');
      setStep('error');
    }
  };

  const handleInputChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (newOtp.every(digit => digit) && value) {
      verifyOTP(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split('');
      setOtp(newOtp);
      verifyOTP(pasted);
    }
  };

  const verifyOTP = async (code: string) => {
    setStep('verifying');
    setError('');

    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: code, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Código inválido');
        setStep('input');
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        return;
      }

      // Success!
      onVerified(data.authToken);
    } catch (err) {
      setError('Erro de conexão');
      setStep('input');
    }
  };

  if (!isOpen) return null;

  const actionLabels: Record<string, string> = {
    role_elevation: 'Alteração de Permissão',
    delete_investigation: 'Exclusão de Investigação',
    merge_entities: 'Fusão de Entidades',
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Verificação de Segurança</h2>
              <p className="text-xs text-gray-400">{actionLabels[action]}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Context Info */}
          {context?.targetMemberName && context?.targetRole && (
            <div className="mb-4 p-3 bg-gray-800 rounded-lg text-sm">
              <span className="text-gray-400">Elevando </span>
              <span className="text-white font-medium">{context.targetMemberName}</span>
              <span className="text-gray-400"> para </span>
              <span className="text-amber-400 font-medium">{context.targetRole}</span>
            </div>
          )}

          {/* Sending State */}
          {step === 'sending' && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-4" />
              <p className="text-gray-300">Enviando código para seu Telegram...</p>
            </div>
          )}

          {/* Error State */}
          {step === 'error' && (
            <div className="flex flex-col items-center py-8">
              <div className="p-3 bg-red-500/20 rounded-full mb-4">
                <X className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={generateOTP}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </button>
            </div>
          )}

          {/* Input State */}
          {(step === 'input' || step === 'verifying') && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-6 text-gray-400">
                <MessageCircle className="w-5 h-5 text-blue-400" />
                <span>
                  Código enviado para{' '}
                  {telegramUsername ? (
                    <span className="text-blue-400">@{telegramUsername}</span>
                  ) : (
                    'seu Telegram'
                  )}
                </span>
              </div>

              {/* OTP Input */}
              <div className="flex gap-2 mb-4" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleInputChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    disabled={step === 'verifying'}
                    className={`
                      w-12 h-14 text-center text-2xl font-mono font-bold
                      bg-gray-800 border-2 rounded-lg
                      focus:outline-none focus:border-blue-500
                      transition-colors
                      ${error ? 'border-red-500' : 'border-gray-600'}
                      ${step === 'verifying' ? 'opacity-50' : ''}
                    `}
                  />
                ))}
              </div>

              {/* Error message */}
              {error && step === 'input' && (
                <p className="text-red-400 text-sm mb-4">{error}</p>
              )}

              {/* Verifying state */}
              {step === 'verifying' && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </div>
              )}

              {/* Resend button */}
              {step === 'input' && (
                <button
                  onClick={generateOTP}
                  className="mt-4 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Não recebeu? <span className="text-blue-400">Reenviar código</span>
                </button>
              )}

              {/* Expiry info */}
              {expiresAt && step === 'input' && (
                <p className="mt-2 text-xs text-gray-500">
                  Código válido por 5 minutos
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
