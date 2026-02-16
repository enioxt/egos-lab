
import { TourismNews } from '../tourism/types';

export interface EventPrediction {
    name: string;
    nextDatePrediction?: string;
    confidence: number;
    sourceUrl: string;
}

export class EventPatternMatcher {
    private knownEvents = [
        'Fenapraça', 'Balaio de Arte', 'Festival de Pratos Típicos', 'Expominas'
    ];

    detect(news: TourismNews[]): EventPrediction[] {
        const predictions: EventPrediction[] = [];

        for (const item of news) {
            for (const eventName of this.knownEvents) {
                if (item.title.includes(eventName) || item.summary.includes(eventName)) {
                    // Primitive date extraction from title/summary
                    // Look for dates like "DD/MM" or "de X a Y de Mês"
                    // For MVP, just flag it.
                    predictions.push({
                        name: eventName,
                        confidence: 0.8, // High because keyword match
                        sourceUrl: item.url,
                        nextDatePrediction: 'Check news content'
                    });
                }
            }
        }

        return predictions;
    }
}
