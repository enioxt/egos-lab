import { test, expect } from '@playwright/test';

/**
 * Load Test - Simulate 10 Concurrent Users
 * 
 * Run with: npx playwright test load.spec.ts --workers=10
 * 
 * Simulates multiple users accessing various endpoints simultaneously
 * to verify system performance under load.
 */

// Test user credentials (would be env vars in production)
const TEST_USERS = Array.from({ length: 10 }, (_, i) => ({
    id: `user-${i + 1}`,
    name: `TestUser${i + 1}`
}));

test.describe.configure({ mode: 'parallel' });

test.describe('Load Test - 10 Concurrent Users', () => {
    
    // Test 1: Concurrent API health checks
    for (let i = 0; i < 10; i++) {
        test(`User ${i + 1}: API Health Check`, async ({ request }) => {
            const start = Date.now();
            const response = await request.get('/api/health');
            const duration = Date.now() - start;
            
            expect(response.status()).toBe(200);
            expect(duration).toBeLessThan(2000); // Should respond in < 2s
            
            console.log(`User ${i + 1}: Health check completed in ${duration}ms`);
        });
    }
    
    // Test 2: Concurrent page loads (unauthenticated - auth page)
    for (let i = 0; i < 10; i++) {
        test(`User ${i + 1}: Auth Page Load`, async ({ page }) => {
            const start = Date.now();
            await page.goto('/auth');
            const duration = Date.now() - start;
            
            // Should load within 5 seconds
            expect(duration).toBeLessThan(5000);
            
            // Should have core UI elements
            await expect(page.locator('input')).toBeVisible({ timeout: 5000 });
            
            console.log(`User ${i + 1}: Auth page loaded in ${duration}ms`);
        });
    }
    
    // Test 3: Concurrent investigation list API calls
    for (let i = 0; i < 10; i++) {
        test(`User ${i + 1}: Investigations API (no auth)`, async ({ request }) => {
            const start = Date.now();
            const response = await request.get('/api/investigations');
            const duration = Date.now() - start;
            
            // Should respond (401 is expected without auth, but should be fast)
            expect([200, 401, 403]).toContain(response.status());
            expect(duration).toBeLessThan(3000);
            
            console.log(`User ${i + 1}: Investigations API responded in ${duration}ms with status ${response.status()}`);
        });
    }
});

test.describe('Load Test - API Stress', () => {
    
    // Test rapid-fire requests to single endpoint
    test('Rapid fire: 50 health checks in sequence', async ({ request }) => {
        const results: number[] = [];
        
        for (let i = 0; i < 50; i++) {
            const start = Date.now();
            const response = await request.get('/api/health');
            const duration = Date.now() - start;
            
            expect(response.status()).toBe(200);
            results.push(duration);
        }
        
        const avg = results.reduce((a, b) => a + b, 0) / results.length;
        const max = Math.max(...results);
        const min = Math.min(...results);
        
        console.log(`50 requests - Avg: ${avg.toFixed(0)}ms, Min: ${min}ms, Max: ${max}ms`);
        
        // Average should be under 500ms
        expect(avg).toBeLessThan(500);
    });
    
    // Test parallel API requests
    test('Parallel: 20 simultaneous API calls', async ({ request }) => {
        const start = Date.now();
        
        const promises = Array.from({ length: 20 }, () => 
            request.get('/api/health')
        );
        
        const responses = await Promise.all(promises);
        const duration = Date.now() - start;
        
        // All should succeed
        responses.forEach(response => {
            expect(response.status()).toBe(200);
        });
        
        // Should complete within 5 seconds
        expect(duration).toBeLessThan(5000);
        
        console.log(`20 parallel requests completed in ${duration}ms`);
    });
});

test.describe('Load Test - Page Performance', () => {
    
    test('Auth page - Core Web Vitals', async ({ page }) => {
        await page.goto('/auth');
        
        // Measure performance metrics
        const metrics = await page.evaluate(() => {
            const paint = performance.getEntriesByType('paint');
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            
            return {
                FCP: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                domContentLoaded: navigation?.domContentLoadedEventEnd || 0,
                loadComplete: navigation?.loadEventEnd || 0,
            };
        });
        
        console.log('Performance Metrics:', metrics);
        
        // FCP should be under 2.5s (good threshold)
        expect(metrics.FCP).toBeLessThan(2500);
        
        // DOM should be ready under 3s
        expect(metrics.domContentLoaded).toBeLessThan(3000);
    });
    
    test('Auth page - No JavaScript errors', async ({ page }) => {
        const errors: string[] = [];
        
        page.on('pageerror', error => {
            errors.push(error.message);
        });
        
        await page.goto('/auth');
        await page.waitForLoadState('networkidle');
        
        // Should have no JS errors
        expect(errors).toHaveLength(0);
        
        if (errors.length > 0) {
            console.log('JS Errors found:', errors);
        }
    });
});
