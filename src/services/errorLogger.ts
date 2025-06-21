import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  error?: any;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

class ErrorLogger {
  private logs: LogEntry[] = [];
  private maxLocalLogs = 100;
  private isProduction = process.env.NODE_ENV === 'production';
  private userId: string | null = null;

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  private async log(
    level: LogLevel,
    message: string,
    context?: string,
    error?: any,
    metadata?: Record<string, any>
  ) {
    const logEntry: LogEntry = {
      level,
      message,
      context,
      error: error
        ? {
            message: error.message || String(error),
            stack: error.stack,
            code: error.code,
            name: error.name,
          }
        : undefined,
      timestamp: new Date(),
      userId: this.userId || undefined,
      metadata,
    };

    // Store locally
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLocalLogs) {
      this.logs.shift();
    }

    // In production, send critical errors to Firebase
    if (this.isProduction && (level === LogLevel.ERROR || level === LogLevel.FATAL)) {
      this.sendToFirebase(logEntry).catch(() => {
        // Silently fail - we don't want logging to break the app
      });
    }

    // Save to AsyncStorage for debugging
    if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
      this.saveToStorage(logEntry).catch(() => {
        // Silently fail
      });
    }
  }

  debug(message: string, context?: string, metadata?: Record<string, any>) {
    if (!this.isProduction) {
      this.log(LogLevel.DEBUG, message, context, undefined, metadata);
    }
  }

  info(message: string, context?: string, metadata?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context, undefined, metadata);
  }

  warn(message: string, context?: string, metadata?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context, undefined, metadata);
  }

  error(message: string, error?: any, context?: string, metadata?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, context, error, metadata);
  }

  fatal(message: string, error?: any, context?: string, metadata?: Record<string, any>) {
    this.log(LogLevel.FATAL, message, context, error, metadata);
  }

  private async sendToFirebase(logEntry: LogEntry) {
    try {
      if (!this.isProduction) return;

      const errorLog = {
        ...logEntry,
        timestamp: logEntry.timestamp.toISOString(),
        environment: 'production',
        appVersion: '1.0.0', // You should get this from your app config
        platform: 'react-native',
      };

      await firestore().collection('error_logs').add(errorLog);
    } catch (error) {
      // Silently fail - we don't want logging errors to break the app
    }
  }

  private async saveToStorage(logEntry: LogEntry) {
    try {
      const key = '@greedgross:error_logs';
      const existingLogs = await AsyncStorage.getItem(key);
      const logs = existingLogs ? JSON.parse(existingLogs) : [];

      logs.push({
        ...logEntry,
        timestamp: logEntry.timestamp.toISOString(),
      });

      // Keep only last 50 error logs
      const recentLogs = logs.slice(-50);

      await AsyncStorage.setItem(key, JSON.stringify(recentLogs));
    } catch (error) {
      // Silently fail
    }
  }

  async getStoredLogs(): Promise<LogEntry[]> {
    try {
      const key = '@greedgross:error_logs';
      const logs = await AsyncStorage.getItem(key);
      if (!logs) return [];

      return JSON.parse(logs).map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
    } catch (error) {
      return [];
    }
  }

  async clearStoredLogs() {
    try {
      await AsyncStorage.removeItem('@greedgross:error_logs');
    } catch (error) {
      // Silently fail
    }
  }

  getRecentLogs(count: number = 20): LogEntry[] {
    return this.logs.slice(-count);
  }
}

export const errorLogger = new ErrorLogger();
