use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use tokio::fs;

const BACKUP_DIR: &str = ".backup";

/// WoW `Fonts/` overrides — names are case-sensitive; extension must be `.ttf`.
/// Latin `FRIZQT__.ttf` uses two underscores; Cyrillic `FRIZQT___CYR.ttf` uses three.
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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectResult {
    pub base_path: Option<String>,
    pub retail: Option<String>,
    pub classic: Option<String>,
    pub era: Option<String>,
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

/// WoW's Slug GPU font cache — safe to delete; the client regenerates on next launch.
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

fn resolve_flavor_path(wow_path: &str, game_version: &str) -> Result<PathBuf, String> {
    let path = PathBuf::from(wow_path);
    if !path.exists() {
        return Err(format!("WoW path does not exist: {}", wow_path));
    }

    let flavor = match game_version {
        "retail" => "_retail_",
        "classic" => "_classic_",
        "era" => "_classic_era_",
        _ => return Err(format!("Unknown game version: {}", game_version)),
    };

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
    include_cyrillic: bool,
) -> Result<Vec<&'static str>, String> {
    let latin: Vec<&'static str> = if mappings.iter().any(|m| m == "all") {
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

    if !include_cyrillic {
        return Ok(latin);
    }

    let mut files = Vec::with_capacity(latin.len() * 2);
    for latin_file in latin {
        files.push(latin_file);
        let cyr = FONT_TARGETS
            .iter()
            .find(|(_, lat, _)| *lat == latin_file)
            .map(|(_, _, cyr)| *cyr)
            .ok_or_else(|| format!("Missing Cyrillic pair for {}", latin_file))?;
        files.push(cyr);
    }

    Ok(files)
}

#[cfg(windows)]
fn read_registry_install_path() -> Option<PathBuf> {
    use winreg::enums::*;
    use winreg::RegKey;

    let keys = [
        (
            HKEY_LOCAL_MACHINE,
            r"SOFTWARE\WOW6432Node\Blizzard Entertainment\World of Warcraft",
        ),
        (
            HKEY_LOCAL_MACHINE,
            r"SOFTWARE\Blizzard Entertainment\World of Warcraft",
        ),
        (
            HKEY_CURRENT_USER,
            r"SOFTWARE\Blizzard Entertainment\World of Warcraft",
        ),
    ];

    for (hive, subkey) in keys {
        if let Ok(key) = RegKey::predef(hive).open_subkey(subkey) {
            if let Ok(path) = key.get_value::<String, _>("InstallPath") {
                let trimmed = path.trim().to_string();
                if !trimmed.is_empty() {
                    return Some(PathBuf::from(trimmed));
                }
            }
        }
    }

    None
}

#[cfg(not(windows))]
fn read_registry_install_path() -> Option<PathBuf> {
    None
}

fn common_install_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();

    #[cfg(windows)]
    {
        if let Ok(pf) = std::env::var("ProgramFiles(x86)") {
            paths.push(PathBuf::from(pf).join("World of Warcraft"));
        }
        if let Ok(pf) = std::env::var("ProgramFiles") {
            paths.push(PathBuf::from(pf).join("World of Warcraft"));
        }
        paths.push(PathBuf::from(r"C:\Games\World of Warcraft"));
    }

    #[cfg(target_os = "macos")]
    {
        paths.push(PathBuf::from("/Applications/World of Warcraft"));
        if let Ok(home) = std::env::var("HOME") {
            paths.push(PathBuf::from(home).join("Applications/World of Warcraft"));
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(home) = std::env::var("HOME") {
            paths.push(
                PathBuf::from(home)
                    .join(".local/share/Steam/steamapps/common/World of Warcraft"),
            );
        }
    }

    paths
}

fn detect_flavors(base: &Path) -> DetectResult {
    let retail = flavor_folder(base, "_retail_");
    let classic = flavor_folder(base, "_classic_");
    let era = flavor_folder(base, "_classic_era_");

    DetectResult {
        base_path: Some(base.to_string_lossy().into_owned()),
        retail: retail.exists().then(|| retail.to_string_lossy().into_owned()),
        classic: classic.exists().then(|| classic.to_string_lossy().into_owned()),
        era: era.exists().then(|| era.to_string_lossy().into_owned()),
    }
}

pub fn detect_wow_path_sync() -> DetectResult {
    if let Some(base) = read_registry_install_path() {
        if base.exists() {
            return detect_flavors(&base);
        }
    }

    for candidate in common_install_paths() {
        if candidate.exists() {
            return detect_flavors(&candidate);
        }
    }

    DetectResult {
        base_path: None,
        retail: None,
        classic: None,
        era: None,
    }
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
    let zip_path = backup_dir
        .parent()
        .ok_or("Invalid backup path")?
        .join(format!(
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
    include_cyrillic: bool,
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
    let targets = resolve_target_files(&mappings, include_cyrillic)?;
    let mut applied = Vec::new();

    for target in &targets {
        if !target.ends_with(".ttf") {
            return Err(format!("Invalid WoW font target name: {}", target));
        }

        ensure_backup(&fonts_dir, &backup_dir, target).await?;
        let dest = fonts_dir.join(target);
        // WoW requires the `.ttf` extension even when the source file is `.otf`.
        fs::copy(&source_font, &dest)
            .await
            .map_err(|e| {
                let hint = if e.raw_os_error() == Some(32) || e.to_string().contains("Access") {
                    " Close WoW if it's running."
                } else {
                    ""
                };
                format!("Failed to apply font to {}{}: {}", target, hint, e)
            })?;
        applied.push((*target).into());
    }

    let slug_cache_cleared = clear_slug_cache(&fonts_dir).await?;

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

        let dest = fonts_dir.join(&file_name);
        fs::copy(&path, &dest)
            .await
            .map_err(|e| format!("Failed to restore {}: {}", file_name, e))?;
        restored.push(file_name);
    }

    let _ = clear_slug_cache(&fonts_dir).await?;

    Ok(restored)
}

pub async fn validate_wow_path_async(path: String) -> Result<DetectResult, String> {
    let base = PathBuf::from(&path);
    if !base.exists() {
        return Err("Selected path does not exist".into());
    }

    if base.ends_with("_retail_") || base.ends_with("_classic_") || base.ends_with("_classic_era_") {
        if let Some(parent) = base.parent() {
            return Ok(detect_flavors(parent));
        }
    }

    Ok(detect_flavors(&base))
}
