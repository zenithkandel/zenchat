/**
 * ZenChat — Structured Logger
 *
 * Development logger with levels and tags.
 * No spamming production console.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogTag =
  | 'BLE'
  | 'DISCOVERY'
  | 'CONNECTION'
  | 'PROTOCOL'
  | 'CHAT'
  | 'STORAGE'
  | 'QR'
  | 'IDENTITY'
  | 'CRYPTO'
  | 'APP'
  | 'UI'
  | 'NAV';

interface LogEntry {
  timestamp: number;
  level: LogLevel;
  tag: LogTag;
  message: string;
  data?: unknown;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private minLevel: LogLevel = __DEV__ ? 'debug' : 'warn';
  private entries: LogEntry[] = [];
  private readonly maxEntries = 1000;

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  debug(tag: LogTag, message: string, data?: unknown): void {
    this.log('debug', tag, message, data);
  }

  info(tag: LogTag, message: string, data?: unknown): void {
    this.log('info', tag, message, data);
  }

  warn(tag: LogTag, message: string, data?: unknown): void {
    this.log('warn', tag, message, data);
  }

  error(tag: LogTag, message: string, data?: unknown): void {
    this.log('error', tag, message, data);
  }

  private log(level: LogLevel, tag: LogTag, message: string, data?: unknown): void {
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      tag,
      message,
      data,
    };

    // Store for diagnostics
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    // Console output in dev
    if (__DEV__) {
      const prefix = `[${tag}]`;
      const timeStr = new Date(entry.timestamp).toISOString().slice(11, 23);

      switch (level) {
        case 'debug':
          console.log(`${timeStr} ${prefix} ${message}`, data ?? '');
          break;
        case 'info':
          console.info(`${timeStr} ${prefix} ${message}`, data ?? '');
          break;
        case 'warn':
          console.warn(`${timeStr} ${prefix} ${message}`, data ?? '');
          break;
        case 'error':
          console.error(`${timeStr} ${prefix} ${message}`, data ?? '');
          break;
      }
    }
  }

  /**
   * Get recent log entries for diagnostics display.
   */
  getEntries(filter?: { tag?: LogTag; level?: LogLevel; limit?: number }): LogEntry[] {
    let result = [...this.entries];

    if (filter?.tag) {
      result = result.filter(e => e.tag === filter.tag);
    }

    if (filter?.level) {
      const minPriority = LOG_LEVEL_PRIORITY[filter.level];
      result = result.filter(e => LOG_LEVEL_PRIORITY[e.level] >= minPriority);
    }

    if (filter?.limit) {
      result = result.slice(-filter.limit);
    }

    return result;
  }

  /**
   * Clear all stored log entries.
   */
  clear(): void {
    this.entries = [];
  }
}

export const logger = new Logger();
