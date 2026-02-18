/**
 * Intelink Polling Bridge (Dev Tool)
 * 
 * Bridges Telegram -> Localhost for @IntelinkPolicialBot
 * Usage: npx tsx scripts/intelink_polling_dev.ts
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BOT_TOKEN = '8570192341:AAHIpePgeswv_OuZtRuSxVzDbVNny18nnWs';
const LOCAL_WEBHOOK_URL = process.env.INTELINK_WEBHOOK_URL || 'http://localhost:3001/api/telegram/intelink/webhook';

let offset = 0;

async function poll() {
    console.log(`🚀 Intelink Polling Bridge Active`);
    console.log(`🔌 Forwarding to: ${LOCAL_WEBHOOK_URL}`);
    console.log(`🤖 Bot Token: ${BOT_TOKEN.slice(0, 5)}...`);

    // Clear Webhook first to enable polling
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`);

    while (true) {
        try {
            const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset + 1}&timeout=30`);
            const data = await res.json();

            if (!data.ok) {
                console.error('❌ Telegram API Error:', data);
                await new Promise(r => setTimeout(r, 5000));
                continue;
            }

            const updates = data.result;

            if (updates.length > 0) {
                console.log(`📨 Received ${updates.length} updates`);

                for (const update of updates) {
                    offset = update.update_id;

                    try {
                        const webhookRes = await fetch(LOCAL_WEBHOOK_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(update)
                        });
                        console.log(`   👉 Forwarded update ${update.update_id}: ${webhookRes.status}`);

                        // Rate limit to prevent flooding localhost
                        await new Promise(r => setTimeout(r, 50));
                    } catch (err) {
                        console.error(`   ❌ Failed to reach local server at ${LOCAL_WEBHOOK_URL}. Is it running?`);
                    }
                }
            }

        } catch (error) {
            console.error('💥 Polling Error:', error);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

poll();
