/**
 * Link Prediction Accuracy Tracker
 * 
 * Tracks predictions and user feedback to measure model accuracy.
 * Stores all predictions with outcomes for continuous improvement.
 * 
 * Metrics:
 * - Precision: TP / (TP + FP)
 * - Recall: TP / (TP + FN)
 * - F1 Score: 2 * (P * R) / (P + R)
 * - Accuracy: (TP + TN) / Total
 * 
 * @version 1.0.0
 */

export interface Prediction {
    id: string;
    entity1_id: string;
    entity2_id: string;
    entity1_name: string;
    entity2_name: string;
    entity_type: string;
    score: number;
    algorithm: 'exact' | 'fuzzy' | 'phonetic' | 'embedding' | 'llm';
    created_at: Date;
    outcome?: 'confirmed' | 'rejected' | 'pending';
    feedback_at?: Date;
    feedback_by?: string;
    investigation_id?: string;
}

export interface AccuracyMetrics {
    totalPredictions: number;
    confirmed: number;
    rejected: number;
    pending: number;
    precision: number;
    recall: number;
    f1Score: number;
    accuracy: number;
    byAlgorithm: Record<string, {
        total: number;
        confirmed: number;
        rejected: number;
        precision: number;
    }>;
    byScoreRange: {
        high: { total: number; confirmed: number; precision: number }; // >= 0.9
        medium: { total: number; confirmed: number; precision: number }; // 0.7-0.9
        low: { total: number; confirmed: number; precision: number }; // < 0.7
    };
    trend: {
        last7Days: number;
        last30Days: number;
        allTime: number;
    };
}

/**
 * Calculate precision from predictions
 */
export function calculatePrecision(predictions: Prediction[]): number {
    const relevant = predictions.filter(p => p.outcome !== 'pending');
    if (relevant.length === 0) return 0;
    
    const confirmed = relevant.filter(p => p.outcome === 'confirmed').length;
    return confirmed / relevant.length;
}

/**
 * Calculate accuracy metrics from a list of predictions
 */
export function calculateMetrics(predictions: Prediction[]): AccuracyMetrics {
    const total = predictions.length;
    const confirmed = predictions.filter(p => p.outcome === 'confirmed').length;
    const rejected = predictions.filter(p => p.outcome === 'rejected').length;
    const pending = predictions.filter(p => p.outcome === 'pending' || !p.outcome).length;
    
    // Precision: Of those we predicted as matches, how many were correct?
    const precision = (confirmed + rejected) > 0 ? confirmed / (confirmed + rejected) : 0;
    
    // For recall, we'd need to know all actual matches (which we don't have)
    // Using a proxy: assuming high-confidence predictions should be matches
    const highConfidence = predictions.filter(p => p.score >= 0.9);
    const highConfidenceConfirmed = highConfidence.filter(p => p.outcome === 'confirmed').length;
    const recall = highConfidence.length > 0 ? highConfidenceConfirmed / highConfidence.length : 0;
    
    // F1 Score
    const f1Score = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
    
    // Overall accuracy
    const accuracy = precision; // Simplified: same as precision when we don't have negatives
    
    // By algorithm
    const byAlgorithm: AccuracyMetrics['byAlgorithm'] = {};
    const algorithms = [...new Set(predictions.map(p => p.algorithm))];
    
    for (const algo of algorithms) {
        const algoPreds = predictions.filter(p => p.algorithm === algo);
        const algoConfirmed = algoPreds.filter(p => p.outcome === 'confirmed').length;
        const algoRejected = algoPreds.filter(p => p.outcome === 'rejected').length;
        const algoReviewed = algoConfirmed + algoRejected;
        
        byAlgorithm[algo] = {
            total: algoPreds.length,
            confirmed: algoConfirmed,
            rejected: algoRejected,
            precision: algoReviewed > 0 ? algoConfirmed / algoReviewed : 0,
        };
    }
    
    // By score range
    const highScore = predictions.filter(p => p.score >= 0.9);
    const mediumScore = predictions.filter(p => p.score >= 0.7 && p.score < 0.9);
    const lowScore = predictions.filter(p => p.score < 0.7);
    
    const byScoreRange = {
        high: {
            total: highScore.length,
            confirmed: highScore.filter(p => p.outcome === 'confirmed').length,
            precision: calculatePrecision(highScore),
        },
        medium: {
            total: mediumScore.length,
            confirmed: mediumScore.filter(p => p.outcome === 'confirmed').length,
            precision: calculatePrecision(mediumScore),
        },
        low: {
            total: lowScore.length,
            confirmed: lowScore.filter(p => p.outcome === 'confirmed').length,
            precision: calculatePrecision(lowScore),
        },
    };
    
    // Trend (precision over time)
    const now = new Date();
    const last7Days = predictions.filter(p => {
        const createdAt = new Date(p.created_at);
        return (now.getTime() - createdAt.getTime()) < 7 * 24 * 60 * 60 * 1000;
    });
    const last30Days = predictions.filter(p => {
        const createdAt = new Date(p.created_at);
        return (now.getTime() - createdAt.getTime()) < 30 * 24 * 60 * 60 * 1000;
    });
    
    return {
        totalPredictions: total,
        confirmed,
        rejected,
        pending,
        precision,
        recall,
        f1Score,
        accuracy,
        byAlgorithm,
        byScoreRange,
        trend: {
            last7Days: calculatePrecision(last7Days),
            last30Days: calculatePrecision(last30Days),
            allTime: precision,
        },
    };
}

