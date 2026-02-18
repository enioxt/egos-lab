/**
 * SecurityHub — Community security tools, shared rules, and AI-powered insights.
 * 
 * All data is dynamic — pulled from Supabase via APIs, never hardcoded.
 * - Security tools recommendations from hub_security_tools
 * - Community-shared rules from hub_shared_rules
 * - Version history with AI insights from hub_rule_versions + hub_rule_insights
 */
import { useState, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────
interface SecurityTool {
    id: string;
    name: string;
    description: string;
    category: string;
    install_command: string | null;
    website_url: string | null;
    github_url: string | null;
    icon_emoji: string;
    platform: string[];
    difficulty: string;
    is_recommended: boolean;
}

interface SharedRule {
    id: string;
    title: string;
    description: string;
    category: string;
    content: string;
    language: string;
    tags: string[];
    star_count: number;
    fork_count: number;
    usage_count: number;
    is_official: boolean;
    source_repo: string | null;
    created_at: string;
    updated_at: string;
}

interface RuleVersion {
    id: string;
    version_number: number;
    content: string;
    change_summary: string;
    created_at: string;
}

interface RuleInsight {
    id: string;
    from_version: number;
    to_version: number;
    insight_type: string;
    title: string;
    description: string;
    impact_score: number;
    created_at: string;
}

// ─── Category configs ────────────────────────────────────────────
const TOOL_CATEGORIES: Record<string, { label: string; icon: string }> = {
    scanner: { label: 'Scanners', icon: '🔍' },
    linter: { label: 'Linters', icon: '📏' },
    hook: { label: 'Git Hooks', icon: '🪝' },
    dependency: { label: 'Dependencies', icon: '📦' },
    monitor: { label: 'Monitors', icon: '📊' },
    auth: { label: 'Auth', icon: '🔑' },
};

const RULE_CATEGORIES: Record<string, { label: string; color: string }> = {
    'pre-commit': { label: 'Pre-commit', color: '#f59e0b' },
    'windsurfrules': { label: '.windsurfrules', color: '#8b5cf6' },
    'eslint': { label: 'ESLint', color: '#4338ca' },
    'husky': { label: 'Husky', color: '#d97706' },
    'guarani': { label: '.guarani', color: '#059669' },
    'security': { label: 'Security', color: '#dc2626' },
    'github-actions': { label: 'GitHub Actions', color: '#2563eb' },
    'other': { label: 'Other', color: '#6b7280' },
};

const INSIGHT_COLORS: Record<string, string> = {
    improvement: '#22c55e',
    regression: '#ef4444',
    neutral: '#6b7280',
    security: '#f59e0b',
    performance: '#3b82f6',
};

// ─── Component ───────────────────────────────────────────────────
type TabId = 'tools' | 'rules' | 'contribute';

export default function SecurityHub() {
    const [activeTab, setActiveTab] = useState<TabId>('tools');
    const [tools, setTools] = useState<SecurityTool[]>([]);
    const [rules, setRules] = useState<SharedRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRule, setSelectedRule] = useState<SharedRule | null>(null);
    const [ruleVersions, setRuleVersions] = useState<RuleVersion[]>([]);
    const [ruleInsights, setRuleInsights] = useState<RuleInsight[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [toolFilter, setToolFilter] = useState<string>('all');
    const [ruleFilter, setRuleFilter] = useState<string>('all');

    // Fetch tools
    useEffect(() => {
        fetch('/api/security-tools')
            .then(r => r.json())
            .then(d => setTools(d.tools || []))
            .catch(() => setTools([]));
    }, []);

    // Fetch rules
    useEffect(() => {
        fetch('/api/shared-rules?sort=stars')
            .then(r => r.json())
            .then(d => { setRules(d.rules || []); setLoading(false); })
            .catch(() => { setRules([]); setLoading(false); });
    }, []);

    // Fetch rule history
    const loadHistory = useCallback(async (rule: SharedRule) => {
        setSelectedRule(rule);
        setHistoryLoading(true);
        try {
            const res = await fetch(`/api/rule-history?id=${rule.id}`);
            const data = await res.json();
            setRuleVersions(data.versions || []);
            setRuleInsights(data.insights || []);
        } catch {
            setRuleVersions([]);
            setRuleInsights([]);
        }
        setHistoryLoading(false);
    }, []);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filteredTools = toolFilter === 'all'
        ? tools
        : tools.filter(t => t.category === toolFilter);

    const filteredRules = ruleFilter === 'all'
        ? rules
        : rules.filter(r => r.category === ruleFilter);

    // ─── Render ──────────────────────────────────────────────────
    return (
        <div className="security-hub">
            {/* Tab bar */}
            <div className="sh-tabs">
                {([
                    { id: 'tools' as TabId, label: 'Security Tools', icon: '🛡️', count: tools.length },
                    { id: 'rules' as TabId, label: 'Shared Rules', icon: '📋', count: rules.length },
                    { id: 'contribute' as TabId, label: 'Contribute', icon: '🤝', count: 0 },
                ]).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setSelectedRule(null); }}
                        className={`sh-tab ${activeTab === tab.id ? 'active' : ''}`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                        {tab.count > 0 && <span className="sh-tab-count">{tab.count}</span>}
                    </button>
                ))}
            </div>

            {/* ─── Tools Tab ─── */}
            {activeTab === 'tools' && (
                <div className="sh-panel">
                    <p className="sh-desc">
                        Recommended tools to secure your public repositories. Install these on your machine to prevent
                        leaked secrets, vulnerable dependencies, and broken deploys.
                    </p>

                    {/* Filter chips */}
                    <div className="sh-filters">
                        <button
                            onClick={() => setToolFilter('all')}
                            className={`sh-chip ${toolFilter === 'all' ? 'active' : ''}`}
                        >All</button>
                        {Object.entries(TOOL_CATEGORIES).map(([key, val]) => (
                            <button
                                key={key}
                                onClick={() => setToolFilter(key)}
                                className={`sh-chip ${toolFilter === key ? 'active' : ''}`}
                            >{val.icon} {val.label}</button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="sh-loading">Loading tools...</div>
                    ) : (
                        <div className="sh-tools-grid">
                            {filteredTools.map(tool => (
                                <div key={tool.id} className={`sh-tool-card ${tool.is_recommended ? 'recommended' : ''}`}>
                                    <div className="sh-tool-header">
                                        <span className="sh-tool-emoji">{tool.icon_emoji}</span>
                                        <div>
                                            <h4 className="sh-tool-name">{tool.name}</h4>
                                            <span className={`sh-difficulty ${tool.difficulty}`}>{tool.difficulty}</span>
                                        </div>
                                        {tool.is_recommended && <span className="sh-badge-rec">Recommended</span>}
                                    </div>
                                    <p className="sh-tool-desc">{tool.description}</p>
                                    {tool.install_command && (
                                        <div className="sh-install">
                                            <code>{tool.install_command}</code>
                                            <button
                                                onClick={() => copyToClipboard(tool.install_command!, tool.id)}
                                                className="sh-copy-btn"
                                            >{copiedId === tool.id ? '✓' : '📋'}</button>
                                        </div>
                                    )}
                                    <div className="sh-tool-links">
                                        {tool.website_url && (
                                            <a href={tool.website_url} target="_blank" rel="noopener noreferrer">Docs ↗</a>
                                        )}
                                        {tool.github_url && (
                                            <a href={tool.github_url} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ─── Rules Tab ─── */}
            {activeTab === 'rules' && !selectedRule && (
                <div className="sh-panel">
                    <p className="sh-desc">
                        Community-shared governance rules, pre-commit hooks, and security configs.
                        Each rule has version history with AI-powered improvement analysis.
                    </p>

                    <div className="sh-filters">
                        <button
                            onClick={() => setRuleFilter('all')}
                            className={`sh-chip ${ruleFilter === 'all' ? 'active' : ''}`}
                        >All</button>
                        {Object.entries(RULE_CATEGORIES).map(([key, val]) => (
                            <button
                                key={key}
                                onClick={() => setRuleFilter(key)}
                                className={`sh-chip ${ruleFilter === key ? 'active' : ''}`}
                                style={{ borderColor: val.color }}
                            >{val.label}</button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="sh-loading">Loading rules...</div>
                    ) : filteredRules.length === 0 ? (
                        <div className="sh-empty">No rules found. Be the first to contribute!</div>
                    ) : (
                        <div className="sh-rules-list">
                            {filteredRules.map(rule => (
                                <div key={rule.id} className="sh-rule-card" onClick={() => loadHistory(rule)}>
                                    <div className="sh-rule-header">
                                        <div>
                                            <h4 className="sh-rule-title">
                                                {rule.is_official && <span className="sh-badge-official">EGOS</span>}
                                                {rule.title}
                                            </h4>
                                            <span
                                                className="sh-rule-cat"
                                                style={{ backgroundColor: RULE_CATEGORIES[rule.category]?.color || '#6b7280' }}
                                            >
                                                {RULE_CATEGORIES[rule.category]?.label || rule.category}
                                            </span>
                                        </div>
                                        <div className="sh-rule-stats">
                                            <span>⭐ {rule.star_count}</span>
                                            <span>📋 {rule.usage_count}</span>
                                        </div>
                                    </div>
                                    {rule.description && <p className="sh-rule-desc">{rule.description}</p>}
                                    <div className="sh-rule-tags">
                                        {rule.tags.slice(0, 5).map(tag => (
                                            <span key={tag} className="sh-tag">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ─── Rule Detail + History ─── */}
            {activeTab === 'rules' && selectedRule && (
                <div className="sh-panel">
                    <button onClick={() => setSelectedRule(null)} className="sh-back-btn">
                        ← Back to rules
                    </button>

                    <div className="sh-rule-detail">
                        <h3>
                            {selectedRule.is_official && <span className="sh-badge-official">EGOS</span>}
                            {selectedRule.title}
                        </h3>
                        <p className="sh-rule-desc">{selectedRule.description}</p>

                        {/* Content */}
                        <div className="sh-code-block">
                            <div className="sh-code-header">
                                <span>{selectedRule.language}</span>
                                <button
                                    onClick={() => copyToClipboard(selectedRule.content, selectedRule.id)}
                                    className="sh-copy-btn"
                                >{copiedId === selectedRule.id ? '✓ Copied' : 'Copy'}</button>
                            </div>
                            <pre><code>{selectedRule.content}</code></pre>
                        </div>

                        {selectedRule.source_repo && (
                            <a href={selectedRule.source_repo} target="_blank" rel="noopener noreferrer" className="sh-source-link">
                                View source repo ↗
                            </a>
                        )}

                        {/* Version History + AI Insights */}
                        <div className="sh-history-section">
                            <h4>📊 Version History & AI Insights</h4>

                            {historyLoading ? (
                                <div className="sh-loading">Analyzing versions...</div>
                            ) : ruleVersions.length === 0 ? (
                                <p className="sh-empty">No version history yet.</p>
                            ) : (
                                <div className="sh-timeline">
                                    {ruleVersions.map(version => {
                                        const insight = ruleInsights.find(i => i.to_version === version.version_number);
                                        return (
                                            <div key={version.id} className="sh-timeline-item">
                                                <div className="sh-timeline-dot" />
                                                <div className="sh-timeline-content">
                                                    <div className="sh-version-header">
                                                        <span className="sh-version-num">v{version.version_number}</span>
                                                        <span className="sh-version-date">
                                                            {new Date(version.created_at).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </div>
                                                    {version.change_summary && (
                                                        <p className="sh-version-summary">{version.change_summary}</p>
                                                    )}

                                                    {/* AI Insight */}
                                                    {insight && (
                                                        <div
                                                            className="sh-insight"
                                                            style={{ borderLeftColor: INSIGHT_COLORS[insight.insight_type] || '#6b7280' }}
                                                        >
                                                            <div className="sh-insight-header">
                                                                <span className="sh-insight-type" style={{
                                                                    color: INSIGHT_COLORS[insight.insight_type]
                                                                }}>
                                                                    {insight.insight_type === 'improvement' ? '✅' :
                                                                     insight.insight_type === 'regression' ? '⚠️' :
                                                                     insight.insight_type === 'security' ? '🔐' :
                                                                     insight.insight_type === 'performance' ? '⚡' : 'ℹ️'}
                                                                    {' '}{insight.insight_type.toUpperCase()}
                                                                </span>
                                                                {insight.impact_score !== 0 && (
                                                                    <span className={`sh-impact ${insight.impact_score > 0 ? 'positive' : 'negative'}`}>
                                                                        {insight.impact_score > 0 ? '+' : ''}{insight.impact_score}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="sh-insight-title">{insight.title}</p>
                                                            <p className="sh-insight-desc">{insight.description}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Contribute Tab ─── */}
            {activeTab === 'contribute' && (
                <div className="sh-panel">
                    <h3 className="sh-contribute-title">Help improve security for everyone</h3>
                    <p className="sh-desc">
                        Share your pre-commit hooks, linter configs, and governance rules with the community.
                        Every contribution gets AI-powered improvement tracking.
                    </p>

                    <div className="sh-contribute-grid">
                        <div className="sh-contribute-card">
                            <span className="sh-contribute-icon">📋</span>
                            <h4>Share a Rule</h4>
                            <p>Submit your pre-commit hooks, .windsurfrules, ESLint configs, or security scanners.</p>
                            <p className="sh-contribute-how">Use the EGOS API or submit via GitHub.</p>
                        </div>
                        <div className="sh-contribute-card">
                            <span className="sh-contribute-icon">🔄</span>
                            <h4>Improve Existing</h4>
                            <p>Update rules to make them better. AI analyzes every version change and shows what improved.</p>
                            <p className="sh-contribute-how">Fork a rule, edit it, submit new version.</p>
                        </div>
                        <div className="sh-contribute-card">
                            <span className="sh-contribute-icon">⭐</span>
                            <h4>Star & Adopt</h4>
                            <p>Find rules that work for your project. Star them to help others discover quality configs.</p>
                            <p className="sh-contribute-how">Copy install commands directly from the tools tab.</p>
                        </div>
                        <div className="sh-contribute-card">
                            <span className="sh-contribute-icon">🤖</span>
                            <h4>AI-Powered Insights</h4>
                            <p>Every rule edit is analyzed by AI to explain what changed, why it matters, and its impact.</p>
                            <p className="sh-contribute-how">Improvement history visible on every rule.</p>
                        </div>
                    </div>

                    <div className="sh-contribute-cta">
                        <p>Want to contribute? Start by forking the EGOS Lab repository:</p>
                        <div className="sh-install">
                            <code>git clone https://github.com/enioxt/egos-lab.git && cd egos-lab</code>
                            <button
                                onClick={() => copyToClipboard('git clone https://github.com/enioxt/egos-lab.git && cd egos-lab', 'clone')}
                                className="sh-copy-btn"
                            >{copiedId === 'clone' ? '✓' : '📋'}</button>
                        </div>
                        <a
                            href="https://github.com/enioxt/egos-lab"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sh-github-btn"
                        >
                            View on GitHub ↗
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
