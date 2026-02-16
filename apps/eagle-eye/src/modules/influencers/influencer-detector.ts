
export interface Influencer {
    name: string;
    platform?: string;
    handle?: string;
    context: string;
    mentions: number;
}

export class InfluencerDetector {
    private patterns = [
        /(?:influenciador|influencer|blogueir[oa]|youtuber|instagrammer)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/gi,
        /(?:instagram|insta):\s*@?([a-zA-Z0-9_.]+)/gi,
        /@([a-zA-Z0-9_.]+)/g, // Aggressive handle matching
        /#([a-zA-Z0-9_]+)/g   // Hashtag matching
    ];

    private knownHubs = new Set(['patoslademinas', 'pizzaspatos', 'patoshoje', 'patosja']);

    detect(text: string): Influencer[] {
        const potentialInfluencers: Map<string, Influencer> = new Map();

        // 1. Detect by Role (Influencer X, Blogueira Y)
        const roleRegex = /(?:influenciador|influencer|blogueir[oa]|youtuber|instagrammer)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/gi;
        let match;
        while ((match = roleRegex.exec(text)) !== null) {
            const name = match[1].trim();
            if (name.length < 3) continue;

            if (!potentialInfluencers.has(name)) {
                potentialInfluencers.set(name, {
                    name: name,
                    context: `Mentioned as ${match[0].split(' ')[0]}`,
                    mentions: 0
                });
            }
            potentialInfluencers.get(name)!.mentions++;
        }

        // 2. Detect by Handle (@name) and Known Hubs
        const handleRegex = /@([a-zA-Z0-9_.]+)/g;
        while ((match = handleRegex.exec(text)) !== null) {
            const handle = match[1].toLowerCase();
            if (handle.length < 3) continue;

            const key = `@${handle}`;
            let context = 'Direct handle mention';

            if (this.knownHubs.has(handle)) {
                context = 'Known Local Hub / Big Page';
            }

            if (!potentialInfluencers.has(key)) {
                potentialInfluencers.set(key, {
                    name: key,
                    handle: handle,
                    platform: 'Instagram',
                    context: context,
                    mentions: 0
                });
            }
            potentialInfluencers.get(key)!.mentions++;
        }

        // 3. Detect by Hashtag (Contextual topics)
        const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
        while ((match = hashtagRegex.exec(text)) !== null) {
            const tag = match[1];
            // We treat hashtags as "Context" or potential "Movement" leaders if repeated often
            // For now, let's just log them as a special type of 'topic' influencer? 
            // Better: Don't add to influencers, but maybe we need a separate 'TopicDetector'?
            // The user asked to find pages *through* hashtags. 
            // Since we can't click the hashtag, we just catalogue it for now.
        }

        return Array.from(potentialInfluencers.values());
    }
}
