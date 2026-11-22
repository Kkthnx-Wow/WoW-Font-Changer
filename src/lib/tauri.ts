import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import type { ApplyResult, DetectResult, FontAssignment } from "../types";


export async function detectWowPath(): Promise<DetectResult> {
  return invoke<DetectResult>("detect_wow_path");
}

export async function validateWowPath(path: string): Promise<DetectResult> {
  return invoke<DetectResult>("validate_wow_path", { path });
}

export async function applyCustomFonts(
  wowPath: string,
  gameVersion: string,
  assignments: FontAssignment[],
  compressBackup: boolean,
): Promise<ApplyResult> {
  return invoke<ApplyResult>("apply_custom_fonts", {
    wowPath,
    gameVersion,
    assignments,
    compressBackup,
  });
}

export async function restoreDefaults(
  wowPath: string,
  gameVersion: string,
): Promise<string[]> {
  return invoke<string[]>("restore_defaults", { wowPath, gameVersion });
}

function isFontFile(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.endsWith(".ttf") || lower.endsWith(".otf");
}

/** Loaded preview faces by slot key ("main", "combat", ...). */
const previewFaces = new Map<string, FontFace>();
let previewSerial = 0;

/**
 * Load a font for preview under a fresh family name and return that name.
 * A new name per load means the webview can never show glyphs from the
 * previous file under the same family. Uses the asset protocol, so the font
 * bytes never cross IPC.
 */
export async function loadPreviewFont(path: string, key: string): Promise<string> {
  if (!isFontFile(path)) {
    throw new Error("Font must be a .ttf or .otf file");
  }

  // The asset scope starts empty. The backend checks the font header and
  // opens just this file. Its error text is already user readable.
  await invoke("allow_preview_font", { path });

  previewSerial += 1;
  const family = `wfc-${key}-${previewSerial}`;
  const face = new FontFace(family, `url("${convertFileSrc(path)}")`);
  try {
    await face.load();
  } catch {
    throw new Error(
      "Could not load font preview. The file may be invalid or inaccessible.",
    );
  }

  clearPreviewFont(key);
  document.fonts.add(face);
  previewFaces.set(key, face);
  return family;
}

/** Drop one preview face, or all of them when no key is given. */
export function clearPreviewFont(key?: string): void {
  const keys = key === undefined ? [...previewFaces.keys()] : [key];
  for (const k of keys) {
    const face = previewFaces.get(k);
    if (face) {
      document.fonts.delete(face);
      previewFaces.delete(k);
    }
  }
}
