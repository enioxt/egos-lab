'use client';

import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { formatPhoneDisplay, formatPhoneWhatsApp, getWhatsAppLink, isValidPhone } from '@/lib/utils/phone-normalizer';

interface PhoneDisplayProps {
    phone: string | null | undefined;
    /** Show WhatsApp link */
    showWhatsApp?: boolean;
    /** Show phone icon */
    showIcon?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Component to display a phone number with optional WhatsApp link
 * Automatically formats the phone for display
 */
export default function PhoneDisplay({ 
    phone, 
    showWhatsApp = true, 
    showIcon = true,
    className = '',
    size = 'md'
}: PhoneDisplayProps) {
    if (!phone || !isValidPhone(phone)) {
        return (
            <span className={`text-slate-500 italic ${className}`}>
                Não informado
            </span>
        );
    }
    
    const formatted = formatPhoneDisplay(phone);
    const waLink = getWhatsAppLink(phone);
    
    const sizeClasses = {
        sm: 'text-xs gap-1',
        md: 'text-sm gap-2',
        lg: 'text-base gap-2'
    };
    
    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    };
    
    return (
        <div className={`flex items-center ${sizeClasses[size]} ${className}`}>
            {showIcon && <Phone className={`${iconSizes[size]} text-slate-400 flex-shrink-0`} />}
            <span className="text-slate-300">{formatted}</span>
            
            {showWhatsApp && waLink && (
                <a 
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-300 transition-colors"
                    title="Abrir no WhatsApp"
                >
                    <MessageCircle className={iconSizes[size]} />
                </a>
            )}
        </div>
    );
}

/**
 * Simple inline phone formatter (no icons)
 */
export function PhoneText({ phone, className = '' }: { phone: string | null | undefined; className?: string }) {
    if (!phone) return <span className={`text-slate-500 ${className}`}>-</span>;
    return <span className={className}>{formatPhoneDisplay(phone)}</span>;
}
