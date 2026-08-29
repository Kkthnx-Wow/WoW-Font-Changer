use crate::wow_paths::{
    collect_extended_install_candidates, collect_install_candidates, is_flavor_folder,
    is_wow_base,
};
use serde::{Deserialize, Serialize};
use std::collections::{BTreeSet, HashSet};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use tokio::fs;

const BACKUP_DIR: &str = ".backup";
const APPLIED_MANIFEST: &str = ".applied";

/// WoW `Fonts/` overrides. Names are case-sensitive and the extension must be `.ttf`.
/// Latin `FRIZQT__.ttf` uses two underscores, Cyrillic `FRIZQT___CYR.ttf` uses three.
const FONT_TARGETS: &[(&str, &str, &str)] = &[
    ("combat", "skurri.ttf", "skurri_CYR.ttf"),
    ("chat", "ARIALN.ttf", "ARIALN_CYR.ttf"),
    ("mail", "MORPHEUS.ttf", "MORPHEUS_CYR.ttf"),
    ("quest", "FRIZQT__.ttf", "FRIZQT___CYR.ttf"),
];

const ALL_WOW_FONT_FILES_LATIN: &[&str] = &[
    "skurri.ttf",
    "ARIALN.ttf",
    "MORPHEUS.ttf",
    "FRIZQT__.ttf",
];

/// Extra locale font slots beyond Latin, see Blizzard FontOverrides and community guides.
const LOCALE_FONT_PACKS: &[(&str, &[&str])] = &[
    (
        "cyrillic",
        &[
            "skurri_CYR.ttf",
            "ARIALN_CYR.ttf",
            "MORPHEUS_CYR.ttf",
            "FRIZQT___CYR.ttf",
        ],
    ),
    (
        "korean",
        &[
            "2002.ttf",
            "2002B.ttf",
            "K_Damage.ttf",
            "K_Pagetext.ttf",
        ],
    ),
    (
        "chinese",
        &[
            "ARHei.ttf",
            "ARKai_C.ttf",
            "ARKai_T.ttf",
            "bHEI00M.ttf",
            "bHEI01B.ttf",
            "bKAI00M.ttf",
            "bLEI00D.ttf",
            "arheiuhk_bd.ttf",
        ],
    ),
];

/// Blizzard client flavor folders, see warcraft.wiki.gg "API LatestInterface".
/// Keys match the frontend `GameVersion` ids (camelCase).
const WOW_FLAVORS: &[(&str, &str)] = &[
    ("retail", "_retail_"),
    ("ptr", "_ptr_"),
    ("beta", "_beta_"),
    ("xptr", "_xptr_"),
    ("classic", "_classic_"),
    ("classicPtr", "_classic_ptr_"),
    ("classicBeta", "_classic_beta_"),
    ("classicTitan", "_classic_titan_"),
    ("anniversary", "_anniversary_"),
    ("era", "_classic_era_"),
    ("classicEraPtr", "_classic_era_ptr_"),
    ("classicEraBeta", "_classic_era_beta_"),
];

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectResult {
    pub base_path: Option<String>,
    pub retail: Option<String>,
    pub ptr: Option<String>,
    pub beta: Option<String>,
    pub xptr: Option<String>,
    pub classic: Option<String>,
    pub classic_ptr: Option<String>,
    pub classic_beta: Option<String>,
    pub classic_titan: Option<String>,
    pub anniversary: Option<String>,
    pub era: Option<String>,
    pub classic_era_ptr: Option<String>,
    pub classic_era_beta: Option<String>,
}

