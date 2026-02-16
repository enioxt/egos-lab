import { CitizenReporter } from '../modules/tourism/citizen-logger';

function runTest() {
    console.log('🗣️ Testing Citizen Chat + Consensus Logic...\n');

    const bot = new CitizenReporter();
    const welcome = bot.startSession('Patos de Minas', 'Enio');
    console.log(`Bot: ${welcome}\n`);

    const userReply = "Tem uma coxinha incrível no Bar do Zé perto da rodoviária.";
    console.log(`User: ${userReply}\n`);

    const result = bot.processReply(userReply);
    console.log(`Bot: ${result.response}\n`);

    console.log('--- Final Report ---');
    console.log(bot.getReport());
}

runTest();
