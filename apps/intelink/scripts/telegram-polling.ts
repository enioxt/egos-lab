/**
 * INTELINK Telegram Polling Bridge
 * Polls Telegram for updates and forwards to local webhook
 * 
 * Usage: npx tsx scripts/telegram-polling.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local from apps/intelink directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_INTELINK || process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = 'http://localhost:3001/api/telegram/webhook';

if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN_INTELINK not set');
    process.exit(1);
}

// After check, we know BOT_TOKEN is defined
const TOKEN: string = BOT_TOKEN;
let offset = 0;

async function poll() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 INTELINK Telegram Polling Active');
    console.log(`🔌 Forwarding to: ${WEBHOOK_URL}`);
    console.log(`🤖 Bot Token: ${TOKEN.slice(0, 10)}...`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    while (true) {
        try {
            const res = await fetch(
                `https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${offset + 1}&timeout=30`
            );
            const data = await res.json() as { ok: boolean; result?: any[] };

            if (!data.ok) {
                console.error('❌ Telegram API Error:', data);
                await new Promise(r => setTimeout(r, 5000));
                continue;
            }

            const updates = data.result || [];

            if (updates.length > 0) {
                console.log(`\n📨 ${new Date().toLocaleTimeString()} - ${updates.length} update(s)`);

                for (const update of updates) {
                    offset = update.update_id;

                    // Log message preview
                    const msg = update.message?.text || update.callback_query?.data || '[file/media]';
                    const from = update.message?.from?.username || update.callback_query?.from?.username || 'unknown';
                    console.log(`   👤 @${from}: ${msg.slice(0, 50)}`);

                    try {
                        const webhookRes = await fetch(WEBHOOK_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(update)
                        });

                        if (webhookRes.ok) {
                            console.log(`   ✅ Forwarded OK`);
                        } else {
                            const err = await webhookRes.text();
                            console.error(`   ⚠️ Webhook Error: ${webhookRes.status} - ${err.slice(0, 100)}`);
                        }
                    } catch (err) {
                        console.error(`   ❌ Failed to reach ${WEBHOOK_URL}`);
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
