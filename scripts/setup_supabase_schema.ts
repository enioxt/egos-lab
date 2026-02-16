import fs from 'fs';
import path from 'path';

const PROJECT_REF = process.env.SUPABASE_PROJECT_ID || 'lhscgsqhiooyatkebose';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
    console.error('❌ Missing SUPABASE_ACCESS_TOKEN environment variable');
    process.exit(1);
}

const SQL_FILE_PATH = path.join(process.cwd(), 'docs/database/eagle_eye_schema.sql');

async function runSchema() {
    if (!fs.existsSync(SQL_FILE_PATH)) {
        console.error('❌ SQL file not found at:', SQL_FILE_PATH);
        process.exit(1);
    }

    const sqlContent = fs.readFileSync(SQL_FILE_PATH, 'utf-8');
    console.log('🚀 Executing SQL schema on Supabase Project:', PROJECT_REF);

    // Using Supabase Management API to execute SQL
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ACCESS_TOKEN}`
        },
        body: JSON.stringify({
            query: sqlContent
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to execute SQL:', response.status, response.statusText);
        console.error('Details:', errorText);
        process.exit(1);
    }

    const result = await response.json();
    console.log('✅ SQL executed successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
}

runSchema();
