import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';
import { AuditLogEntry } from '../../shared/types';

const LOG_DIR = path.join(app.getPath('userData'), 'logs');

async function ensureLogDir(): Promise<void> {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create log directory:', error);
  }
}

function getLogFilePath(): string {
  const date = new Date().toISOString().split('T')[0];
  return path.join(LOG_DIR, `audit-${date}.ndjson`);
}

export async function logAudit(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
  await ensureLogDir();

  const logEntry: AuditLogEntry = {
    ...entry,
    timestamp: Date.now(),
  };

  const logLine = JSON.stringify(logEntry) + '\n';
  const logFile = getLogFilePath();

  try {
    await fs.appendFile(logFile, logLine, 'utf-8');
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

export async function readAuditLogs(date?: string): Promise<AuditLogEntry[]> {
  const logFile = date
    ? path.join(LOG_DIR, `audit-${date}.ndjson`)
    : getLogFilePath();

  try {
    const content = await fs.readFile(logFile, 'utf-8');
    return content
      .trim()
      .split('\n')
      .filter((line) => line)
      .map((line) => JSON.parse(line));
  } catch (error) {
    return [];
  }
}
