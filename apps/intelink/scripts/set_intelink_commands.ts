import fetch from 'node-fetch';

const BOT_TOKEN = '8570192341:AAHIpePgeswv_OuZtRuSxVzDbVNny18nnWs';

const commands = [
    { command: 'start', description: 'Iniciar o Intelink' },
    { command: 'help', description: 'Ver comandos disponíveis' },
    { command: 'investigation', description: 'Criar ou selecionar um caso' },
    { command: 'prompt', description: 'Obter Meta-Prompt para extração' },
    { command: 'ingest', description: 'Ingerir JSON de inteligência' },
    { command: 'whois', description: 'Consultar ficha de entidade' },
    { command: 'search', description: 'Busca textual no caso' }
];

async function setCommands() {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commands })
        });
        const data = await response.json();
        console.log('Set Commands Result:', data);
    } catch (error) {
        console.error('Error setting commands:', error);
    }
}

setCommands();
