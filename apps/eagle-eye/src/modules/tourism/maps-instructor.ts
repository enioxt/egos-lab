
import { GoogleMapsReadinessChecklist } from './types';

export class MapsInstructor {

    generateGuide(businessName: string, checklist: GoogleMapsReadinessChecklist): string {
        const steps: string[] = [];

        if (!checklist.profileExists) {
            return `🚨 **CRÍTICO:** O local "${businessName}" não existe no Google Maps!\n\n` +
                `👉 **Passo 1:** Abra o Google Maps.\n` +
                `👉 **Passo 2:** Clique em "Adicionar um lugar faltando".\n` +
                `👉 **Passo 3:** Preencha o nome e categoria. Tire uma foto da fachada se puder.\n` +
                `🏆 **Recompensa:** +100 Pontos no Eagle Eye!`;
        }

        if (!checklist.claimed) {
            steps.push(
                `🔑 **Reivindique o Perfil:** Ninguém é dono desse perfil. Se você é o dono, clique em "É proprietário desta empresa?" no Maps para ganhar o controle.`
            );
        }

        if (checklist.photosCount < 5) {
            steps.push(
                `📸 **Adicione Fotos:** O lugar tem poucas fotos. Clientes adoram ver o ambiente e cardápio. Adicione pelo menos 5 fotos boas.`
            );
        }

        if (!checklist.hoursUpdated) {
            steps.push(
                `🕒 **Horários:** Verifique se os horários de funcionamento estão corretos. Muita gente desiste de ir se achar que está fechado.`
            );
        }

        if (steps.length === 0) {
            return `✅ Parabéns! O perfil de "${businessName}" está excelente. Continue respondendo os reviews!`;
        }

        return `🛠️ **Guia de Melhoria para ${businessName}:**\n\n` + steps.map(s => `- ${s}`).join('\n\n') +
            `\n\n🎯 **Faça isso e ajude o turismo da cidade (e ganhe pontos)!**`;
    }
}
