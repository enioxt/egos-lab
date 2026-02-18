/**
 * Logger Centralizado - INTELINK
 * 
 * Sistema de logging estruturado para APIs e serviços
 * Suporta níveis: debug, info, warn, error
 * Output: JSON estruturado para análise
 */

// ============================================
// TYPES
// ============================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: string;
    data?: Record<string, unknown>;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
    request?: {
        method: string;
        path: string;
        ip?: string;
        userAgent?: string;
    };
    duration?: number;
}

export interface LoggerOptions {
    context?: string;
    minLevel?: LogLevel;
    pretty?: boolean;
}

// ============================================
// LEVEL PRIORITY
// ============================================

const LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

// ============================================
// COLORS (for pretty printing)
// ============================================

const COLORS = {
    reset: '\x1b[0m',
    debug: '\x1b[36m',  // cyan
    info: '\x1b[32m',   // green
    warn: '\x1b[33m',   // yellow
    error: '\x1b[31m',  // red
    dim: '\x1b[2m',
    bold: '\x1b[1m',
};

// ============================================
// LOGGER CLASS
// ============================================

class Logger {
    private context: string;
    private minLevel: LogLevel;
    private pretty: boolean;

    constructor(options: LoggerOptions = {}) {
        this.context = options.context || 'app';
        this.minLevel = options.minLevel || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
        this.pretty = options.pretty ?? process.env.NODE_ENV !== 'production';
    }

    private shouldLog(level: LogLevel): boolean {
        return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.minLevel];
    }

    private formatEntry(entry: LogEntry): string {
        if (this.pretty) {
            return this.formatPretty(entry);
        }
        return JSON.stringify(entry);
    }

    private formatPretty(entry: LogEntry): string {
        const color = COLORS[entry.level];
        const levelStr = entry.level.toUpperCase().padEnd(5);
        const time = new Date(entry.timestamp).toLocaleTimeString('pt-BR');
        
        let output = `${COLORS.dim}[${time}]${COLORS.reset} ${color}${levelStr}${COLORS.reset} `;
        output += `${COLORS.bold}[${entry.context || this.context}]${COLORS.reset} `;
        output += entry.message;

        if (entry.duration !== undefined) {
            output += ` ${COLORS.dim}(${entry.duration}ms)${COLORS.reset}`;
        }

        if (entry.data && Object.keys(entry.data).length > 0) {
            output += `\n  ${COLORS.dim}${JSON.stringify(entry.data)}${COLORS.reset}`;
        }

        if (entry.error) {
            output += `\n  ${COLORS.error}${entry.error.name}: ${entry.error.message}${COLORS.reset}`;
            if (entry.error.stack && process.env.NODE_ENV !== 'production') {
                output += `\n  ${COLORS.dim}${entry.error.stack.split('\n').slice(1, 4).join('\n  ')}${COLORS.reset}`;
            }
        }

        return output;
    }

    private log(level: LogLevel, message: string, data?: Record<string, unknown>, error?: Error): void {
        if (!this.shouldLog(level)) return;

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context: this.context,
        };

        if (data) entry.data = data;
        
        if (error) {
            entry.error = {
                name: error.name,
                message: error.message,
                stack: error.stack,
            };
        }

        const output = this.formatEntry(entry);
        
        if (level === 'error') {
            console.error(output);
        } else if (level === 'warn') {
            console.warn(output);
        } else {
            console.log(output);
        }
    }

    // Public methods
    debug(message: string, data?: Record<string, unknown>): void {
        this.log('debug', message, data);
    }

    info(message: string, data?: Record<string, unknown>): void {
        this.log('info', message, data);
    }

    warn(message: string, data?: Record<string, unknown>): void {
        this.log('warn', message, data);
    }

    error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
        const err = error instanceof Error ? error : undefined;
        const extraData = error instanceof Error ? data : (error as Record<string, unknown>);
        this.log('error', message, extraData, err);
    }

    // Request logging helper
    request(method: string, path: string, duration: number, status: number, data?: Record<string, unknown>): void {
        const level: LogLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message: `${method} ${path} → ${status}`,
            context: 'http',
            duration,
            request: { method, path },
            data,
        };

        const output = this.formatEntry(entry);
        console.log(output);
    }

    // Create child logger with different context
    child(context: string): Logger {
        return new Logger({
            context: `${this.context}:${context}`,
            minLevel: this.minLevel,
            pretty: this.pretty,
        });
    }
}

// ============================================
// DEFAULT INSTANCES
// ============================================

// Main logger instance
export const logger = new Logger({ context: 'intelink' });

// Specialized loggers
export const apiLogger = new Logger({ context: 'api' });
export const botLogger = new Logger({ context: 'bot' });
export const dbLogger = new Logger({ context: 'db' });

// ============================================
// MIDDLEWARE HELPER
// ============================================

/**
 * Middleware para logging de requests em Next.js API routes
 */
export function withLogging<T>(
    handler: (req: Request) => Promise<T>,
    context?: string
): (req: Request) => Promise<T> {
    const log = context ? new Logger({ context }) : apiLogger;
    
    return async (req: Request): Promise<T> => {
        const start = Date.now();
        const url = new URL(req.url);
        const path = url.pathname;
        
        try {
            const result = await handler(req);
            const duration = Date.now() - start;
            
            // Try to get status from Response
            const status = result instanceof Response ? result.status : 200;
            log.request(req.method, path, duration, status);
            
            return result;
        } catch (error) {
            const duration = Date.now() - start;
            log.request(req.method, path, duration, 500, {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Mede tempo de execução de uma função
 */
export async function timed<T>(
    name: string,
    fn: () => Promise<T>,
    log: Logger = logger
): Promise<T> {
    const start = Date.now();
    try {
        const result = await fn();
        const duration = Date.now() - start;
        log.debug(`${name} completed`, { duration });
        return result;
    } catch (error) {
        const duration = Date.now() - start;
        log.error(`${name} failed`, error, { duration });
        throw error;
    }
}

export default logger;
