import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import type { ApplyResult, DetectResult, FontAssignment } from "../types";

const PREVIEW_FAMILY = "WoWFontPreview";
let activePreviewFace: FontFace | null = null;

export async function detectWowPath(): Promise<DetectResult> {
  return invoke<DetectResult>("detect_wow_path");
}

export async function validateWowPath(path: string): Promise<DetectResult> {
  return invoke<DetectResult>("validate_wow_path", { path });
}

export async function applyCustomFont(
  wowPath: string,
  gameVersion: string,
  fontPath: string,
  mappings: string[],
  localePacks: string[],
  compressBackup: boolean,
): Promise<ApplyResult> {
  return invoke<ApplyResult>("apply_custom_font", {
    wowPath,
    gameVersion,
    fontPath,
    mappings,
    localePacks,
    compressBackup,
  });
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

/** Load font via asset URL for zero IPC byte transfer on preview. */
export async function loadPreviewFont(path: string): Promise<string> {
  if (!isFontFile(path)) {
    throw new Error("Font must be a .ttf or .otf file");
  }

  if (activePreviewFace) {
    document.fonts.delete(activePreviewFace);
    activePreviewFace = null;
  }

  const url = convertFileSrc(path);
  const face = new FontFace(PREVIEW_FAMILY, `url("${url}")`);
  try {
    await face.load();
  } catch {
    throw new Error(
      "Could not load font preview. The file may be invalid or inaccessible.",
    );
  }
  document.fonts.add(face);
  activePreviewFace = face;
  return PREVIEW_FAMILY;
}

export function clearPreviewFont(): void {
  if (activePreviewFace) {
    document.fonts.delete(activePreviewFace);
    activePreviewFace = null;
  }
}
