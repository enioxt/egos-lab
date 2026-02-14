import { PaymentIntent, LedgerEntry, Wallet, SplitRule, LedgerEntryType, LedgerCategory } from './types';

export class LedgerService {
    private wallets: Map<string, Wallet> = new Map();
    private entries: LedgerEntry[] = [];

    constructor() {
        // Initialize Platform Wallet
        this.createWallet('platform');
    }

    createWallet(ownerId: string): Wallet {
        if (this.wallets.has(ownerId)) return this.wallets.get(ownerId)!;

        const wallet: Wallet = {
            id: `w_${ownerId}_${Date.now()}`,
            ownerId,
            balance: 0,
            pendingBalance: 0,
            currency: 'BRL',
            updatedAt: new Date().toISOString()
        };
        this.wallets.set(ownerId, wallet);
        return wallet;
    }

    getWallet(ownerId: string): Wallet | undefined {
        return this.wallets.get(ownerId);
    }

    async processPayment(intent: PaymentIntent, splitRules: SplitRule[]): Promise<LedgerEntry[]> {
        if (intent.status !== 'succeeded') {
            throw new Error(`Cannot process payment with status: ${intent.status}`);
        }

        const createdEntries: LedgerEntry[] = [];
        let remainingAmount = intent.amount;

        // 1. Credit the Platform (Holding) first? Or distribute directly?
        // User pays -> Platform accounts receivable -> Split -> Wallets

        // For simplicity in this core:
        // Total Amount comes in.
        // Splits are calculated.
        // Remainders go to whom? Usually the Provider or Platform depending on model.
        // Let's assume the intent amount is the total paid by the user.

        for (const rule of splitRules) {
            let splitAmount = 0;
            if (rule.type === 'percentage') {
                splitAmount = Math.floor(intent.amount * (rule.value / 100));
            } else {
                splitAmount = rule.value;
            }

            if (splitAmount > remainingAmount) {
                console.warn(`Split amount ${splitAmount} exceeds remaining ${remainingAmount}. Capping.`);
                splitAmount = remainingAmount;
            }

            // Credit the recipient wallet
            const entry = this.createEntry(
                intent.id,
                rule.recipientId,
                splitAmount,
                'credit',
                rule.isPlatformFee ? 'platform_fee' : 'payment',
                `Split from payment ${intent.id}`
            );

            createdEntries.push(entry);
            remainingAmount -= splitAmount;
        }

        // Identify primary recipient (usually the provider in a marketplace)
        // If there is ANY remainder, it usually goes to the main provider or platform foundation.
        // For this engine, we require split rules to sum to < = 100% or Total.
        // If strict marketplace, the remainder goes to the provider.

        // TODO: Strict validation or default remainder handling.
        // Ideally, the caller should provide a "Main Recipient" rule that takes the rest.

        return createdEntries;
    }

    private createEntry(
        transactionId: string,
        accountId: string,
        amount: number,
        type: LedgerEntryType,
        category: LedgerCategory,
        description: string
    ): LedgerEntry {
        const wallet = this.getWallet(accountId) || this.createWallet(accountId);

        // Update Balance
        if (type === 'credit') {
            wallet.balance += amount;
        } else {
            if (wallet.balance < amount) throw new Error(`Insufficient funds in wallet ${accountId}`);
            wallet.balance -= amount;
        }
        wallet.updatedAt = new Date().toISOString();

        const entry: LedgerEntry = {
            id: `led_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            transactionId,
            accountId,
            amount,
            type,
            category,
            balanceAfter: wallet.balance,
            description,
            createdAt: new Date().toISOString()
        };

        this.entries.push(entry);
        return entry;
    }

    getBalance(ownerId: string): number {
        return this.wallets.get(ownerId)?.balance || 0;
    }
}
