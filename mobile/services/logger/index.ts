import { isProd } from '../../app/src/config/env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL: LogLevel = isProd ? 'warn' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[MIN_LEVEL];
}

function format(level: LogLevel, tag: string, message: string): string {
  return `[${level.toUpperCase()}][${tag}] ${message}`;
}

export const logger = {
  debug(tag: string, message: string, ...args: unknown[]): void {
    if (shouldLog('debug')) console.debug(format('debug', tag, message), ...args);
  },
  info(tag: string, message: string, ...args: unknown[]): void {
    if (shouldLog('info')) console.info(format('info', tag, message), ...args);
  },
  warn(tag: string, message: string, ...args: unknown[]): void {
    if (shouldLog('warn')) console.warn(format('warn', tag, message), ...args);
  },
  error(tag: string, message: string, ...args: unknown[]): void {
    if (shouldLog('error')) console.error(format('error', tag, message), ...args);
  },
};

export default logger;
