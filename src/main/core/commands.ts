import { shell } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { Command, CommandResult } from '../../shared/types';
import { logAudit } from './logger';
import { checkPermission } from './permissions';

async function sanitizePath(filePath: string): Promise<string> {
  // Resolve and normalize path
  const resolved = path.resolve(filePath);

  // Prevent directory traversal
  if (resolved.includes('..')) {
    throw new Error('Path traversal is not allowed');
  }

  return resolved;
}

export async function executeCommand(command: Command): Promise<CommandResult> {
  try {
    let result: CommandResult;

    switch (command.type) {
      case 'open':
        result = await executeOpen(command.target);
        break;
      case 'move':
        result = await executeMove(command.from, command.to, command.rename);
        break;
      case 'copy':
        result = await executeCopy(command.from, command.to);
        break;
      case 'delete':
        result = await executeDelete(command.target);
        break;
      case 'read':
        result = await executeRead(command.target);
        break;
      case 'write':
        result = await executeWrite(command.target, command.content);
        break;
      default:
        result = { ok: false, detail: 'Unknown command type' };
    }

    await logAudit({
      domain: getCommandDomain(command.type),
      action: command.type,
      params: command,
      result: result.ok ? 'success' : 'failure',
      error: result.ok ? undefined : result.detail,
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await logAudit({
      domain: getCommandDomain(command.type),
      action: command.type,
      params: command,
      result: 'failure',
      error: errorMessage,
    });

    return { ok: false, detail: errorMessage };
  }
}

function getCommandDomain(commandType: string): any {
  switch (commandType) {
    case 'read':
      return 'fs.read';
    case 'write':
    case 'move':
    case 'copy':
      return 'fs.write';
    case 'delete':
      return 'fs.delete';
    case 'open':
      return 'sys.open';
    default:
      return 'sys.open';
  }
}

async function executeOpen(target: string): Promise<CommandResult> {
  if (!checkPermission('sys.open', target)) {
    return { ok: false, detail: 'Permission denied' };
  }

  const sanitized = await sanitizePath(target);
  await shell.openPath(sanitized);

  return { ok: true, detail: `Opened: ${sanitized}` };
}

async function executeMove(from: string, to: string, rename?: string): Promise<CommandResult> {
  if (!checkPermission('fs.write', from) || !checkPermission('fs.write', to)) {
    return { ok: false, detail: 'Permission denied' };
  }

  const sanitizedFrom = await sanitizePath(from);
  const sanitizedTo = await sanitizePath(to);

  const targetPath = rename ? path.join(sanitizedTo, rename) : sanitizedTo;

  await fs.rename(sanitizedFrom, targetPath);

  return { ok: true, detail: `Moved: ${sanitizedFrom} → ${targetPath}` };
}

async function executeCopy(from: string, to: string): Promise<CommandResult> {
  if (!checkPermission('fs.read', from) || !checkPermission('fs.write', to)) {
    return { ok: false, detail: 'Permission denied' };
  }

  const sanitizedFrom = await sanitizePath(from);
  const sanitizedTo = await sanitizePath(to);

  await fs.copyFile(sanitizedFrom, sanitizedTo);

  return { ok: true, detail: `Copied: ${sanitizedFrom} → ${sanitizedTo}` };
}

async function executeDelete(target: string): Promise<CommandResult> {
  if (!checkPermission('fs.delete', target)) {
    return { ok: false, detail: 'Permission denied' };
  }

  const sanitized = await sanitizePath(target);

  const stat = await fs.stat(sanitized);
  if (stat.isDirectory()) {
    await fs.rm(sanitized, { recursive: true });
  } else {
    await fs.unlink(sanitized);
  }

  return { ok: true, detail: `Deleted: ${sanitized}` };
}

async function executeRead(target: string): Promise<CommandResult> {
  if (!checkPermission('fs.read', target)) {
    return { ok: false, detail: 'Permission denied' };
  }

  const sanitized = await sanitizePath(target);
  const content = await fs.readFile(sanitized, 'utf-8');

  return { ok: true, data: content };
}

async function executeWrite(target: string, content: string): Promise<CommandResult> {
  if (!checkPermission('fs.write', target)) {
    return { ok: false, detail: 'Permission denied' };
  }

  const sanitized = await sanitizePath(target);
  await fs.writeFile(sanitized, content, 'utf-8');

  return { ok: true, detail: `Written: ${sanitized}` };
}
