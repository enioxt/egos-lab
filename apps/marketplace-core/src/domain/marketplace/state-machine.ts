import { RequestStatus, ProposalStatus, BookingStatus } from './types';

export interface StateMachine<S extends string, E extends string> {
    currentState: S;
    allowedTransitions: Record<S, E[]>;
    transition(event: E): S;
}

// Request Machine
export class RequestMachine {
    constructor(private status: RequestStatus) { }

    canTransition(to: RequestStatus): boolean {
        const map: Record<RequestStatus, RequestStatus[]> = {
            'draft': ['open', 'canceled'],
            'open': ['booked', 'expired', 'canceled'],
            'booked': ['completed', 'canceled'],
            'expired': ['open', 'canceled'], // Re-open
            'completed': [],
            'canceled': ['draft'] // Clone/Re-open
        };
        return map[this.status]?.includes(to) ?? false;
    }
}

// Proposal Machine
type ProposalAction = 'send' | 'view' | 'accept' | 'reject' | 'expire';
export class ProposalMachine {
    constructor(private status: ProposalStatus) { }

    next(action: ProposalAction): ProposalStatus {
        switch (this.status) {
            case 'draft':
                if (action === 'send') return 'sent';
                break;
            case 'sent':
                if (action === 'view') return 'viewed';
                if (action === 'accept') return 'accepted';
                if (action === 'reject') return 'rejected';
                if (action === 'expire') return 'expired';
                break;
            case 'viewed':
                if (action === 'accept') return 'accepted';
                if (action === 'reject') return 'rejected';
                if (action === 'expire') return 'expired';
                break;
        }
        throw new Error(`Invalid transition from ${this.status} via ${action}`);
    }
}

// Booking Machine (The Contract)
type BookingAction = 'schedule' | 'start' | 'complete' | 'cancel' | 'dispute' | 'refund';
export class BookingMachine {
    constructor(private status: BookingStatus) { }

    next(action: BookingAction): BookingStatus {
        const transitions: Record<BookingStatus, Partial<Record<BookingAction, BookingStatus>>> = {
            'pending_payment': { 'schedule': 'scheduled', 'cancel': 'canceled' },
            'scheduled': { 'start': 'in_progress', 'cancel': 'canceled', 'dispute': 'disputed' },
            'in_progress': { 'complete': 'completed', 'dispute': 'disputed' },
            'completed': { 'dispute': 'disputed', 'refund': 'refunded' }, // Post-completion dispute window
            'disputed': { 'refund': 'refunded', 'complete': 'completed' }, // Resolution
            'refunded': {},
            'canceled': {}
        };

        const nextState = transitions[this.status]?.[action];
        if (!nextState) throw new Error(`Invalid transition from ${this.status} via ${action}`);
        return nextState;
    }
}
