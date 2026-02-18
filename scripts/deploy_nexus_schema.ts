/**
 * Deploy Nexus Market schema to Supabase via direct Postgres connection.
 * 
 * Required environment variables (from .env):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - SUPABASE_DB_PASSWORD
 * 
 * SECURITY: Never hardcode credentials. Always use process.env.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!serviceRoleKey || !supabaseUrl) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in .env');
    process.exit(1);
}

if (!dbPassword) {
    console.error('❌ Missing SUPABASE_DB_PASSWORD in .env');
    process.exit(1);
}

// Extract project ref from URL (e.g., "lhscgsqhiooyatkebose" from "https://lhscgsqhiooyatkebose.supabase.co")
const projectRef = new URL(supabaseUrl).hostname.split('.')[0];

async function deploySchema() {
    const schemaPath = path.resolve(__dirname, '../apps/nexus-market/supabase/schema.sql');

    if (!fs.existsSync(schemaPath)) {
        console.error('❌ Schema file not found:', schemaPath);
        process.exit(1);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('📄 Deploying schema from:', schemaPath);

    // Build connection string from env vars — never hardcode
    const connectionString = `postgres://postgres.${projectRef}:${dbPassword}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`;

    const { Client } = require('pg');
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('✅ Connected to Database');

        await client.query(schemaSql);
        console.log('✅ Schema deployed successfully');

        await client.end();
    } catch (err: any) {
        console.error('❌ Deployment failed:', err.message);
        process.exit(1);
    }
}

deploySchema();