impl DetectResult {
    pub fn empty() -> Self {
        Self {
            base_path: None,
            retail: None,
            ptr: None,
            beta: None,
            xptr: None,
            classic: None,
            classic_ptr: None,
            classic_beta: None,
            classic_titan: None,
            anniversary: None,
            era: None,
            classic_era_ptr: None,
            classic_era_beta: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyResult {
    pub applied: Vec<String>,
    pub backup_dir: String,
    pub compressed_backup: Option<String>,
    pub slug_cache_cleared: u32,
}

fn is_slug_cache_file(name: &str) -> bool {
    let lower = name.to_ascii_lowercase();
    lower.ends_with(".slug") || lower.ends_with(".slugo")
}

fn file_locked_hint(raw_os_error: Option<i32>, message: &str) -> &'static str {
    let locked = match raw_os_error {
        #[cfg(windows)]
        Some(32) => true,
        #[cfg(unix)]
        Some(code) if code == 13 || code == 16 => true,
        _ => false,
    };

    if locked || message.contains("Access") || message.contains("Permission") {
        " Close WoW if it's running."
    } else {
        ""
    }
}

/// WoW's Slug GPU font cache, safe to delete since the client regenerates it on next launch.
async fn clear_slug_cache(fonts_dir: &Path) -> Result<u32, String> {
    let mut cleared = 0u32;
    let mut entries = fs::read_dir(fonts_dir)
        .await
        .map_err(|e| format!("Failed to read Fonts directory: {}", e))?;

    while let Some(entry) = entries
        .next_entry()
        .await
        .map_err(|e| format!("Failed to iterate Fonts directory: {}", e))?
    {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("");

        if is_slug_cache_file(name) {
            fs::remove_file(&path)
                .await
                .map_err(|e| format!("Failed to remove cache {}: {}", name, e))?;
            cleared += 1;
        }
    }

    Ok(cleared)
}

fn flavor_folder(base: &Path, flavor: &str) -> PathBuf {
    base.join(flavor)
}

fn flavor_folder_name(game_version: &str) -> Option<&'static str> {
    WOW_FLAVORS
        .iter()
        .find(|(id, _)| *id == game_version)
        .map(|(_, folder)| *folder)
}

fn resolve_flavor_path(wow_path: &str, game_version: &str) -> Result<PathBuf, String> {
    let path = PathBuf::from(wow_path);
    if !path.exists() {
        return Err(format!("WoW path does not exist: {}", wow_path));
    }

    let flavor = flavor_folder_name(game_version)
        .ok_or_else(|| format!("Unknown game version: {}", game_version))?;

    let flavor_path = if path.ends_with(flavor) || path.file_name().is_some_and(|n| n == flavor) {
        path
    } else {
        flavor_folder(&path, flavor)
    };

    if !flavor_path.exists() {
        return Err(format!(
            "Game flavor folder not found: {}",
            flavor_path.display()
        ));
    }

    Ok(flavor_path)
}

fn resolve_target_files(
    mappings: &[String],
    locale_packs: &[String],
) -> Result<Vec<String>, String> {
    let latin: Vec<&str> = if mappings.iter().any(|m| m == "all") {
        ALL_WOW_FONT_FILES_LATIN.to_vec()
    } else {
        let mut targets = HashSet::new();
        for mapping in mappings {
            let file = FONT_TARGETS
                .iter()
                .find(|(key, _, _)| key == &mapping.as_str())
                .map(|(_, latin, _)| *latin)
                .ok_or_else(|| format!("Unknown font mapping: {}", mapping))?;
            targets.insert(file);
        }

        if targets.is_empty() {
            return Err("No font targets selected".into());
        }

        FONT_TARGETS
            .iter()
            .filter_map(|(_, latin, _)| targets.get(latin).copied())
            .collect()
    };

    let mut files: Vec<String> = latin.iter().map(|f| (*f).to_string()).collect();

    for pack_id in locale_packs {
        let pack_files = LOCALE_FONT_PACKS
            .iter()
            .find(|(id, _)| *id == pack_id.as_str())
            .map(|(_, files)| *files)
            .ok_or_else(|| format!("Unknown locale pack: {}", pack_id))?;

        for file in pack_files {
            files.push((*file).to_string());
        }
    }

    Ok(files)
}

fn flavor_if_exists(base: &Path, folder: &str) -> Option<String> {
    let path = flavor_folder(base, folder);
    path.is_dir()
        .then(|| path.to_string_lossy().into_owned())
}

fn detect_flavors(base: &Path) -> DetectResult {
    DetectResult {
        base_path: Some(base.to_string_lossy().into_owned()),
        retail: flavor_if_exists(base, "_retail_"),
        ptr: flavor_if_exists(base, "_ptr_"),
        beta: flavor_if_exists(base, "_beta_"),
        xptr: flavor_if_exists(base, "_xptr_"),
        classic: flavor_if_exists(base, "_classic_"),
        classic_ptr: flavor_if_exists(base, "_classic_ptr_"),
        classic_beta: flavor_if_exists(base, "_classic_beta_"),
        classic_titan: flavor_if_exists(base, "_classic_titan_"),
        anniversary: flavor_if_exists(base, "_anniversary_"),
        era: flavor_if_exists(base, "_classic_era_"),
        classic_era_ptr: flavor_if_exists(base, "_classic_era_ptr_"),
        classic_era_beta: flavor_if_exists(base, "_classic_era_beta_"),
    }
}

pub fn detect_wow_path_sync() -> DetectResult {
    for candidate in collect_install_candidates()
        .into_iter()
        .chain(collect_extended_install_candidates())
    {
        if candidate.is_dir() && is_wow_base(&candidate) {
            return detect_flavors(&candidate);
        }
    }

    DetectResult::empty()
}

async fn ensure_backup(fonts_dir: &Path, backup_dir: &Path, target: &str) -> Result<(), String> {
    let source = fonts_dir.join(target);
    if !source.exists() {
        return Ok(());
    }

    fs::create_dir_all(backup_dir)
        .await
        .map_err(|e| format!("Failed to create backup directory: {}", e))?;

    let dest = backup_dir.join(target);
    if dest.exists() {
        return Ok(());
    }

    fs::copy(&source, &dest)
        .await
        .map_err(|e| format!("Failed to backup {}: {}", target, e))?;

    Ok(())
}

fn compress_backup_dir_sync(backup_dir: &Path) -> Result<String, String> {
    // Write the archive into the flavor root (the folder that holds Fonts/) so we
    // do not leave a stray zip sitting inside the directory WoW loads fonts from.
    let fonts_dir = backup_dir.parent().ok_or("Invalid backup path")?;
    let archive_dir = fonts_dir.parent().unwrap_or(fonts_dir);
    let zip_path = archive_dir.join(format!(
        "wow-fonts-backup-{}.zip",
        chrono_like_timestamp()
    ));

    let file = std::fs::File::create(&zip_path)
        .map_err(|e| format!("Failed to create zip archive: {}", e))?;

    let mut zip = zip::ZipWriter::new(file);
    let options = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    let entries = std::fs::read_dir(backup_dir)
        .map_err(|e| format!("Failed to read backup directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to iterate backup directory: {}", e))?;
        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .ok_or("Invalid backup file name")?;

        zip.start_file(name, options)
            .map_err(|e| format!("Failed to start zip entry: {}", e))?;

        let mut buffer = Vec::new();
        std::fs::File::open(&path)
            .and_then(|mut f| f.read_to_end(&mut buffer))
            .map_err(|e| format!("Failed to read backup file: {}", e))?;

        zip.write_all(&buffer)
            .map_err(|e| format!("Failed to write zip entry: {}", e))?;
    }

