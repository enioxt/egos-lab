
import { GamificationSystem, UserProfile } from '../modules/tourism/gamification';
import { MapsInstructor } from '../modules/tourism/maps-instructor';

console.log('🦅 Eagle Eye — Gamification & Instructor Test');
console.log('═══════════════════════════════════════════════════════════\n');

async function run() {
    // 1. Test Gamification
    console.log('🎮 Testing Gamification System...');
    const game = new GamificationSystem();
    const user: UserProfile = {
        userId: 'local_hero_99',
        metrics: { points: 0, assets_submitted: 0, photos_submitted: 0, reviews_submitted: 0, corroborations: 0 },
        rank: 'Turista',
        badges: []
    };

    console.log(`   👤 Initial Rank: ${user.rank} (${user.metrics.points} pts)`);

    // Action 1: Add Photo
    game.awardPoints(user, 'PHOTO_UPLOAD');
    console.log(`   📸 Uploaded Photo (+50) -> ${user.metrics.points} pts`);

    // Action 2: Verify New Asset
    game.awardPoints(user, 'NEW_ASSET_VERIFIED');
    console.log(`   🗺️ Verified Asset (+100) -> ${user.metrics.points} pts`);

    // Action 3: Detailed Review
    game.awardPoints(user, 'DETAILED_REVIEW');
    console.log(`   ⭐ Detailed Review (+20) -> ${user.metrics.points} pts`);

    console.log(`   🏆 Final Rank: ${user.rank}`);
    console.log('');

    // 2. Test Maps Instructor
    console.log('🗺️ Testing Maps Instructor...');
    const instructor = new MapsInstructor();
    const badProfile = {
        profileExists: true,
        claimed: false,
        nameCorrect: true,
        categorySet: true,
        hoursUpdated: false,
        contactInfoSet: true,
        photosCount: 2,
        videoExists: false,
        reviewsRespondedPercent: 0,
        postsRecent: false,
        reviewLinkReady: false
    };

    console.log(`   🏢 Generating Guide for "Padaria do Zé"...`);
    const guide = instructor.generateGuide("Padaria do Zé", badProfile);
    console.log(`\n${guide}`);
}

run();
