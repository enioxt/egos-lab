
import { Exa } from 'exa-js';

const EXA_API_KEY = process.env.EXA_API_KEY;

async function testExa() {
    if (!EXA_API_KEY) {
        console.error('❌ EXA_API_KEY missing');
        return;
    }

    console.log('🔑 Testing Exa Key:', EXA_API_KEY.slice(0, 8) + '...');

    try {
        // We can't use the exa-js client directly if not installed, but we can fetch
        const response = await fetch('https://api.exa.ai/search', {
            method: 'POST',
            headers: {
                'x-api-key': EXA_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: "latest technology news Brazil",
                numResults: 1
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Exa API Success! Found:', data.results?.length, 'result(s)');
    } catch (err: any) {
        console.error('❌ Exa Test Failed:', err.message);
    }
}

testExa();
