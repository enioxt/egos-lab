export type CampaignChannel = 'outdoor_9x3' | 'led_panel_monthly' | 'tourist_signage' | 'digital_ads';

export interface CostReference {
    min: number;
    max: number;
    unit: string;
    source: string;
}

export const MARKETING_COSTS: Record<CampaignChannel, CostReference> = {
    outdoor_9x3: {
        min: 1020,
        max: 4650,
        unit: 'unidade/mês (estimado)',
        source: 'Secretaria de Comunicação PR / Pref. Santa Carmem'
    },
    led_panel_monthly: {
        min: 21000,
        max: 48600,
        unit: 'mês (rotação)',
        source: 'Outmídia 2025'
    },
    tourist_signage: {
        min: 50000,
        max: 350000,
        unit: 'projeto (estimativa municipal)',
        source: 'SETUR ES / Contratos Públicos'
    },
    digital_ads: {
        min: 500,
        max: 5000,
        unit: 'budget inicial sugerido',
        source: 'Benchmark PME'
    }
};

export function estimateCampaign(items: { channel: CampaignChannel; quantity: number }[]) {
    let totalMin = 0;
    let totalMax = 0;

    const breakdown = items.map(item => {
        const cost = MARKETING_COSTS[item.channel];
        const itemMin = cost.min * item.quantity;
        const itemMax = cost.max * item.quantity;

        totalMin += itemMin;
        totalMax += itemMax;

        return {
            channel: item.channel,
            quantity: item.quantity,
            estimatedRange: { min: itemMin, max: itemMax },
            reference: cost
        };
    });

    return {
        totalRange: { min: totalMin, max: totalMax },
        breakdown
    };
}
