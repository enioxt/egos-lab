import fetch from 'node-fetch';

const BOT_TOKEN = '8570192341:AAHIpePgeswv_OuZtRuSxVzDbVNny18nnWs';
const WEBHOOK_URL = 'https://egos-v3.vercel.app/api/telegram/intelink/webhook'; // Assuming production URL
// For local testing with ngrok, the user needs to provide the URL.
// I will default to a placeholder and ask the user to run it with their URL if local.

async function setWebhook() {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${WEBHOOK_URL}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('Set Webhook Result:', data);
    } catch (error) {
        console.error('Error setting webhook:', error);
    }
}

setWebhook();
