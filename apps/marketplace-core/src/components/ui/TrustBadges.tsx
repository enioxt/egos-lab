'use client';

import { Shield, Lock, BadgeCheck, Headphones } from 'lucide-react';

interface TrustBadgesProps {
  className?: string;
  compact?: boolean;
}

const badges = [
  { icon: Shield, label: '100% Seguro', description: 'Conexão SSL criptografada' },
  { icon: Lock, label: 'Dados Protegidos', description: 'LGPD Compliance' },
  { icon: BadgeCheck, label: 'Verificado', description: 'Instrutores auditados' },
  { icon: Headphones, label: 'Suporte', description: 'Atendimento via WhatsApp' },
];

export default function TrustBadges({ className = '', compact = false }: TrustBadgesProps) {
  if (compact) {
    return (
      <div className={`flex items-center justify-center gap-6 py-4 ${className}`}>
        {badges.map((badge) => (
          <div key={badge.label} className="flex items-center gap-1.5 text-xs text-slate-500">
            <badge.icon className="w-3.5 h-3.5" />
            <span>{badge.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`border-t border-slate-800 bg-slate-950/50 py-8 ${className}`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map((badge) => (
            <div key={badge.label} className="flex flex-col items-center text-center gap-2">
              <badge.icon className="w-6 h-6 text-emerald-500" />
              <span className="text-sm font-medium text-white">{badge.label}</span>
              <span className="text-xs text-slate-500">{badge.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