    zip.finish()
        .map_err(|e| format!("Failed to finalize zip archive: {}", e))?;

    Ok(zip_path.to_string_lossy().into_owned())
}

fn chrono_like_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs().to_string())
        .unwrap_or_else(|_| "0".into())
}

pub async fn apply_custom_font_async(
    wow_path: String,
    game_version: String,
    font_path: String,
    mappings: Vec<String>,
    locale_packs: Vec<String>,
    compress_backup: bool,
) -> Result<ApplyResult, String> {
    let flavor_path = resolve_flavor_path(&wow_path, &game_version)?;
    let source_font = PathBuf::from(&font_path);

    if !source_font.exists() {
        return Err(format!("Font file not found: {}", font_path));
    }

    let ext = source_font
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_ascii_lowercase())
        .unwrap_or_default();

    if ext != "ttf" && ext != "otf" {
        return Err("Font must be a .ttf or .otf file".into());
    }

    let fonts_dir = flavor_path.join("Fonts");
    fs::create_dir_all(&fonts_dir)
        .await
        .map_err(|e| format!("Failed to create Fonts directory: {}", e))?;

    let backup_dir = fonts_dir.join(BACKUP_DIR);
    let targets = resolve_target_files(&mappings, &locale_packs)?;
    let mut applied = Vec::new();

    for target in &targets {
        if !target.ends_with(".ttf") {
            return Err(format!("Invalid WoW font target name: {}", target));
        }

        ensure_backup(&fonts_dir, &backup_dir, target).await?;
        let dest = fonts_dir.join(target);
        // WoW requires the `.ttf` extension even when the source file is `.otf`.
        fs::copy(&source_font, &dest).await.map_err(|e| {
            let hint = file_locked_hint(e.raw_os_error(), &e.to_string());
            format!("Failed to apply font to {}{}: {}", target, hint, e)
        })?;
        applied.push(target.clone());
    }

    let slug_cache_cleared = clear_slug_cache(&fonts_dir).await?;

    // A default WoW install ships fonts inside CASC, so `Fonts/` is often empty
    // and no originals get backed up. Make sure the backup dir exists before we
    // record the manifest, otherwise applying to a clean install fails here.
    fs::create_dir_all(&backup_dir)
        .await
        .map_err(|e| format!("Failed to create backup directory: {}", e))?;

    // Accumulate the manifest across applies. Restore uses it to remove custom
    // fonts that were added where WoW had no original, so applying different
    // fonts to different slots one at a time must not forget earlier targets.
    let manifest_path = backup_dir.join(APPLIED_MANIFEST);
    let mut manifest_targets: std::collections::BTreeSet<String> = BTreeSet::new();
    if let Ok(existing) = fs::read_to_string(&manifest_path).await {
        for line in existing.lines() {
            let entry = line.trim();
            if !entry.is_empty() {
                manifest_targets.insert(entry.to_string());
            }
        }
    }
    manifest_targets.extend(applied.iter().cloned());
    let manifest_body = manifest_targets.into_iter().collect::<Vec<_>>().join("\n");

    fs::write(&manifest_path, manifest_body)
        .await
        .map_err(|e| format!("Failed to write apply manifest: {}", e))?;

    let compressed_backup = if compress_backup && backup_dir.exists() {
        let dir = backup_dir.clone();
        Some(
            tokio::task::spawn_blocking(move || compress_backup_dir_sync(&dir))
                .await
                .map_err(|e| format!("Backup compression failed: {}", e))??,
        )
    } else {
        None
    };

    Ok(ApplyResult {
        applied,
        backup_dir: backup_dir.to_string_lossy().into_owned(),
        compressed_backup,
        slug_cache_cleared,
    })
}

