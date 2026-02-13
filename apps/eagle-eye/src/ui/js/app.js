const state = {
    scans: [],
    matches: [],
    loading: false,
    filter: 'all', // all, software, partner
    sort: 'best'   // best, urgent, recent
};

// Kill-Zone Classification: Software (we do) vs Non-Software (partner)
const SOFTWARE_KEYWORDS = ['software', 'sistema', 'tecnologia', 'ti ', 'lgpd', 'dados', 'digital', 'portal', 'app', 'plataforma', 'cloud', 'saas', 'api', 'integração', 'automação', 'informatica', 'informática', 'computação'];
function classifyKillZone(patternName) {
    const name = (patternName || '').toLowerCase();
    const isSoftware = SOFTWARE_KEYWORDS.some(kw => name.includes(kw));
    if (isSoftware) {
        return '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">NÓS FAZEMOS</span>';
    }
    return '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">PARCEIRO</span>';
}

// Router
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🦅 Eagle Eye Dashboard Initializing...');

    // Common Init
    lucide.createIcons();
    await loadData();

    const path = window.location.pathname;
    if (path.includes('detail.html')) {
        initDetail();
    } else if (path.includes('map.html')) {
        initMap();
    } else if (path.includes('analytics.html')) {
        initAnalytics();
    } else {
        initDashboard();
    }
});

// --- Data Loading ---

async function loadData() {
    try {
        state.loading = true;

        // 1. Fetch available scans
        const scansRes = await fetch('/api/scans');
        const scanFiles = await scansRes.json();

        if (!scanFiles || scanFiles.length === 0) {
            console.warn('No scans found.');
            return;
        }

        // 2. Load ALL scans (for history/trends) or just latest for MVP
        // For now, let's load the latest 5 to get a good dataset without killing performance
        const filesToLoad = scanFiles.slice(0, 5);

        const loadedScans = await Promise.all(filesToLoad.map(async (file) => {
            const res = await fetch(`/api/scan/${file}`);
            return res.json();
        }));

        state.scans = loadedScans;

        // 3. Flatten and ID matches
        state.matches = loadedScans.flatMap((scan, scanIdx) => {
            const results = scan.results || [];
            return results.flatMap((r, rIdx) => {
                return (r.matches || []).map((m, mIdx) => ({
                    ...m,
                    id: `${scanIdx}-${rIdx}-${mIdx}`, // Generate unique ID
                    source_gazette: r.gazette,
                    scan_date: scan.timestamp || new Date().toISOString()
                }));
            });
        });

        console.log(`✅ Loaded ${state.matches.length} opportunities from ${loadedScans.length} scans.`);

    } catch (error) {
        console.error('❌ Failed to load data:', error);
        // Show toaster or global error
    } finally {
        state.loading = false;
    }
}

// --- View Initializers ---


// --- Filter & Sort Logic ---

