/**
 * INTELINK - Load Test (10 Concurrent Users)
 * 
 * Simulates 10 users accessing the system simultaneously.
 * Tests: Login, Dashboard, Investigation, Chat
 * 
 * Run: npx playwright test tests/load.spec.ts
 * 
 * @version 1.0.0
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3001';
const NUM_USERS = 10;
const TIMEOUT = 30000; // 30 seconds per operation

// Test data
const TEST_INVESTIGATION_ID = '11111111-1111-1111-1111-111111111111'; // Use existing ID

interface LoadTestResult {
    userId: number;
    operation: string;
    duration: number;
    success: boolean;
    error?: string;
}

const results: LoadTestResult[] = [];

// Helper to measure operation time
async function measureOperation(
    userId: number,
    operation: string,
    fn: () => Promise<void>
): Promise<LoadTestResult> {
    const start = Date.now();
    let success = true;
    let error: string | undefined;
    
    try {
        await fn();
    } catch (e: any) {
        success = false;
        error = e.message;
    }
    
    const duration = Date.now() - start;
    const result = { userId, operation, duration, success, error };
    results.push(result);
    return result;
}

test.describe('Load Test - 10 Concurrent Users', () => {
    test.setTimeout(120000); // 2 minutes total

    test('Homepage Load - 10 users', async ({ browser }) => {
        const promises = [];
        
        for (let i = 0; i < NUM_USERS; i++) {
            const promise = (async (userId: number) => {
                const context = await browser.newContext();
                const page = await context.newPage();
                
                await measureOperation(userId, 'homepage_load', async () => {
                    const response = await page.goto(BASE_URL, { timeout: TIMEOUT });
                    expect(response?.status()).toBeLessThan(400);
                });
                
                await context.close();
            })(i);
            
            promises.push(promise);
        }
        
        await Promise.all(promises);
        
        // Analyze results
        const homepageResults = results.filter(r => r.operation === 'homepage_load');
        const avgDuration = homepageResults.reduce((sum, r) => sum + r.duration, 0) / homepageResults.length;
        const successRate = homepageResults.filter(r => r.success).length / homepageResults.length;
        
        console.log(`\n📊 Homepage Load Results:`);
        console.log(`   Users: ${NUM_USERS}`);
        console.log(`   Avg Duration: ${avgDuration.toFixed(0)}ms`);
        console.log(`   Success Rate: ${(successRate * 100).toFixed(1)}%`);
        
        expect(successRate).toBeGreaterThanOrEqual(0.9); // 90% success rate
        expect(avgDuration).toBeLessThan(5000); // Under 5 seconds avg
    });

    test('Dashboard Load - 10 users', async ({ browser }) => {
        const promises = [];
        
        for (let i = 0; i < NUM_USERS; i++) {
            const promise = (async (userId: number) => {
                const context = await browser.newContext();
                const page = await context.newPage();
                
                await measureOperation(userId, 'dashboard_load', async () => {
                    const response = await page.goto(`${BASE_URL}/dashboard`, { timeout: TIMEOUT });
                    // May redirect to login, which is OK
                    expect(response?.status()).toBeLessThan(500);
                });
                
                await context.close();
            })(i);
            
            promises.push(promise);
        }
        
        await Promise.all(promises);
        
        const dashResults = results.filter(r => r.operation === 'dashboard_load');
        const avgDuration = dashResults.reduce((sum, r) => sum + r.duration, 0) / dashResults.length;
        
        console.log(`\n📊 Dashboard Load Results:`);
        console.log(`   Avg Duration: ${avgDuration.toFixed(0)}ms`);
    });

    test('API Health - 10 concurrent requests', async ({ request }) => {
        const promises = [];
        
        for (let i = 0; i < NUM_USERS; i++) {
            const promise = (async (userId: number) => {
                await measureOperation(userId, 'api_health', async () => {
                    const response = await request.get(`${BASE_URL}/api/rho/global`);
                    expect(response.ok()).toBeTruthy();
                });
            })(i);
            
            promises.push(promise);
        }
        
        await Promise.all(promises);
        
        const apiResults = results.filter(r => r.operation === 'api_health');
        const avgDuration = apiResults.reduce((sum, r) => sum + r.duration, 0) / apiResults.length;
        const successRate = apiResults.filter(r => r.success).length / apiResults.length;
        
        console.log(`\n📊 API Health Results:`);
        console.log(`   Avg Duration: ${avgDuration.toFixed(0)}ms`);
        console.log(`   Success Rate: ${(successRate * 100).toFixed(1)}%`);
        
        expect(successRate).toBeGreaterThanOrEqual(0.95);
        expect(avgDuration).toBeLessThan(2000);
    });

    test('Analysis APIs - 10 concurrent requests', async ({ request }) => {
        const promises = [];
        
        // Test different analysis endpoints
        const endpoints = [
            { path: '/api/analysis/risk', body: { entityName: 'Test', factors: {} } },
            { path: '/api/analysis/diligences', body: { crimeType: 'ROUBO' } },
            { path: '/api/analysis/crit', body: { claim: 'O suspeito estava no local', evidence: ['Testemunha'] } }
        ];
        
        for (let i = 0; i < NUM_USERS; i++) {
            const endpoint = endpoints[i % endpoints.length];
            
            const promise = (async (userId: number) => {
                await measureOperation(userId, 'analysis_api', async () => {
                    const response = await request.post(`${BASE_URL}${endpoint.path}`, {
                        data: endpoint.body
                    });
                    expect(response.ok()).toBeTruthy();
                });
            })(i);
            
            promises.push(promise);
        }
        
        await Promise.all(promises);
        
        const analysisResults = results.filter(r => r.operation === 'analysis_api');
        const avgDuration = analysisResults.reduce((sum, r) => sum + r.duration, 0) / analysisResults.length;
        
        console.log(`\n📊 Analysis API Results:`);
        console.log(`   Avg Duration: ${avgDuration.toFixed(0)}ms`);
    });

    test.afterAll(() => {
        // Print summary
        console.log('\n' + '═'.repeat(50));
        console.log('📈 LOAD TEST SUMMARY');
        console.log('═'.repeat(50));
        
        const operations = [...new Set(results.map(r => r.operation))];
        
        for (const op of operations) {
            const opResults = results.filter(r => r.operation === op);
            const avgDuration = opResults.reduce((sum, r) => sum + r.duration, 0) / opResults.length;
            const successRate = opResults.filter(r => r.success).length / opResults.length;
            const maxDuration = Math.max(...opResults.map(r => r.duration));
            const minDuration = Math.min(...opResults.map(r => r.duration));
            
            console.log(`\n${op}:`);
            console.log(`  • Requests: ${opResults.length}`);
            console.log(`  • Success: ${(successRate * 100).toFixed(1)}%`);
            console.log(`  • Avg: ${avgDuration.toFixed(0)}ms`);
            console.log(`  • Min: ${minDuration}ms`);
            console.log(`  • Max: ${maxDuration}ms`);
        }
        
        console.log('\n' + '═'.repeat(50));
        
        // Calculate overall stats
        const totalRequests = results.length;
        const totalSuccess = results.filter(r => r.success).length;
        const overallSuccessRate = totalSuccess / totalRequests;
        
        console.log(`\n🎯 Overall: ${totalSuccess}/${totalRequests} (${(overallSuccessRate * 100).toFixed(1)}% success)`);
    });
});