/**
 * Generate report summary
 */
export function generateAccuracyReport(metrics: AccuracyMetrics): string {
    const lines: string[] = [
        '# Link Prediction Accuracy Report',
        '',
        `Generated: ${new Date().toISOString()}`,
        '',
        '## Overall Metrics',
        '',
        `| Metric | Value |`,
        `|--------|-------|`,
        `| Total Predictions | ${metrics.totalPredictions} |`,
        `| Confirmed | ${metrics.confirmed} (${(metrics.confirmed / metrics.totalPredictions * 100).toFixed(1)}%) |`,
        `| Rejected | ${metrics.rejected} (${(metrics.rejected / metrics.totalPredictions * 100).toFixed(1)}%) |`,
        `| Pending | ${metrics.pending} (${(metrics.pending / metrics.totalPredictions * 100).toFixed(1)}%) |`,
        `| **Precision** | **${(metrics.precision * 100).toFixed(1)}%** |`,
        `| F1 Score | ${(metrics.f1Score * 100).toFixed(1)}% |`,
        '',
        '## By Algorithm',
        '',
        '| Algorithm | Total | Confirmed | Rejected | Precision |',
        '|-----------|-------|-----------|----------|-----------|',
    ];
    
    for (const [algo, data] of Object.entries(metrics.byAlgorithm)) {
        lines.push(`| ${algo} | ${data.total} | ${data.confirmed} | ${data.rejected} | ${(data.precision * 100).toFixed(1)}% |`);
    }
    
    lines.push('');
    lines.push('## By Score Range');
    lines.push('');
    lines.push('| Range | Total | Confirmed | Precision |');
    lines.push('|-------|-------|-----------|-----------|');
    lines.push(`| High (≥0.9) | ${metrics.byScoreRange.high.total} | ${metrics.byScoreRange.high.confirmed} | ${(metrics.byScoreRange.high.precision * 100).toFixed(1)}% |`);
    lines.push(`| Medium (0.7-0.9) | ${metrics.byScoreRange.medium.total} | ${metrics.byScoreRange.medium.confirmed} | ${(metrics.byScoreRange.medium.precision * 100).toFixed(1)}% |`);
    lines.push(`| Low (<0.7) | ${metrics.byScoreRange.low.total} | ${metrics.byScoreRange.low.confirmed} | ${(metrics.byScoreRange.low.precision * 100).toFixed(1)}% |`);
    
    lines.push('');
    lines.push('## Trend');
    lines.push('');
    lines.push(`| Period | Precision |`);
    lines.push(`|--------|-----------|`);
    lines.push(`| Last 7 days | ${(metrics.trend.last7Days * 100).toFixed(1)}% |`);
    lines.push(`| Last 30 days | ${(metrics.trend.last30Days * 100).toFixed(1)}% |`);
    lines.push(`| All time | ${(metrics.trend.allTime * 100).toFixed(1)}% |`);
    
    return lines.join('\n');
}

/**
 * Determine if model needs retraining based on metrics
 */
export function needsRetraining(metrics: AccuracyMetrics): {
    needed: boolean;
    reason?: string;
    severity: 'low' | 'medium' | 'high';
} {
    // Check precision threshold
    if (metrics.precision < 0.5 && metrics.totalPredictions > 50) {
        return {
            needed: true,
            reason: `Precision below 50% (${(metrics.precision * 100).toFixed(1)}%)`,
            severity: 'high',
        };
    }
    
    // Check for declining trend
    if (metrics.trend.last7Days < metrics.trend.allTime * 0.8 && metrics.totalPredictions > 100) {
        return {
            needed: true,
            reason: `Recent precision declining (7d: ${(metrics.trend.last7Days * 100).toFixed(1)}% vs all: ${(metrics.trend.allTime * 100).toFixed(1)}%)`,
            severity: 'medium',
        };
    }
    
    // Check if high-confidence predictions are underperforming
    if (metrics.byScoreRange.high.precision < 0.7 && metrics.byScoreRange.high.total > 20) {
        return {
            needed: true,
            reason: `High-confidence predictions underperforming (${(metrics.byScoreRange.high.precision * 100).toFixed(1)}%)`,
            severity: 'medium',
        };
    }
    
    return { needed: false, severity: 'low' };
}
