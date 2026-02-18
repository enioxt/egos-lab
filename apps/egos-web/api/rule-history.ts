/**
 * GET /api/rule-history?id=<rule_id>
 * Returns version history + AI insights for a specific rule.
 * 
 * POST /api/rule-history — Submit new version with AI-generated diff insights
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function generateAIInsight(oldContent: string, newContent: string, ruleTitle: string): Promise<{
    title: string;
    description: string;
    insight_type: string;
    impact_score: number;
}> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return {
            title: 'New version submitted',
            description: 'AI analysis unavailable — no API key configured.',
            insight_type: 'neutral',
            impact_score: 0,
        };
    }

    try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: [
                    {
                        role: 'system',
                        content: `You are a code governance analyst. Compare two versions of a rule/config file and provide a concise improvement analysis. Respond in valid JSON only with these fields:
- title: string (max 80 chars, summarize the change)
- description: string (max 300 chars, explain what improved and why it matters)
- insight_type: "improvement" | "regression" | "neutral" | "security" | "performance"
- impact_score: integer from -10 to 10 (positive = better, negative = worse)`
                    },
                    {
                        role: 'user',
                        content: `Rule: "${ruleTitle}"\n\n--- OLD VERSION ---\n${oldContent.slice(0, 2000)}\n\n--- NEW VERSION ---\n${newContent.slice(0, 2000)}\n\nAnalyze the diff and respond in JSON only.`
                    }
                ],
                max_tokens: 300,
                temperature: 0.3,
            }),
        });

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        // Parse JSON from response (handle markdown code blocks)
        const jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonStr);
        
        return {
            title: String(parsed.title || 'Version update').slice(0, 80),
            description: String(parsed.description || 'Changes detected.').slice(0, 500),
            insight_type: ['improvement', 'regression', 'neutral', 'security', 'performance'].includes(parsed.insight_type) 
                ? parsed.insight_type : 'neutral',
            impact_score: Math.max(-10, Math.min(10, parseInt(parsed.impact_score) || 0)),
        };
    } catch (err) {
        console.error('[rule-history] AI insight error:', err);
        return {
            title: 'Version updated',
            description: 'AI analysis failed — changes were saved.',
            insight_type: 'neutral',
            impact_score: 0,
        };
    }
}

export default async function handler(req: Request) {
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

    if (req.method === 'GET') {
        const url = new URL(req.url);
        const ruleId = url.searchParams.get('id');

        if (!ruleId) {
            return new Response(JSON.stringify({ error: 'Rule ID required' }), { status: 400, headers });
        }

        const [versionsRes, insightsRes] = await Promise.all([
            supabase
                .from('hub_rule_versions')
                .select('id, version_number, content, change_summary, created_at')
                .eq('rule_id', ruleId)
                .order('version_number', { ascending: false }),
            supabase
                .from('hub_rule_insights')
                .select('id, from_version, to_version, insight_type, title, description, impact_score, ai_model, created_at')
                .eq('rule_id', ruleId)
                .order('to_version', { ascending: false }),
        ]);

        return new Response(JSON.stringify({
            versions: versionsRes.data || [],
            insights: insightsRes.data || [],
        }), { headers });
    }

    if (req.method === 'POST') {
        try {
            const body = await req.json();
            const { rule_id, content, change_summary } = body;

            if (!rule_id || !content) {
                return new Response(JSON.stringify({ error: 'rule_id and content required' }), { status: 400, headers });
            }

            // Get current latest version
            const { data: versions } = await supabase
                .from('hub_rule_versions')
                .select('version_number, content')
                .eq('rule_id', rule_id)
                .order('version_number', { ascending: false })
                .limit(1);

            const prevVersion = versions?.[0];
            const newVersionNumber = (prevVersion?.version_number || 0) + 1;

            // Insert new version
            const { data: newVersion, error: versionError } = await supabase
                .from('hub_rule_versions')
                .insert({
                    rule_id,
                    version_number: newVersionNumber,
                    content,
                    change_summary: change_summary || `Version ${newVersionNumber}`,
                })
                .select('id, version_number')
                .single();

            if (versionError) throw versionError;

            // Update main rule content
            await supabase
                .from('hub_shared_rules')
                .update({ content, updated_at: new Date().toISOString() })
                .eq('id', rule_id);

            // Generate AI insight (comparing old vs new)
            let insight = null;
            if (prevVersion) {
                const { data: rule } = await supabase
                    .from('hub_shared_rules')
                    .select('title')
                    .eq('id', rule_id)
                    .single();

                const aiResult = await generateAIInsight(
                    prevVersion.content,
                    content,
                    rule?.title || 'Rule'
                );

                const { data: insightData } = await supabase
                    .from('hub_rule_insights')
                    .insert({
                        rule_id,
                        from_version: prevVersion.version_number,
                        to_version: newVersionNumber,
                        insight_type: aiResult.insight_type,
                        title: aiResult.title,
                        description: aiResult.description,
                        impact_score: aiResult.impact_score,
                        ai_model: 'gemini-2.0-flash',
                    })
                    .select('id, title, description, insight_type, impact_score')
                    .single();

                insight = insightData;
            }

            return new Response(JSON.stringify({
                version: newVersion,
                insight,
            }), { status: 201, headers });
        } catch (err) {
            console.error('[rule-history] POST Error:', err);
            return new Response(JSON.stringify({ error: 'Failed to create version' }), { status: 500, headers });
        }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
}
