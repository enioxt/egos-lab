import { describe, it, expect } from 'vitest';
import { RequestMachine, ProposalMachine, BookingMachine } from './state-machine';

describe('Marketplace State Machines', () => {

    describe('RequestMachine', () => {
        it('should allow draft -> open', () => {
            const machine = new RequestMachine('draft');
            expect(machine.canTransition('open')).toBe(true);
        });

        it('should prevent draft -> booked', () => {
            const machine = new RequestMachine('draft');
            expect(machine.canTransition('booked')).toBe(false);
        });

        it('should allow open -> booked', () => {
            const machine = new RequestMachine('open');
            expect(machine.canTransition('booked')).toBe(true);
        });
    });

    describe('ProposalMachine', () => {
        it('should transition draft -> sent on send action', () => {
            const machine = new ProposalMachine('draft');
            expect(machine.next('send')).toBe('sent');
        });

        it('should transition sent -> viewed on view action', () => {
            const machine = new ProposalMachine('sent');
            expect(machine.next('view')).toBe('viewed');
        });

        it('should throw error on invalid transition', () => {
            const machine = new ProposalMachine('draft');
            expect(() => machine.next('accept')).toThrow();
        });
    });

    describe('BookingMachine', () => {
        it('should transition pending_payment -> scheduled on schedule', () => {
            const machine = new BookingMachine('pending_payment');
            expect(machine.next('schedule')).toBe('scheduled');
        });

        it('should transition scheduled -> in_progress on start', () => {
            const machine = new BookingMachine('scheduled');
            expect(machine.next('start')).toBe('in_progress');
        });

        it('should allow dispute at any active stage', () => {
            const machine = new BookingMachine('scheduled');
            expect(machine.next('dispute')).toBe('disputed');
        });
    });
});
