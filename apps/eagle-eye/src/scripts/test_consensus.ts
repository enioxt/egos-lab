import { TruthConsensus } from '../modules/tourism/truth-consensus';

function runSimulation() {
    console.log('⚖️ Eagle Eye: Truth Consensus Simulation\n');

    const consensus = new TruthConsensus();

    // 1. Initial User Report
    console.log('--- Step 1: User "João" reports: "Music at Lagoa Grande" ---');
    consensus.addSignal('USER_INPUT', 'Saw live jazz band', 'user_joao');
    console.log(consensus.explain());

    // 2. Web Corroboration
    console.log('\n--- Step 2: WebScraper finds Instagram post about the event ---');
    consensus.addSignal('WEB_CROSS_CHECK', 'Found matching IG story');
    console.log(consensus.explain());

    // 3. Another User Confirms
    console.log('\n--- Step 3: User "Maria" confirms via app ---');
    consensus.addSignal('OTHER_USER', 'I am here too!', 'user_maria');
    console.log(consensus.explain());

    // 4. Business Owner Claims
    console.log('\n--- Step 4: "Kiosque Lagoa" owner updates status ---');
    consensus.addSignal('BUSINESS_OWNER', 'Setting status to Open', 'owner_01');
    console.log(consensus.explain());

    const finalScore = consensus.calculateConfidence();
    if (finalScore > 70) {
        console.log('\n✅ PASSED: Reached VERIFIED_TRUTH status.');
    } else {
        console.log('\n❌ FAILED: Did not reach verified status.');
    }
}

runSimulation();