pub async fn restore_defaults_async(
    wow_path: String,
    game_version: String,
) -> Result<Vec<String>, String> {
    let flavor_path = resolve_flavor_path(&wow_path, &game_version)?;
    let fonts_dir = flavor_path.join("Fonts");
    let backup_dir = fonts_dir.join(BACKUP_DIR);

    if !backup_dir.exists() {
        return Err("No backup found. Nothing to restore.".into());
    }

    let mut restored = Vec::new();
    let mut restored_set = HashSet::new();
    let mut entries = fs::read_dir(&backup_dir)
        .await
        .map_err(|e| format!("Failed to read backup directory: {}", e))?;

    while let Some(entry) = entries
        .next_entry()
        .await
        .map_err(|e| format!("Failed to iterate backup directory: {}", e))?
    {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        let file_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .ok_or("Invalid backup file name")?
            .to_string();

        if file_name == APPLIED_MANIFEST {
            continue;
        }

        let dest = fonts_dir.join(&file_name);
        fs::copy(&path, &dest)
            .await
            .map_err(|e| format!("Failed to restore {}: {}", file_name, e))?;
        restored.push(file_name.clone());
        restored_set.insert(file_name);
    }

    let manifest_path = backup_dir.join(APPLIED_MANIFEST);
    if manifest_path.exists() {
        let manifest = fs::read_to_string(&manifest_path)
            .await
            .map_err(|e| format!("Failed to read apply manifest: {}", e))?;
        for line in manifest.lines() {
            let target = line.trim();
            if target.is_empty() || restored_set.contains(target) {
                continue;
            }
            let custom = fonts_dir.join(target);
            if custom.is_file() {
                fs::remove_file(&custom)
                    .await
                    .map_err(|e| format!("Failed to remove applied font {}: {}", target, e))?;
                restored.push(target.to_string());
            }
        }
    }

    let _ = clear_slug_cache(&fonts_dir).await?;

    Ok(restored)
}

