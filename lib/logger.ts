enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

class Logger {
  private static instance: Logger;
  private level: LogLevel;
  private isProduction: boolean;

  private constructor() {
    this.level = this.getLogLevel();
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private getLogLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      case 'FATAL': return LogLevel.FATAL;
      default: return this.isProduction ? LogLevel.WARN : LogLevel.DEBUG;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private createLogEntry(level: LogLevel, message: string, context?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const logMessage = this.formatMessage(entry);

    if (this.isProduction) {
      // Production'da structured logging
      if (entry.level >= LogLevel.ERROR) {
        console.error(JSON.stringify(entry));
      } else if (entry.level >= LogLevel.WARN) {
        console.warn(JSON.stringify(entry));
      } else {
        console.log(JSON.stringify(entry));
      }
    } else {
      // Development'da readable logging
      if (entry.level >= LogLevel.ERROR) {
        console.error(logMessage, entry.context);
      } else if (entry.level >= LogLevel.WARN) {
        console.warn(logMessage, entry.context);
      } else {
        console.log(logMessage, entry.context);
      }
    }
  }

  private formatMessage(entry: LogEntry): string {
    const levelName = LogLevel[entry.level];
    const time = new Date(entry.timestamp).toLocaleTimeString();
    return `[${time}] ${levelName}: ${entry.message}`;
  }

  debug(message: string, context?: any): void {
    this.writeLog(this.createLogEntry(LogLevel.DEBUG, message, context));
  }

  info(message: string, context?: any): void {
    this.writeLog(this.createLogEntry(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: any): void {
    this.writeLog(this.createLogEntry(LogLevel.WARN, message, context));
  }

  error(message: string, context?: any): void {
    this.writeLog(this.createLogEntry(LogLevel.ERROR, message, context));
  }

  fatal(message: string, context?: any): void {
    this.writeLog(this.createLogEntry(LogLevel.FATAL, message, context));
  }
}

export const logger = Logger.getInstance();
export { LogLevel }; 