function setFilter(type) {
    state.filter = type;

    // Update UI
    document.querySelectorAll('#filter-all, #filter-software, #filter-partner').forEach(el => {
        el.classList.remove('bg-emerald-600', 'text-white');
        el.classList.add('text-slate-400', 'hover:text-white', 'hover:bg-slate-700');
    });

    const activeBtn = document.getElementById(`filter-${type}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-slate-400', 'hover:text-white', 'hover:bg-slate-700');
        activeBtn.classList.add('bg-emerald-600', 'text-white');
    }

    const matches = getMatches();
    updateKPIs(matches);
    renderOpportunities(matches, 'opportunities-feed');
}

function setSort(type) {
    state.sort = type;
    const matches = getMatches();
    updateKPIs(matches);
    renderOpportunities(matches, 'opportunities-feed');
}

function getMatches() {
    let results = [...state.matches];

    // 1. Filter
    if (state.filter !== 'all') {
        results = results.filter(m => {
            const pattern = (m.pattern_name || '').toLowerCase();
            const isSoftware = SOFTWARE_KEYWORDS.some(kw => pattern.includes(kw));
            return state.filter === 'software' ? isSoftware : !isSoftware;
        });
    }

    // 2. Sort
    results.sort((a, b) => {
        if (state.sort === 'recent') {
            return new Date(b.source_gazette?.date || 0) - new Date(a.source_gazette?.date || 0);
        }
        if (state.sort === 'urgent') {
            const urgencyScore = { critical: 3, high: 2, medium: 1, low: 0 };
            return (urgencyScore[b.urgency] || 0) - (urgencyScore[a.urgency] || 0);
        }
        if (state.sort === 'best') {
            // Weighted Score: Urgency + Confidence + IsSoftware
            const getScore = (m) => {
                let score = 0;
                // Urgency
                if (m.urgency === 'critical') score += 30;
                if (m.urgency === 'high') score += 20;
                // Confidence
                score += (m.confidence || 0) / 2; // up to 50
                // Software Boost
                const isSoft = SOFTWARE_KEYWORDS.some(kw => (m.pattern_name || '').toLowerCase().includes(kw));
                if (isSoft) score += 40; // Big boost for software patterns
                return score;
            };
            return getScore(b) - getScore(a);
        }
        return 0;
    });

    return results;
}

function initDashboard() {
    if (state.matches.length === 0) {
        renderEmptyState('opportunities-feed');
        return;
    }

    const matches = getMatches();
    updateKPIs(matches);
    renderOpportunities(matches, 'opportunities-feed');
    renderStats(matches);

    // Setup filters (simple client-side)
    setupFilters();
}

function initDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        window.location.href = 'dashboard.html';
        return;
    }

    const match = state.matches.find(m => m.id === id);
    if (!match) {
        document.getElementById('detail-title').textContent = 'Oportunidade não encontrada';
        return;
    }

    renderDetailView(match);
}

function initMap() {
    // Placeholder for map logic
    console.log('🗺️ Map View Loaded');
    // We could render top cities list here using state.matches
    renderTopCities(state.matches);
}

function initAnalytics() {
    console.log('📊 Analytics View Loaded');
    // Render charts
    renderStats(state.matches); // Reuse for now or build specific
    renderAnalyticsCharts(state.matches);
}

// --- Renderers ---

function updateKPIs(matches) {
    // Opportunities
    animateValue('kpi-opportunities', 0, matches.length, 1000);

    // Critical
    const criticalCount = matches.filter(m => m.urgency === 'critical').length;
    animateValue('kpi-critical', 0, criticalCount, 1000);


}

function renderOpportunities(matches, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    // Sort: Critical first, then High Confidence temp
    const sorted = [...matches].sort((a, b) => {
        const urgencyScore = { critical: 4, high: 3, medium: 2, low: 1 };
        return (urgencyScore[b.urgency] - urgencyScore[a.urgency]) || (b.confidence - a.confidence);
    });

    sorted.slice(0, 50).forEach(match => {
        const html = `
            <div class="opp-card urgency-${match.urgency} group relative cursor-pointer" onclick="window.location.href='detail.html?id=${match.id}'">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex flex-col gap-1">
                        <div class="flex items-center gap-2">
                            <span class="badge-${match.urgency} text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wide">
                                ${translateUrgency(match.urgency)}
                            </span>
                             <span class="text-[11px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                                <i data-lucide="map-pin" class="w-3 h-3 text-slate-500"></i>
                                ${match.source_gazette?.territory_name}
                            </span>
                        </div>
                        <h3 class="font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors text-base mt-1">
                            ${match.pattern_name}
                        </h3>
                    </div>
                    <span class="text-xs font-mono text-slate-500 whitespace-nowrap">${formatDate(match.source_gazette?.date)}</span>
                </div>
                
                <p class="text-sm text-slate-400 mb-4 leading-relaxed line-clamp-2">
                    ${match.ai_reasoning}
                </p>
                
                <div class="flex items-center justify-between border-t border-slate-700/50 pt-3 mt-2">
                    <div class="flex gap-2 items-center">
                        ${classifyKillZone(match.pattern_name)}
                    </div>
                    
                    <div class="flex items-center gap-3">
                        ${match.action_deadline ? `
                            <span class="text-xs text-amber-500 flex items-center gap-1 font-medium bg-amber-500/10 px-2 py-0.5 rounded">
                                <i data-lucide="clock" class="w-3 h-3"></i> ${match.action_deadline}
                            </span>
                        ` : ''}
                        
                        <div class="flex items-center gap-1 text-xs font-mono font-bold ${getConfidenceColor(match.confidence)}">
                            <i data-lucide="bar-chart-2" class="w-3 h-3"></i>
                            ${match.confidence}%
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });

    lucide.createIcons();
}

