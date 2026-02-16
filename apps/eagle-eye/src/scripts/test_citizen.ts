
import { CitizenReporter } from '../modules/tourism/citizen-logger';
import { SocialListener } from '../modules/tourism/social-listener';

console.log('🦅 Eagle Eye — Citizen Intelligence Test');
console.log('═══════════════════════════════════════════════════════════\n');

async function testsocial() {
    // 1. Test Social Listener
    console.log('📡 Testing Social Listener for "Patos de Minas"...');
    const listener = new SocialListener("Patos de Minas");
    const signals = await listener.searchSocialSignals();

    console.log(`   ✅ Found ${signals.length} signals.`);
    signals.forEach(s => {
        const sentimentEmoji = s.sentiment === 'positive' ? '🟢' : s.sentiment === 'negative' ? '🔴' : '⚪';
        console.log(`   ${sentimentEmoji} [${s.platform.toUpperCase()}] ${s.description}`);
    });
    console.log('');
}

async function testCitizen() {
    // 2. Test Citizen Reporter (Chatbot)
    console.log('💬 Testing Citizen Reporter...');
    const bot = new CitizenReporter();

    // Step 1: Start
    const startMsg = bot.startSession("Patos de Minas", "João da Pamonha");
    console.log(`   🤖 Bot: ${startMsg.replace(/\n/g, ' ')}\n`);

    // Step 2: User Reply (Asset)
    const userMsg1 = "Olha, tem a Cachoeira do Zé que é escondida mas é top.";
    console.log(`   👤 User: ${userMsg1}`);
    const reply1 = bot.processReply(userMsg1);
    console.log(`   🤖 Bot: ${reply1.response.replace(/\n/g, ' ')}`);

    if (reply1.assetDetected) {
        console.log(`      ✨ Asset Detected: ${reply1.assetDetected.name}`);
    }
    console.log('');

    // Step 3: Report
    console.log(bot.getReport());
}

async function run() {
    await testsocial();
    await testCitizen();
}

run();
