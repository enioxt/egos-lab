
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;

const PROJECT_REF = process.env.SUPABASE_PROJECT_ID || 'your-project-ref';
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

if (!DB_PASSWORD) {
    console.error('❌ Missing SUPABASE_DB_PASSWORD in .env');
    process.exit(1);
}

// Connection string for Supabase (Transaction Mode usually 6543, Session Mode 5432)
// Using Session Mode for schema changes
const CONNECTION_STRING = `postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`;

const SQL_FILE_PATH = path.join(process.cwd(), 'docs/database/eagle_eye_schema.sql');

async function runSchema() {
    if (!fs.existsSync(SQL_FILE_PATH)) {
        console.error('❌ SQL file not found at:', SQL_FILE_PATH);
        process.exit(1);
    }

    const sqlContent = fs.readFileSync(SQL_FILE_PATH, 'utf-8');
    console.log('🚀 Connecting to Supabase Database...');

    const client = new Client({
        connectionString: CONNECTION_STRING,
        ssl: { rejectUnauthorized: false } // Required for Supabase
    });

    try {
        await client.connect();
        console.log('✅ Connected! Applying schema...');

        await client.query(sqlContent);

        console.log('✅ Schema applied successfully!');
    } catch (err: any) {
        console.error('❌ Database Error:', err.message);
    } finally {
        await client.end();
    }
}

runSchema();