function renderDetailView(match) {
    // Populate simple fields
    setText('detail-title', match.pattern_name);
    setText('detail-territory', match.source_gazette?.territory_name);
    setText('detail-date', formatDate(match.source_gazette?.date));
    setText('detail-reasoning', match.ai_reasoning);
    setText('detail-snippet', match.source_gazette?.text || 'Texto completo não disponível neste snippet.');
    // Note: raw text might not be in match, might need separate fetch if optimized, but for now we rely on match having snippets or we use reasoning
    // The current analysis saves truncated text? No, it saves reasoning and matches.
    // The snippet is likely missing from this match object. We might need to display "Texto não disponível" or fetch it.
    // In `analyzeGazette`, we return `matches` and `gazette`. `gazette` has `text`?
    // Let's check `process_enrichment` or `analyze_gazette`. The `AnalysisResult` includes `gazette`.
    // My data loader spreads `results`. `results` are `AnalysisResult` objects.
    // So `match.source_gazette` is the `gazette` object which HAS `url` but maybe not full text if not saved.
    // We will show URL if text is missing.

    if (match.source_gazette?.url) {
        const snippetEl = document.getElementById('detail-snippet');
        snippetEl.innerHTML = `
            <p class="mb-4">${match.ai_reasoning}</p>
            <a href="${match.source_gazette.url}" target="_blank" class="text-emerald-400 hover:underline flex items-center gap-2">
                <i data-lucide="external-link" class="w-4 h-4"></i> Ler Diário Oficial Completo
            </a>
        `;
    }

    setText('detail-confidence', `${match.confidence}%`);
    document.getElementById('detail-progress').style.width = `${match.confidence}%`;

    setText('meta-territory', match.source_gazette?.territory_name);
    setText('meta-pattern', match.pattern_id);
    setText('meta-deadline', match.action_deadline || 'Não informado');

    // Breadcrumb
    setText('crumb-id', match.pattern_name.substring(0, 20) + '...');

    // Viability Section Logic
    const viabilitySection = document.getElementById('viability-section');
    const viabilityBtn = document.getElementById('btn-analyze-viability');

    if (viabilitySection) {
        viabilitySection.classList.remove('hidden'); // Always show container

        // Check if report exists (optional optimization: store in match state)
        // For now, we rely on user clicking "Generate" or it being instant if cached

        viabilityBtn.onclick = async () => {
            // UI State: Loading
            document.getElementById('viability-cta').classList.add('hidden');
            document.getElementById('viability-loading').classList.remove('hidden');

            try {
                const res = await fetch('/api/analyze/viability', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: match.id || match.extracted_id })
                });

                if (!res.ok) throw new Error('Analysis failed');

                const report = await res.json();
                renderViabilityReport(report);

            } catch (err) {
                console.error(err);
                alert('Falha ao gerar análise. Tente novamente.');
                // Revert UI
                document.getElementById('viability-cta').classList.remove('hidden');
                document.getElementById('viability-loading').classList.add('hidden');
            }
        };
    }
}

