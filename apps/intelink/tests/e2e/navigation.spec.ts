import { test, expect } from '@playwright/test';

/**
 * Navigation Tests
 * 
 * Tests page navigation and routing
 */

test.describe('Navigation', () => {
    test('home page redirects to auth when not authenticated', async ({ page }) => {
        await page.goto('/');
        await page.waitForURL(/\/auth/, { timeout: 10000 });
        
        // Should redirect to auth page
        expect(page.url()).toContain('/auth');
    });

    test('central page redirects to auth', async ({ page }) => {
        await page.goto('/central');
        await page.waitForURL(/\/auth/, { timeout: 10000 });
        
        // Should redirect to auth with returnUrl
        const url = page.url();
        expect(url).toContain('/auth');
        expect(url).toContain('returnUrl=%2Fcentral');
    });

    test('chat page redirects to auth', async ({ page }) => {
        await page.goto('/chat');
        await page.waitForURL(/\/auth/, { timeout: 10000 });
        
        // Should redirect to auth
        expect(page.url()).toContain('/auth');
    });

    test('should have responsive navigation on auth page', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/auth');
        
        // Should still be functional on mobile
        await expect(page.locator('body')).toBeVisible();
    });

    test('404 page for unknown routes', async ({ page }) => {
        const response = await page.goto('/this-page-does-not-exist-12345');
        
        // Should return 404 or redirect to auth
        const url = page.url();
        const status = response?.status();
        expect(status === 404 || url.includes('/auth')).toBeTruthy();
    });
});

test.describe('API Routes', () => {
    test('health check endpoint', async ({ request }) => {
        // Try to access an API route
        const response = await request.get('/api/investigations');
        
        // Should return some response (even if unauthorized)
        expect(response.status()).toBeLessThan(500);
    });

    test('telemetry endpoint accepts POST', async ({ request }) => {
        const response = await request.post('/api/telemetry', {
            data: {
                events: [
                    { event_type: 'test', page: '/test', action: 'test' }
                ]
            }
        });
        
        // Should not error (may be unauthorized, but not crash)
        expect(response.status()).toBeLessThan(500);
    });
});
