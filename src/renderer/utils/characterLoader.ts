import type { CharacterManifest, CharacterInfo } from '../../shared/types';

/**
 * Load character manifest from the character directory
 */
export async function loadCharacterManifest(
  characterId: string
): Promise<CharacterManifest> {
  try {
    // TODO: Implement actual loading via IPC
    // For now, return a default manifest structure
    throw new Error('Character manifest loading not yet implemented');

    // Future implementation:
    // const manifest = await window.character.getManifest(characterId);
    // return manifest;
  } catch (err) {
    console.error(`[CharacterLoader] Failed to load manifest for ${characterId}:`, err);
    throw err;
  }
}

/**
 * Validate character manifest structure
 */
export function validateCharacterManifest(manifest: any): manifest is CharacterManifest {
  if (!manifest || typeof manifest !== 'object') {
    return false;
  }

  const required = ['id', 'name', 'version', 'model', 'motions'];
  for (const field of required) {
    if (!(field in manifest)) {
      console.error(`[CharacterLoader] Missing required field: ${field}`);
      return false;
    }
  }

  // Validate model section
  if (!manifest.model.path || typeof manifest.model.path !== 'string') {
    console.error('[CharacterLoader] Invalid model.path');
    return false;
  }

  // Validate motions section
  if (typeof manifest.motions !== 'object') {
    console.error('[CharacterLoader] Invalid motions section');
    return false;
  }

  return true;
}

/**
 * Get the default character info
 */
export function getDefaultCharacter(): CharacterInfo {
  return {
    id: 'default',
    name: 'Default Maid',
    path: '',
    enabled: true,
  };
}
