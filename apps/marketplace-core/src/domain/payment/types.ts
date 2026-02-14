export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'disputed';
export type LedgerEntryType = 'credit' | 'debit';
export type LedgerCategory = 'payment' | 'payout' | 'platform_fee' | 'adjustment' | 'refund';

export interface PaymentIntent {
    id: string;
    amount: number; // cents
    currency: string;
    provider: 'asaas' | 'stripe' | 'manual';
    providerTransactionId?: string;
    status: PaymentStatus;
    payerId: string;
    metadata: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface SplitRule {
    recipientId: string; // providerId or platform
    type: 'percentage' | 'fixed';
    value: number; // e.g., 10 (10%) or 500 (R$ 5,00)
    isPlatformFee: boolean;
}

export interface LedgerEntry {
    id: string;
    transactionId: string; // link to PaymentIntent or Payout
    accountId: string; // user.id or 'platform'
    amount: number; // cents
    type: LedgerEntryType;
    category: LedgerCategory;
    balanceAfter: number; // running balance check
    description: string;
    createdAt: string;
}

export interface Wallet {
    id: string;
    ownerId: string;
    balance: number; // available for payout
    pendingBalance: number; // future releases
    currency: string;
    updatedAt: string;
}
