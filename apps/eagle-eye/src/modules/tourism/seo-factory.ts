
export interface SEOKeyword {
    term: string;
    type: 'service_area' | 'near_me' | 'emergency' | 'comparison';
    volume_estimate: string; // 'High', 'Medium', 'Low'
}

export interface GMBProfileDraft {
    businessName: string;
    description: string;
    services: string[];
    faqs: { question: string; answer: string }[];
    weeklyPosts: { title: string; content: string; type: 'offer' | 'update' | 'event' }[];
}

export interface ContentPlan {
    blogPostTitle: string;
    socialMediaPost: string; // Instagram/Facebook
    videoScript: string; // TikTok/Reels
    googlePost: string;
}

export class SEOFactory {

    generateKeywords(city: string, service: string): SEOKeyword[] {
        const keywords: SEOKeyword[] = [];

        // 1. Service + Area
        keywords.push({ term: `${service} em ${city}`, type: 'service_area', volume_estimate: 'High' });
        keywords.push({ term: `${service} ${city} centro`, type: 'service_area', volume_estimate: 'Medium' });

        // 2. Near Me (Intent)
        keywords.push({ term: `${service} perto de mim`, type: 'near_me', volume_estimate: 'High' });
        keywords.push({ term: `${service} próximo a mim`, type: 'near_me', volume_estimate: 'High' });

        // 3. Emergency
        keywords.push({ term: `${service} 24 horas ${city}`, type: 'emergency', volume_estimate: 'Low' });
        keywords.push({ term: `${service} emergência ${city}`, type: 'emergency', volume_estimate: 'Low' });

        // 4. Comparison
        keywords.push({ term: `melhor ${service} de ${city}`, type: 'comparison', volume_estimate: 'Medium' });
        keywords.push({ term: `${service} barato em ${city}`, type: 'comparison', volume_estimate: 'High' });

        return keywords;
    }

    draftGMBProfile(businessName: string, service: string, city: string): GMBProfileDraft {
        return {
            businessName: businessName,
            description: `Somos a ${businessName}, referência em ${service} em ${city}. Atendemos com agilidade e qualidade. Especialistas em resolver problemas de ${service} 24 horas por dia. Solicite um orçamento agora!`,
            services: [
                `${service} Residencial`,
                `${service} Comercial`,
                `Manutenção de ${service}`,
                `Orçamento de ${service}`
            ],
            faqs: [
                { question: `Vocês atendem em toda ${city}?`, answer: "Sim, cobrimos todos os bairros de Patos de Minas." },
                { question: "Fazem orçamento sem compromisso?", answer: "Sim, entre em contato pelo WhatsApp para um orçamento rápido." }
            ],
            weeklyPosts: [
                { title: "Promoção da Semana", content: `Desconto de 10% em ${service} para novos clientes!`, type: 'offer' },
                { title: "Antes e Depois", content: "Confira o resultado desse serviço realizado no Centro.", type: 'update' }
            ]
        };
    }

    createContentPlan(jobDescription: string, city: string): ContentPlan {
        return {
            blogPostTitle: `Como resolver ${jobDescription} em ${city}: Guia Completo 2026`,
            socialMediaPost: `🔧 Mais um trabalho concluído em ${city}! ${jobDescription} resolvido com sucesso. Precisa de ajuda? Chame a gente! #PatosDeMinas #${jobDescription.replace(' ', '')}`,
            videoScript: `(Câmera selfie) "Fala galera de ${city}! Olha essa situação de ${jobDescription} que pegamos hoje..." (Mostra o problema) "Resolvemos assim..." (Mostra solução) "Precisa de ajuda? Link na bio!"`,
            googlePost: `Realizamos ${jobDescription} com excelência. Veja as fotos e agende seu horário.`
        };
    }
}
