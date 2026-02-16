import { CrowdsourcedAsset } from './types';
import { TruthConsensus } from './truth-consensus';

export interface InterviewSession {
    sessionId: string;
    city: string;
    userName?: string;
    transcript: string[];
    collectedAssets: CrowdsourcedAsset[];
}

export class CitizenReporter {
    private currentSession: InterviewSession | null = null;
    private consensusEngine: TruthConsensus;

    constructor(private systemName: string = "EagleEye Reporter") {
        this.consensusEngine = new TruthConsensus();
    }

    startSession(city: string, userName: string = 'Local'): string {
        this.currentSession = {
            sessionId: crypto.randomUUID(),
            city,
            userName,
            transcript: [],
            collectedAssets: []
        };
        return `Olá ${userName}! Sou o ${this.systemName}. Estou mapeando os segredos de ${city}. \n\nPergunta rápida: Quando vem visita de fora, pra onde você leva eles PRIMEIRO? (Vale tudo: comida, vista, barzinho)`;
    }

    processReply(reply: string): { response: string, assetDetected?: Partial<CrowdsourcedAsset> } {
        if (!this.currentSession) return { response: "Sessão não iniciada." };

        this.currentSession.transcript.push(`User: ${reply}`);

        // Simple heuristic for detection (Mock of NLP)
        // In real app, this would call an LLM to extract the entity
        let detected = false;
        let response = "";
        let asset: CrowdsourcedAsset | undefined;

        if (reply.length > 5) {
            detected = true;

            // 1. Create Consensus for this new asset
            // In a real app, we would check if asset exists first.
            const newConsensus = new TruthConsensus();
            newConsensus.addSignal('USER_INPUT', reply, this.currentSession.userName);

            // Mock extraction logic
            asset = {
                id: crypto.randomUUID(),
                name: reply.substring(0, 20) + (reply.length > 20 ? "..." : ""),
                type: "unknown",
                story: reply,
                submitted_by: this.currentSession.userName || 'anonymous',
                verification_count: 1, // Base count
                social_signals: [],
                is_verified: false, // Default
                timestamp: new Date().toISOString(),
                // @ts-ignore - extending type for V2
                confidenceScore: newConsensus.calculateConfidence(),
                // @ts-ignore
                verificationStatus: newConsensus.getStatus()
            };
            this.currentSession.collectedAssets.push(asset as CrowdsourcedAsset);
        }

        if (detected && asset) {
            // @ts-ignore
            const score = asset.confidenceScore;
            // @ts-ignore
            const statusLabel = asset.verificationStatus === 'UNVERIFIED_RUMOR' ? 'Rumor (Precisa de confirmação)' : 'Sinal Forte';

            response = `Boa! "${asset.name}" registrado. \n\n📊 Status: ${statusLabel} (${score}% Confiança).\n\nQuer mandar uma foto agora pra eu tentar validar com IA e aumentar a nota pra 30%?`;
        } else {
            response = "Pode falar mais detalhes? O que tem de especial lá?";
        }

        this.currentSession.transcript.push(`Bot: ${response}`);
        return { response, assetDetected: asset };
    }

    getReport(): string {
        if (!this.currentSession) return "No active session.";
        return `
Relatório de Cidadão (${this.currentSession.city}):
Usuário: ${this.currentSession.userName}
Assets Identificados: ${this.currentSession.collectedAssets.length}
${this.currentSession.collectedAssets.map(a =>
            // @ts-ignore
            `- ${a.name} [${a.verificationStatus} - ${a.confidenceScore}%]`
        ).join('\n')}
        `.trim();
    }
}
