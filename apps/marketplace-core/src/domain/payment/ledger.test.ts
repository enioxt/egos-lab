import { describe, it, expect } from 'vitest';
import { LedgerService } from './ledger';
import { PaymentIntent } from './types';

describe('LedgerService', () => {
    it('should split payment correctly between platform and provider', async () => {
        const ledger = new LedgerService();
        const providerId = 'provider_123';
        const platformId = 'platform';

        const payment: PaymentIntent = {
            id: 'pay_1',
            amount: 10000, // R$ 100,00
            currency: 'BRL',
            provider: 'asaas',
            status: 'succeeded',
            payerId: 'user_1',
            metadata: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const splits = [
            { recipientId: platformId, type: 'percentage', value: 20, isPlatformFee: true }, // 20% = 2000
            { recipientId: providerId, type: 'percentage', value: 80, isPlatformFee: false } // 80% = 8000
        ];

        // @ts-ignore
        await ledger.processPayment(payment, splits);

        expect(ledger.getBalance(platformId)).toBe(2000);
        expect(ledger.getBalance(providerId)).toBe(8000);
    });

    it('should handle fixed fee splits', async () => {
        const ledger = new LedgerService();
        const providerId = 'provider_456';
        const platformId = 'platform';

        const payment: PaymentIntent = {
            id: 'pay_2',
            amount: 5000, // R$ 50,00
            currency: 'BRL',
            provider: 'manual',
            status: 'succeeded',
            payerId: 'user_2',
            metadata: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const splits = [
            { recipientId: platformId, type: 'fixed', value: 500, isPlatformFee: true }, // R$ 5,00
            { recipientId: providerId, type: 'fixed', value: 4500, isPlatformFee: false } // R$ 45,00
        ];

        // @ts-ignore
        await ledger.processPayment(payment, splits);

        expect(ledger.getBalance(platformId)).toBe(500);
        expect(ledger.getBalance(providerId)).toBe(4500);
    });
});
