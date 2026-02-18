'use client';
/**
 * Driver View — Primary Persona Dashboard
 * 
 * Features:
 *  - Quick product scan (barcode via camera)
 *  - Voice input for adding products ("Arroz 5kg por 24.90")
 *  - Active order queue sorted by distance
 *  - Status board: Picked → In Transit → Delivered
 *  - Today's route summary (deliveries, distance, earnings)
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

type DeliveryStatus = 'pending' | 'picked' | 'in_transit' | 'delivered' | 'failed';

interface Delivery {
    id: string;
    order_id: string;
    status: DeliveryStatus;
    customer_name: string;
    address: string;
    items_count: number;
    total: number;
    distance_km: number;
    pickup_at: string | null;
    delivered_at: string | null;
}

interface DayStats {
    deliveries_total: number;
    deliveries_completed: number;
    total_km: number;
    total_earned: number;
}

const STATUS_FLOW: DeliveryStatus[] = ['pending', 'picked', 'in_transit', 'delivered'];
const STATUS_LABELS: Record<DeliveryStatus, string> = {
    pending: '⏳ Aguardando',
    picked: '📦 Coletado',
    in_transit: '🚚 Em Trânsito',
    delivered: '✅ Entregue',
    failed: '❌ Falhou',
};
const STATUS_COLORS: Record<DeliveryStatus, string> = {
    pending: '#f59e0b',
    picked: '#3b82f6',
    in_transit: '#8b5cf6',
    delivered: '#10b981',
    failed: '#ef4444',
};

// --- Mock data for demo ---
const MOCK_DELIVERIES: Delivery[] = [
    {
        id: '1', order_id: 'ORD-001', status: 'pending',
        customer_name: 'Maria Silva', address: 'Rua das Flores, 123 - Centro',
        items_count: 8, total: 156.90, distance_km: 2.3,
        pickup_at: null, delivered_at: null,
    },
    {
        id: '2', order_id: 'ORD-002', status: 'picked',
        customer_name: 'João Santos', address: 'Av. Brasil, 456 - Jd. América',
        items_count: 12, total: 234.50, distance_km: 4.1,
        pickup_at: new Date().toISOString(), delivered_at: null,
    },
    {
        id: '3', order_id: 'ORD-003', status: 'in_transit',
        customer_name: 'Ana Oliveira', address: 'Rua Minas Gerais, 789 - Sta. Efigênia',
        items_count: 5, total: 89.90, distance_km: 1.8,
        pickup_at: new Date().toISOString(), delivered_at: null,
    },
    {
        id: '4', order_id: 'ORD-004', status: 'delivered',
        customer_name: 'Carlos Lima', address: 'Rua Goiás, 321 - Serra',
        items_count: 3, total: 45.00, distance_km: 3.5,
        pickup_at: new Date(Date.now() - 7200000).toISOString(),
        delivered_at: new Date(Date.now() - 3600000).toISOString(),
    },
];

export default function DriverPage() {
    const [deliveries, setDeliveries] = useState<Delivery[]>(MOCK_DELIVERIES);
    const [voiceInput, setVoiceInput] = useState('');
    const [voiceResult, setVoiceResult] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [scanMode, setScanMode] = useState(false);
    const [barcodeInput, setBarcodeInput] = useState('');

    // Day stats
    const dayStats: DayStats = {
        deliveries_total: deliveries.length,
        deliveries_completed: deliveries.filter(d => d.status === 'delivered').length,
        total_km: deliveries.reduce((sum, d) => sum + d.distance_km, 0),
        total_earned: deliveries
            .filter(d => d.status === 'delivered')
            .reduce((sum, d) => sum + d.total * 0.08, 0), // 8% commission
    };

    // Advance delivery status
    const advanceStatus = useCallback((id: string) => {
        setDeliveries(prev => prev.map(d => {
            if (d.id !== id) return d;
            const currentIdx = STATUS_FLOW.indexOf(d.status);
            if (currentIdx >= STATUS_FLOW.length - 1) return d;
            const nextStatus = STATUS_FLOW[currentIdx + 1];
            return {
                ...d,
                status: nextStatus,
                pickup_at: nextStatus === 'picked' ? new Date().toISOString() : d.pickup_at,
                delivered_at: nextStatus === 'delivered' ? new Date().toISOString() : d.delivered_at,
            };
        }));
    }, []);

    // Parse voice input for product
    const handleVoiceSubmit = useCallback(() => {
        if (!voiceInput.trim()) return;
        // Simple AI-style parsing
        const match = voiceInput.match(/(.+?)[\s,]+(\d+(?:[.,]\d+)?)\s*(?:reais|R\$)?/i);
        if (match) {
            const productName = match[1].trim();
            const price = parseFloat(match[2].replace(',', '.'));
            setVoiceResult(`✅ Produto: "${productName}" — R$ ${price.toFixed(2)}`);
        } else {
            setVoiceResult(`🤖 Não entendi. Tente: "Arroz 5kg 24.90" ou "Leite integral 6,50"`);
        }
        setVoiceInput('');
    }, [voiceInput]);

    // Barcode scan simulation
    const handleBarcodeScan = useCallback(() => {
        if (!barcodeInput.trim()) return;
        setVoiceResult(`📷 Código: ${barcodeInput} — Buscando no Catálogo Global...`);
        setBarcodeInput('');
        setTimeout(() => {
            setVoiceResult(`✅ Encontrado: "Arroz Tipo 1 Tio João 5kg" — R$ 24.90 (catálogo)`);
        }, 1500);
    }, [barcodeInput]);

    const activeDeliveries = deliveries.filter(d => d.status !== 'delivered' && d.status !== 'failed');
    const completedDeliveries = deliveries.filter(d => d.status === 'delivered');

    return (
        <div style={{ padding: '24px', maxWidth: '1200px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                        🚚 Painel do Motorista
                    </h1>
                    <p style={{ color: '#64748b', margin: '4px 0 0' }}>
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setScanMode(!scanMode)}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '12px',
                            border: 'none',
                            background: scanMode ? '#7c3aed' : '#f1f5f9',
                            color: scanMode ? 'white' : '#475569',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '14px',
                            transition: 'all 0.2s',
                        }}
                    >
                        📷 {scanMode ? 'Fechar Scanner' : 'Escanear'}
                    </button>
                </div>
            </div>

            {/* Day Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '24px',
            }}>
                {[
                    { label: 'Entregas Hoje', value: `${dayStats.deliveries_completed}/${dayStats.deliveries_total}`, icon: '📦', color: '#3b82f6' },
                    { label: 'Km Rodados', value: `${dayStats.total_km.toFixed(1)} km`, icon: '🛣️', color: '#8b5cf6' },
                    { label: 'Ganhos (8%)', value: `R$ ${dayStats.total_earned.toFixed(2)}`, icon: '💰', color: '#10b981' },
                    { label: 'Pendentes', value: `${activeDeliveries.length}`, icon: '⏳', color: '#f59e0b' },
                ].map((stat, i) => (
                    <div key={i} style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '20px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        border: '1px solid #f1f5f9',
                    }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Quick Input: Voice + Barcode */}
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #f1f5f9',
            }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, marginTop: 0, color: '#0f172a' }}>
                    {scanMode ? '📷 Escanear Código de Barras' : '🎙️ Entrada Rápida'}
                </h2>

                {scanMode ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            placeholder='Código de barras (ex: 7891234567890)'
                            value={barcodeInput}
                            onChange={e => setBarcodeInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleBarcodeScan()}
                            style={{
                                flex: 1,
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '2px solid #e2e8f0',
                                fontSize: '15px',
                                outline: 'none',
                            }}
                        />
                        <button
                            onClick={handleBarcodeScan}
                            style={{
                                padding: '12px 24px',
                                borderRadius: '12px',
                                border: 'none',
                                background: '#7c3aed',
                                color: 'white',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            Buscar
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            placeholder='Fale ou digite: "Arroz 5kg 24.90"'
                            value={voiceInput}
                            onChange={e => setVoiceInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleVoiceSubmit()}
                            style={{
                                flex: 1,
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '2px solid #e2e8f0',
                                fontSize: '15px',
                                outline: 'none',
                            }}
                        />
                        <button
                            onClick={handleVoiceSubmit}
                            style={{
                                padding: '12px 24px',
                                borderRadius: '12px',
                                border: 'none',
                                background: '#3b82f6',
                                color: 'white',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            Adicionar
                        </button>
                    </div>
                )}

                {voiceResult && (
                    <div style={{
                        marginTop: '12px',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: voiceResult.startsWith('✅') ? '#f0fdf4' : voiceResult.startsWith('🤖') ? '#fef3c7' : '#f0f4ff',
                        color: voiceResult.startsWith('✅') ? '#166534' : voiceResult.startsWith('🤖') ? '#92400e' : '#1e3a8a',
                        fontSize: '14px',
                    }}>
                        {voiceResult}
                    </div>
                )}
            </div>

            {/* Active Deliveries */}
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
                🚀 Entregas Ativas ({activeDeliveries.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {activeDeliveries.length === 0 ? (
                    <div style={{
                        background: '#f8fafc',
                        borderRadius: '16px',
                        padding: '40px',
                        textAlign: 'center',
                        color: '#94a3b8',
                    }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
                        <div>Nenhuma entrega pendente. Bom trabalho!</div>
                    </div>
                ) : (
                    activeDeliveries
                        .sort((a, b) => a.distance_km - b.distance_km)
                        .map(delivery => (
                            <div key={delivery.id} style={{
                                background: 'white',
                                borderRadius: '16px',
                                padding: '20px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                border: `2px solid ${STATUS_COLORS[delivery.status]}22`,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'all 0.2s',
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            background: `${STATUS_COLORS[delivery.status]}15`,
                                            color: STATUS_COLORS[delivery.status],
                                        }}>
                                            {STATUS_LABELS[delivery.status]}
                                        </span>
                                        <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                                            {delivery.order_id}
                                        </span>
                                    </div>
                                    <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                                        {delivery.customer_name}
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                                        📍 {delivery.address} — {delivery.distance_km} km
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                                        {delivery.items_count} itens • R$ {delivery.total.toFixed(2)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => advanceStatus(delivery.id)}
                                    style={{
                                        padding: '12px 20px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: STATUS_COLORS[delivery.status],
                                        color: 'white',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {delivery.status === 'pending' ? 'Coletar' :
                                        delivery.status === 'picked' ? 'Iniciar Entrega' :
                                            'Confirmar Entrega'}
                                </button>
                            </div>
                        ))
                )}
            </div>

            {/* Completed Today */}
            {completedDeliveries.length > 0 && (
                <>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
                        ✅ Concluídas Hoje ({completedDeliveries.length})
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {completedDeliveries.map(delivery => (
                            <div key={delivery.id} style={{
                                background: '#f8fafc',
                                borderRadius: '12px',
                                padding: '16px 20px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                opacity: 0.7,
                            }}>
                                <div>
                                    <span style={{ fontWeight: 500, color: '#475569' }}>
                                        {delivery.customer_name}
                                    </span>
                                    <span style={{ fontSize: '13px', color: '#94a3b8', marginLeft: '12px' }}>
                                        {delivery.items_count} itens • R$ {delivery.total.toFixed(2)}
                                    </span>
                                </div>
                                <span style={{
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    background: '#dcfce7',
                                    color: '#166534',
                                }}>
                                    ✅ Entregue
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
