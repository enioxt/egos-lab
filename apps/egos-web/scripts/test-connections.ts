
import { createClient } from '@supabase/supabase-js';
import { Octokit } from 'octokit';

import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env from apps/egos-web/.env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });
// Note: In a real Vite app, these are available globally. use dotenv here for standalone testing.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const githubToken = process.env.VITE_GITHUB_TOKEN;

console.log('Testing Connections...');

async function testConnections() {
    // 1. Test Supabase
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Supabase env vars missing');
        return;
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('commits').select('*').limit(1);
    if (error) {
        console.error('❌ Supabase Error:', error.message);
    } else {
        console.log('✅ Supabase connected. Rows in commits:', data.length);
    }

    // 2. Test GitHub
    if (!githubToken) {
        console.error('❌ GitHub token missing');
        return;
    }
    const octokit = new Octokit({ auth: githubToken });
    try {
        const { data: user } = await octokit.rest.users.getAuthenticated();
        console.log(`✅ GitHub connected as: ${user.login}`);

        // Test Rate Limit
        const { data: limits } = await octokit.rest.rateLimit.get();
        console.log(`ℹ️  Rate Limit: ${limits.rate.remaining}/${limits.rate.limit}`);

    } catch (err: any) {
        console.error('❌ GitHub Error:', err.message);
    }
}

testConnections();
