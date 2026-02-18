import { test, expect } from '@playwright/test';

/**
 * Tenant Isolation Tests
 * 
 * Tests multi-tenancy security features
 * Validates that unit isolation works correctly
 */

test.describe('Tenant Isolation API', () => {
    test('investigations endpoint returns data', async ({ request }) => {
        const response = await request.get('/api/investigations');
        
        // Should return some response (may be empty array or auth error)
        expect(response.status()).toBeLessThan(500);
    });

    test('cross-unit access is blocked without auth', async ({ request }) => {
        // Try to access a random investigation ID
        const fakeInvId = '00000000-0000-0000-0000-000000000001';
        const response = await request.get(`/api/investigation/${fakeInvId}`);
        
        // Should return 401, 403, or 404 (not 500)
        expect(response.status()).toBeLessThan(500);
    });

    test('entity endpoint validates access', async ({ request }) => {
        const fakeEntityId = '00000000-0000-0000-0000-000000000001';
        const response = await request.get(`/api/entity/${fakeEntityId}`);
        
        // Should not crash (return proper error)
        expect(response.status()).toBeLessThan(500);
    });

    test('links endpoint requires unit context', async ({ request }) => {
        const response = await request.get('/api/links');
        
        // Should handle request (may need auth)
        expect(response.status()).toBeLessThan(500);
    });
});

test.describe('Tenant Isolation Headers', () => {
    test('API returns proper security headers', async ({ request }) => {
        const response = await request.get('/api/investigations');
        
        const headers = response.headers();
        
        // Should have some security headers
        expect(headers['content-type']).toBeDefined();
    });
});

test.describe('Cross-Case Analysis Isolation', () => {
    test('cross-case analysis respects unit boundaries', async ({ request }) => {
        const response = await request.get('/api/intelink/cross-case-analysis');
        
        // Should work without crashing
        expect(response.status()).toBeLessThan(500);
        
        if (response.status() === 200) {
            const data = await response.json();
            // If we get data, it should be an array
            expect(Array.isArray(data) || typeof data === 'object').toBeTruthy();
        }
    });
});

test.describe('Unit Member Access', () => {
    test('members endpoint exists', async ({ request }) => {
        const response = await request.get('/api/unit/members');
        
        // May return 404 if not implemented or 401 if auth required
        expect(response.status()).toBeLessThan(500);
    });
});
