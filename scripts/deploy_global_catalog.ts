
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Client } from 'pg';

// Load root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbPassword = process.env.SUPABASE_DB_PASSWORD;
if (!dbPassword) {
    console.error('Error: SUPABASE_DB_PASSWORD not found in .env');
    process.exit(1);
}

async function deployGlobalSchema() {
    const schemaPath = path.resolve(__dirname, '../apps/nexus-market/supabase/schema_global.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Deploying Global Catalog schema from:', schemaPath);

    // Direct connection string
    const directConnectionString = `postgres://postgres:${dbPassword}@db.lhscgsqhiooyatkebose.supabase.co:5432/postgres`;
    // Pooler connection string (Nexus Market project)
    // const connectionString = `postgres://postgres.lhscgsqhiooyatkebose:${dbPassword}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`;

    const client = new Client({
        connectionString: directConnectionString,
    });

    try {
        await client.connect();
        console.log('Connected to Database.');

        await client.query(schemaSql);
        console.log('Global Catalog schema executed successfully!');

        await client.end();
    } catch (err: any) {
        console.error('Database deployment failed:', err.message);
        process.exit(1);
    }
}

deployGlobalSchema();
