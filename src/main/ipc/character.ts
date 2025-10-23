import { app, ipcMain } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import type { CharacterInfo, CharacterManifest } from '../../shared/types';

/**
 * Get the path to the characters directory
 */
function getCharactersDir(): string {
  return path.join(app.getPath('userData'), 'characters');
}

/**
 * Get development model directory (for testing)
 */
function getDevModelDir(): string {
  // In development, models can be in STM/model/
  return path.join(process.cwd(), 'model');
}

/**
 * Load character manifest from disk
 * Tries userData first, then falls back to dev model directory
 */
export async function loadCharacterManifest(characterId: string): Promise<CharacterManifest> {
  // Try production path first
  const prodPath = path.join(getCharactersDir(), characterId, 'character.json');

  // Try development path as fallback
  const devPath = path.join(getDevModelDir(), characterId, 'runtime', 'character.json');

  let manifestPath = prodPath;
  let content: string;

  try {
    content = await fs.readFile(prodPath, 'utf-8');
    console.log(`[character] Loaded from production: ${prodPath}`);
  } catch {
    try {
      content = await fs.readFile(devPath, 'utf-8');
      manifestPath = devPath;
      console.log(`[character] Loaded from dev: ${devPath}`);
    } catch (err: any) {
      throw new Error(
        `Failed to load character manifest from ${prodPath} or ${devPath}: ${err.message}`
      );
    }
  }

  const manifest = JSON.parse(content) as CharacterManifest;

  // Store the base path for resource resolution
  (manifest as any)._basePath = path.dirname(manifestPath);

  return manifest;
}

/**
 * List all available characters
 */
export async function listCharacters(): Promise<CharacterInfo[]> {
  const charactersDir = getCharactersDir();

  try {
    // Ensure directory exists
    await fs.mkdir(charactersDir, { recursive: true });

    const entries = await fs.readdir(charactersDir, { withFileTypes: true });
    const characters: CharacterInfo[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      try {
        const manifest = await loadCharacterManifest(entry.name);
        characters.push({
          id: manifest.id,
          name: manifest.name,
          path: path.join(charactersDir, entry.name),
          enabled: true,
        });
      } catch (err) {
        console.error(`[character] Failed to load ${entry.name}:`, err);
      }
    }

    return characters;
  } catch (err: any) {
    console.error('[character] Failed to list characters:', err);
    return [];
  }
}

/**
 * Get the full file URL for a model or resource
 * Tries both production and dev paths
 * Returns file:// URL ready for use in renderer
 *
 * Examples:
 *   Windows: D:\STM\model\... -> file:///D:/STM/model/...
 *   macOS/Linux: /path/to/... -> file:///path/to/...
 */
export async function getCharacterResourcePath(
  characterId: string,
  relativePath: string
): Promise<string> {
  // Try production path
  const prodPath = path.join(getCharactersDir(), characterId, relativePath);

  // Try development path
  const devPath = path.join(getDevModelDir(), characterId, 'runtime', relativePath);

  const candidatePaths = [
    { path: prodPath, label: 'production' },
    { path: devPath, label: 'dev' },
  ];

  let finalPath: string | null = null;

  for (const candidate of candidatePaths) {
    try {
      await fs.access(candidate.path);
      console.log(`[character] Using ${candidate.label} path:`, candidate.path);
      finalPath = candidate.path;
      break;
    } catch {
      // Try next candidate
    }
  }

  if (!finalPath) {
    console.error('[character] File not found in any known path:', { prodPath, devPath });
    // Fall back to dev path so renderer can surface detailed error later
    finalPath = devPath;
  }

  // Convert to file:// URL using Node.js pathToFileURL
  // This handles all platform-specific edge cases correctly
  const fileUrl = pathToFileURL(finalPath).toString();
  console.log('[character] Converted to file URL:', fileUrl);

  return fileUrl;
}

/**
 * Register character-related IPC handlers
 */
export function registerCharacterHandlers(): void {
  // Get character manifest
  ipcMain.handle('character.getManifest', async (_, characterId: string) => {
    return await loadCharacterManifest(characterId);
  });

  // List all characters
  ipcMain.handle('character.list', async () => {
    return await listCharacters();
  });

  // Get resource path (for loading model files)
  ipcMain.handle(
    'character.getResourcePath',
    async (_, characterId: string, relativePath: string) => {
      return await getCharacterResourcePath(characterId, relativePath);
    }
  );

  console.log('[character] IPC handlers registered');
}