function renderViabilityReport(report) {
    document.getElementById('viability-loading').classList.add('hidden');
    document.getElementById('viability-result').classList.remove('hidden');

    // Header Stats
    setText('viability-score-value', report.viability_score);
    document.getElementById('viability-score-bar').style.width = `${report.viability_score}%`;
    document.getElementById('viability-score-bar').className = `h-full transition-all duration-1000 ${getConfidenceColor(report.viability_score).replace('text-', 'bg-')}`;

    setText('viability-summary', report.executive_summary);

    // MVP Roadmap
    const roadmapEl = document.getElementById('viability-roadmap');
    roadmapEl.innerHTML = report.mvp_roadmap.map(item => `
        <li class="flex items-start gap-2 text-sm text-slate-300">
            <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"></i>
            <span>${item}</span>
        </li>
    `).join('');

    // Risks
    const risksEl = document.getElementById('viability-risks');
    risksEl.innerHTML = (report.market_analysis?.risks || []).map(item => `
        <li class="flex items-start gap-2 text-xs text-slate-400">
            <i data-lucide="alert-triangle" class="w-3 h-3 text-rose-500 mt-0.5 shrink-0"></i>
            <span>${item}</span>
        </li>
    `).join('');

    // Cost Analysis (AI Valuation)
    const budget = report.estimated_budget;
    if (budget) {
        const fmt = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

        setText('cost-traditional', `${fmt(budget.traditional_cost_brl)} (${budget.traditional_dev_hours}h)`);
        setText('cost-ai', `${fmt(budget.ai_accelerated_cost_brl)}`);
        setText('cost-margin', `+ ${fmt(budget.potential_margin_brl)}`);
    }

    // Execution Capability
    const exec = report.execution_capability;
    if (exec) {
        const panel = document.getElementById('execution-panel');
        const icon = document.getElementById('execution-icon');
        const status = document.getElementById('execution-status');
        const desc = document.getElementById('execution-desc');

        if (exec.can_we_execute) {
            panel.className = "bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3";
            icon.setAttribute('data-lucide', 'thumbs-up');
            icon.className = "w-4 h-4 text-emerald-400";
            status.textContent = "Podemos Executar Internamente";
            status.className = "font-bold text-emerald-200 text-sm";
        } else {
            panel.className = "bg-amber-500/10 border border-amber-500/30 rounded-lg p-3";
            icon.setAttribute('data-lucide', 'users');
            icon.className = "w-4 h-4 text-amber-400";
            status.textContent = "Necessário Parceiro Especializado";
            status.className = "font-bold text-amber-200 text-sm";
        }

        desc.textContent = exec.team_needed ? `Time: ${exec.team_needed.join(', ')}` : exec.partnership_recommendation;
    }

    lucide.createIcons();
}

function renderStats(matches) {
    const container = document.getElementById('stats-container');
    if (!container) return;

    const counts = {};
    matches.forEach(m => {
        const type = m.pattern_name.split(' - ')[0] || 'Outros';
        counts[type] = (counts[type] || 0) + 1;
    });

    const sortedTypes = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const max = sortedTypes[0]?.[1] || 1;

    container.innerHTML = sortedTypes.slice(0, 5).map(([type, count]) => `
        <div>
            <div class="flex justify-between text-xs text-slate-400 mb-1">
                <span>${type}</span>
                <span class="font-mono text-slate-500">${count}</span>
            </div>
            <div class="w-full bg-slate-700/30 rounded-full h-1.5">
                <div class="bg-emerald-500/50 h-1.5 rounded-full" style="width: ${(count / max) * 100}%"></div>
            </div>
        </div>
    `).join('');
}

