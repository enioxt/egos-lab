import { GoogleMapsReadinessChecklist } from './types';

export const SCORE_WEIGHTS = {
    profileExists: 10,
    claimed: 20, // Critical
    nameCorrect: 5,
    categorySet: 5,
    hoursUpdated: 10,
    contactInfoSet: 5,
    photosCount: 15, // Up to 15 points
    videoExists: 5,
    reviewsRespondedPercent: 15,
    postsRecent: 5,
    reviewLinkReady: 5
};

export function calculateReadinessScore(checklist: GoogleMapsReadinessChecklist): number {
    let score = 0;

    if (checklist.profileExists) score += SCORE_WEIGHTS.profileExists;
    if (checklist.claimed) score += SCORE_WEIGHTS.claimed;
    if (checklist.nameCorrect) score += SCORE_WEIGHTS.nameCorrect;
    if (checklist.categorySet) score += SCORE_WEIGHTS.categorySet;
    if (checklist.hoursUpdated) score += SCORE_WEIGHTS.hoursUpdated;
    if (checklist.contactInfoSet) score += SCORE_WEIGHTS.contactInfoSet;

    // Partial score for photos (cap at 15)
    const photoScore = Math.min(checklist.photosCount, 15);
    score += photoScore;

    if (checklist.videoExists) score += SCORE_WEIGHTS.videoExists;

    // Partial score for review responses
    const reviewScore = (checklist.reviewsRespondedPercent / 100) * SCORE_WEIGHTS.reviewsRespondedPercent;
    score += reviewScore;

    if (checklist.postsRecent) score += SCORE_WEIGHTS.postsRecent;
    if (checklist.reviewLinkReady) score += SCORE_WEIGHTS.reviewLinkReady;

    return Math.round(score);
}

export function getMissingActions(checklist: GoogleMapsReadinessChecklist): string[] {
    const actions: string[] = [];

    if (!checklist.profileExists) actions.push('Criar Perfil da Empresa no Google');
    else if (!checklist.claimed) actions.push('Reivindicar proprietário do perfil (Crítico)');

    if (!checklist.nameCorrect) actions.push('Corrigir nome (remover spam de cidade)');
    if (!checklist.categorySet) actions.push('Definir categoria principal e secundárias');
    if (!checklist.hoursUpdated) actions.push('Atualizar horário de funcionamento (incluir feriados)');
    if (checklist.photosCount < 10) actions.push(`Adicionar mais fotos (Atual: ${checklist.photosCount}, Meta: 10+)`);
    if (!checklist.videoExists) actions.push('Adicionar vídeo curto (30s)');
    if (checklist.reviewsRespondedPercent < 100) actions.push('Responder todas as avaliações pendentes');
    if (!checklist.postsRecent) actions.push('Fazer uma postagem de atualização/oferta');
    if (!checklist.reviewLinkReady) actions.push('Gerar link curto para pedir avaliações');

    return actions;
}
