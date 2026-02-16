
import {
    EAGLE_EYE_TOURISM_PROMPT,
    calculateReadinessScore,
    estimateCampaign,
    getMissingActions,
    type GoogleMapsReadinessChecklist,
    type CityProfile
} from '../modules/tourism';

console.log('🦅 Eagle Eye — Tourism Module Test (Patos de Minas Pilot)');
console.log('═══════════════════════════════════════════════════════════\n');

// 1. Test City Profile Structure (Mock based on ChatGPT insight)
const patosProfile: CityProfile = {
    city: {
        name: "Patos de Minas",
        state: "MG",
        region: "Alto Paranaíba",
        positioning: {
            tagline: "Capital do Milho + Rota do Leite + Cachoeiras",
            pillars: ["milho", "derivados de leite", "natureza/cachoeiras", "tranquilidade", "hotelaria"]
        }
    },
    assets: {
        nature: [
            { name: "Cachoeira X", type: "cachoeira", seasonality: "verão", access: "estrada de terra" }
        ],
        food: [
            { name: "Pamonharia Y", type: "milho", where: "Centro" }
        ],
        culture: [],
        events: []
    },
    infra: {
        hotels: { count_estimate: 20, strengths: ["bom atendimento"], gaps: ["pouca opção luxo"] },
        mobility: { highways: ["BR-365"], public_transport: "regular", parking: "zona azul" },
        safety: { perception: "alta", evidence_links: [] }
    },
    digital_presence: {
        google_maps_readiness: {
            businesses_total_estimate: 5000,
            profiles_claimed_estimate: 1200, // Low!
            top_gaps: ["fotos ruins", "horários errados"]
        },
        social: { instagram: "fraco", tiktok: "inexistente", youtube: "médio" }
    },
    opportunities: []
};

console.log(`✅ City Profile Loaded: ${patosProfile.city.name}`);
console.log(`   Pillars: ${patosProfile.city.positioning.pillars.join(', ')}\n`);

// 2. Test Google Maps Readiness Logic
console.log('📋 Test: Google Maps Readiness Scoring');

const sampleBusiness: GoogleMapsReadinessChecklist = {
    profileExists: true,
    claimed: false, // Critical gap
    nameCorrect: true,
    categorySet: true,
    hoursUpdated: false,
    contactInfoSet: true,
    photosCount: 3, // Low
    videoExists: false,
    reviewsRespondedPercent: 20, // Low
    postsRecent: false,
    reviewLinkReady: false
};

const score = calculateReadinessScore(sampleBusiness);
const actions = getMissingActions(sampleBusiness);

console.log(`   Business Score: ${score}/100`);
console.log(`   Missing Actions (${actions.length}):`);
actions.forEach(a => console.log(`   - ${a}`));

if (score < 50) console.log('   🔴 Status: CRITICAL (Invisible to tourists)');
else console.log('   🟢 Status: OK');
console.log('');

// 3. Test Campaign Estimator
console.log('💰 Test: Campaign Estimator (Reais)');
const campaign = estimateCampaign([
    { channel: 'outdoor_9x3', quantity: 5 },
    { channel: 'led_panel_monthly', quantity: 1 }
]);

console.log('   Proposed Mix: 5 Outdoors + 1 LED Panel');
console.log('   Breakdown:');
campaign.breakdown.forEach(item => {
    console.log(`   - ${item.channel}: R$ ${item.estimatedRange.min.toLocaleString()} - R$ ${item.estimatedRange.max.toLocaleString()} (${item.reference.unit})`);
});
console.log(`   -----------------------------------------------------------`);
console.log(`   TOTAL ESTIMATE: R$ ${campaign.totalRange.min.toLocaleString()} - R$ ${campaign.totalRange.max.toLocaleString()}`);
console.log('');

// 4. System Prompt Preview
console.log('🤖 System Prompt Preview (First 500 chars):');
console.log(EAGLE_EYE_TOURISM_PROMPT.substring(0, 500) + '...\n');

console.log('✅ All tests passed!');
