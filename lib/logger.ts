import fs from 'fs';
import path from 'path';

// Simple logging utility to save scraping logs to files
export class ArchiveLogger {
  private logDir: string;
  private currentLogFile: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Create a new log file for this session
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.currentLogFile = path.join(this.logDir, `archive-sync-${timestamp}.log`);
  }

  log(message: string, archiveName?: string) {
    const timestamp = new Date().toISOString();
    const prefix = archiveName ? `[${archiveName}]` : '[SYSTEM]';
    const logEntry = `${timestamp} ${prefix} ${message}\n`;
    
    // Write to console (existing behavior)
    console.log(message);
    
    // Also write to file
    try {
      fs.appendFileSync(this.currentLogFile, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  getLogFilePath(): string {
    return this.currentLogFile;
  }

  static getRecentLogs(limit: number = 5): string[] {
    const logDir = path.join(process.cwd(), 'logs');
    
    if (!fs.existsSync(logDir)) {
      return [];
    }

    try {
      const files = fs.readdirSync(logDir)
        .filter(file => file.startsWith('archive-sync-') && file.endsWith('.log'))
        .sort()
        .reverse()
        .slice(0, limit);

      return files.map(file => path.join(logDir, file));
    } catch (error) {
      console.error('Failed to read log directory:', error);
      return [];
    }
  }
}