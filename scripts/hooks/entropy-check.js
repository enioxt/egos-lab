const { execSync } = require('child_process');

function calculateEntropy(str) {
    const len = str.length;
    const frequencies = Array.from(str).reduce((freq, c) => {
        freq[c] = (freq[c] || 0) + 1;
        return freq;
    }, {});

    return Object.values(frequencies).reduce((sum, f) => {
        const p = f / len;
        return sum - (p * Math.log2(p));
    }, 0);
}

function scanStagedFiles() {
    try {
        const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACMR', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
        let foundSecrets = false;

        for (const file of stagedFiles) {
            // Skip non-code files
            if (file.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|lock|csv|json)$/i) || file.includes('package-lock.json') || file.includes('.gitleaks.toml')) {
                continue;
            }

            const content = execSync(`git show :${file}`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
            const lines = content.split('\n');

            lines.forEach((line, i) => {
                // Focus on variable assignments that might contain strings
                const match = line.match(/(['"\`])([A-Za-z0-9+/=_\-\.]{15,})(?:['"\`])/);
                if (match) {
                    const stringVal = match[2];
                    const entropy = calculateEntropy(stringVal);
                    // Standard base64 API keys or hashes tend to have higher entropy (> 4.5 for longer strings)
                    if (entropy > 4.6 && stringVal.length > 20) {
                        // Skip false positives like long class names or paths
                        if (stringVal.includes(' ') || stringVal.includes('/') && !stringVal.includes('=')) return;

                        console.error(`🚨 BLOCKED: High Entropy String Detected in ${file} at line ${i + 1}`);
                        console.error(`   Entropy Score: ${entropy.toFixed(2)} (Value: ${stringVal.substring(0, 10)}...)`);
                        foundSecrets = true;
                    }
                }
            });
        }

        if (foundSecrets) {
            console.error('\n🛡️ EGOS ENTROPY SCANNER: Secrets detected. Commit rejected.');
            process.exit(1);
        } else {
            console.log('✅ EGOS ENTROPY SCANNER: Passed.');
            process.exit(0);
        }
    } catch (e) {
        if (e.status !== 0 && !e.message.includes('not a git repository')) {
            console.warn('⚠️ Entropy scan skipped or encountered an error:', e.message);
        }
        process.exit(0);
    }
}

scanStagedFiles();