pub async fn validate_wow_path_async(path: String) -> Result<DetectResult, String> {
    let base = PathBuf::from(&path);
    if !base.exists() {
        return Err("Selected path does not exist".into());
    }

    let base = if is_flavor_folder(&base) {
        base.parent()
            .map(PathBuf::from)
            .ok_or_else(|| "Invalid flavor folder path".to_string())?
    } else {
        base
    };

    if !is_wow_base(&base) {
        return Err("Not a valid World of Warcraft installation".into());
    }

    Ok(detect_flavors(&base))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn all_mapping_returns_every_latin_font() {
        let files = resolve_target_files(&["all".into()], &[]).unwrap();
        assert_eq!(files, ALL_WOW_FONT_FILES_LATIN);
    }

    #[test]
    fn single_mapping_resolves_to_one_file() {
        let files = resolve_target_files(&["quest".into()], &[]).unwrap();
        assert_eq!(files, vec!["FRIZQT__.ttf".to_string()]);
    }

    #[test]
    fn multiple_mappings_follow_declaration_order() {
        // Selection order should not matter, output follows FONT_TARGETS order.
        let files = resolve_target_files(&["chat".into(), "combat".into()], &[]).unwrap();
        assert_eq!(
            files,
            vec!["skurri.ttf".to_string(), "ARIALN.ttf".to_string()]
        );
    }

    #[test]
    fn locale_pack_appends_extra_font_slots() {
        let files = resolve_target_files(&["quest".into()], &["cyrillic".into()]).unwrap();
        assert_eq!(
            files,
            vec![
                "FRIZQT__.ttf".to_string(),
                "skurri_CYR.ttf".to_string(),
                "ARIALN_CYR.ttf".to_string(),
                "MORPHEUS_CYR.ttf".to_string(),
                "FRIZQT___CYR.ttf".to_string(),
            ]
        );
    }

    #[test]
    fn empty_selection_is_rejected() {
        assert!(resolve_target_files(&[], &[]).is_err());
    }

    #[test]
    fn unknown_mapping_and_pack_are_rejected() {
        assert!(resolve_target_files(&["bogus".into()], &[]).is_err());
        assert!(resolve_target_files(&["quest".into()], &["bogus".into()]).is_err());
    }

    #[test]
    fn flavor_folder_names_map_from_frontend_ids() {
        assert_eq!(flavor_folder_name("retail"), Some("_retail_"));
        assert_eq!(flavor_folder_name("era"), Some("_classic_era_"));
        assert_eq!(flavor_folder_name("bogus"), None);
    }

    #[test]
    fn slug_cache_files_are_detected_case_insensitively() {
        assert!(is_slug_cache_file("FRIZQT__.slug"));
        assert!(is_slug_cache_file("something.SLUGO"));
        assert!(!is_slug_cache_file("FRIZQT__.ttf"));
    }
}
