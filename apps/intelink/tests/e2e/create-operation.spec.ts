import { test, expect } from '@playwright/test';

/**
 * Create Operation E2E Tests
 * 
 * Tests the full flow of creating a new investigation/operation
 * 
 * NOTE: These tests run with TESTING_MODE=true in api-security.ts
 * so auth checks are bypassed during development.
 */

test.describe('Create Operation Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Set mock auth in localStorage to bypass client-side RBAC
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('intelink_username', 'TestUser');
            localStorage.setItem('intelink_member_id', 'test-user-id');
        });
    });

    test('should load new operation page', async ({ page }) => {
        await page.goto('/investigation/new');
        
        // Should see the page title
        await expect(page.locator('text=Nova Operação')).toBeVisible({ timeout: 10000 });
        
        // Should see the form
        await expect(page.locator('input[placeholder*="Título"]')).toBeVisible();
    });

    test('should fill and submit operation form', async ({ page }) => {
        await page.goto('/investigation/new');
        
        // Wait for page to load
        await expect(page.locator('text=Nova Operação')).toBeVisible({ timeout: 10000 });
        
        // Fill in the title
        const titleInput = page.locator('input[placeholder*="Título"]');
        await titleInput.fill('Operação Teste E2E - ' + Date.now());
        
        // Fill in description (optional)
        const descInput = page.locator('textarea[placeholder*="contexto"]');
        if (await descInput.isVisible()) {
            await descInput.fill('Descrição de teste automatizado');
        }
        
        // Click "Próximo" to go to team selection
        await page.click('button:has-text("Próximo")');
        
        // Should be on team tab
        await expect(page.locator('text=Equipe')).toBeVisible();
        
        // Click "Criar Operação"
        await page.click('button:has-text("Criar Operação")');
        
        // Should redirect to the new operation page
        // Wait for URL to change to /investigation/[id]
        await page.waitForURL(/\/investigation\/[a-f0-9-]+/, { timeout: 15000 });
        
        // Verify we're on an investigation page
        expect(page.url()).toMatch(/\/investigation\/[a-f0-9-]+/);
    });

    test('should show validation error for empty title', async ({ page }) => {
        await page.goto('/investigation/new');
        
        // Wait for page to load
        await expect(page.locator('text=Nova Operação')).toBeVisible({ timeout: 10000 });
        
        // Skip to team tab without filling title
        await page.click('button:has-text("Próximo")');
        
        // Try to create without title - button should be disabled
        const createButton = page.locator('button:has-text("Criar Operação")');
        await expect(createButton).toBeDisabled();
    });

    test('should navigate between form steps', async ({ page }) => {
        await page.goto('/investigation/new');
        
        // Should start on "Informações" step
        await expect(page.locator('text=Dados Básicos')).toBeVisible({ timeout: 10000 });
        
        // Click "Próximo"
        await page.click('button:has-text("Próximo")');
        
        // Should be on "Equipe" step
        await expect(page.locator('text=Equipe')).toBeVisible();
        
        // Click "Voltar"
        await page.click('button:has-text("Voltar")');
        
        // Should be back on "Informações" step
        await expect(page.locator('text=Dados Básicos')).toBeVisible();
    });
});

test.describe('Create Operation - Mobile', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should work on mobile viewport', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('intelink_username', 'MobileUser');
            localStorage.setItem('intelink_member_id', 'mobile-user-id');
        });
        
        await page.goto('/investigation/new');
        
        // Should see the page
        await expect(page.locator('text=Nova Operação')).toBeVisible({ timeout: 10000 });
        
        // Form should be visible and usable
        await expect(page.locator('input[placeholder*="Título"]')).toBeVisible();
        
        // Fill title
        await page.locator('input[placeholder*="Título"]').fill('Mobile Test Op');
        
        // Should be able to navigate
        await page.click('button:has-text("Próximo")');
        await expect(page.locator('text=Equipe')).toBeVisible();
    });
});