function renderAnalyticsCharts(matches) {
    console.log('📊 Rendering Analytics Charts with', matches.length, 'matches');

    // Chart.js Global Config
    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.borderColor = 'rgba(51, 65, 85, 0.5)';
        Chart.defaults.font.family = 'Inter, sans-serif';
    }

    // --- Aggregate Data ---
    const categories = {};
    const cities = {};
    let softwareCount = 0;
    let otherCount = 0;

    matches.forEach(m => {
        // Categories
        const cat = m.pattern_name.split(' - ')[0] || m.pattern_name || 'Outros';
        categories[cat] = (categories[cat] || 0) + 1;

        // Cities
        const city = m.source_gazette?.territory_name || 'Desconhecido';
        cities[city] = (cities[city] || 0) + 1;

        // Kill-Zone
        const isSoft = SOFTWARE_KEYWORDS.some(kw => (m.pattern_name || '').toLowerCase().includes(kw));
        if (isSoft) softwareCount++;
        else otherCount++;
    });

    // --- Update Kill-Zone Stats ---
    const kzSoft = document.getElementById('kz-software');
    const kzOther = document.getElementById('kz-other');
    const kzTotal = document.getElementById('kz-total');

    if (kzSoft) kzSoft.innerText = softwareCount;
    if (kzOther) kzOther.innerText = otherCount;
    if (kzTotal) kzTotal.innerText = matches.length;

    // --- Charts ---

    // 1. Categories Bar
    const ctxCat = document.getElementById('chart-categories');
    if (ctxCat) {
        new Chart(ctxCat, {
            type: 'bar',
            data: {
                labels: Object.keys(categories).map(l => l.length > 20 ? l.substring(0, 20) + '...' : l),
                datasets: [{
                    label: 'Oportunidades',
                    data: Object.values(categories),
                    backgroundColor: 'rgba(16, 185, 129, 0.6)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }, // Simple config
                scales: {
                    y: { beginAtZero: true },
                    x: { ticks: { maxRotation: 45, font: { size: 10 } } }
                }
            }
        });
    }

    // 2. Doughnut Distribution
    const ctxPie = document.getElementById('chart-doughnut');
    if (ctxPie) {
        const topCats = Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 6);
        new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: topCats.map(c => c[0]),
                datasets: [{
                    data: topCats.map(c => c[1]),
                    backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#64748b'],
                    borderWidth: 2,
                    borderColor: '#1e293b'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true, font: { size: 11 } } }
                }
            }
        });
    }

    // 3. Top Cities
    const ctxCities = document.getElementById('chart-cities');
    if (ctxCities) {
        const topCities = Object.entries(cities).sort((a, b) => b[1] - a[1]).slice(0, 6);
        new Chart(ctxCities, {
            type: 'bar',
            data: {
                labels: topCities.map(c => c[0]),
                datasets: [{
                    label: 'Oportunidades',
                    data: topCities.map(c => c[1]),
                    backgroundColor: 'rgba(245, 158, 11, 0.6)', // Amber for location
                    borderColor: 'rgba(245, 158, 11, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true }
                }
            }
        });
    }

    // Reveal Logic (Loading -> Content)
    setTimeout(() => {
        const loading = document.getElementById('analytics-loading');
        const content = document.getElementById('analytics-content');
        if (loading) loading.classList.add('hidden');
        if (content) content.classList.remove('hidden');
    }, 800); // 800ms simulated delay for smooth transition
}

function renderTopCities(matches) {
    // Similar to Stats but grouped by city
    // Can be implemented if Map page needs it
}

// --- Helpers ---

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '--';
}

function renderEmptyState(containerId) {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = `
        <div class="text-center py-12 text-slate-500 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
            <i data-lucide="file-search" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
            <p>Nenhuma oportunidade encontrada.</p>
        </div>
    `;
}

function setupFilters() {
    const buttons = document.querySelectorAll('.filter-chip');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all
            buttons.forEach(b => b.classList.remove('active'));
            // Add to clicked
            e.target.classList.add('active');

            // Filter logic
            const filter = e.target.textContent;
            let filtered = state.matches;

            if (filter === 'Críticas') filtered = state.matches.filter(m => m.urgency === 'critical');
            if (filter === 'Licitações') filtered = state.matches.filter(m => m.pattern_name.includes('Licitaç'));
            if (filter === 'Zoneamento') filtered = state.matches.filter(m => m.pattern_name.includes('Zoneamento'));

            renderOpportunities(filtered, 'opportunities-feed');
        });
    });
}

function translateUrgency(u) {
    const map = { critical: 'Crítica', high: 'Alta', medium: 'Média', low: 'Baixa' };
    return map[u] || u;
}

function getConfidenceColor(score) {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 70) return 'text-sky-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR');
}
