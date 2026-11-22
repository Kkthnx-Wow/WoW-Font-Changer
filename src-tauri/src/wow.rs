use crate::wow_paths::{
    collect_extended_install_candidates, collect_install_candidates, normalize_to_wow_base,
    is_wow_base, WOW_FLAVORS,
};
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::io::Read;
use std::path::{Path, PathBuf};
use tokio::fs;

const BACKUP_DIR: &str = ".backup";
const APPLIED_MANIFEST: &str = ".applied";

/// WoW `Fonts/` overrides. Names are case-sensitive and the extension must be `.ttf`.
/// Latin `FRIZQT__.ttf` uses two underscores, Cyrillic `FRIZQT___CYR.ttf` uses three.
const FONT_TARGETS: &[(&str, &str)] = &[
    ("combat", "skurri.ttf"),
    ("chat", "ARIALN.ttf"),
    ("mail", "MORPHEUS.ttf"),
    ("quest", "FRIZQT__.ttf"),
];

/// Extra locale font slots beyond Latin.
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
        &["2002.ttf", "2002B.ttf", "K_Damage.ttf", "K_Pagetext.ttf"],
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

/// Install base plus every flavor folder found in it, keyed by frontend id.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectResult {
    pub base_path: Option<String>,
    pub flavors: BTreeMap<String, String>,
}

impl DetectResult {
    pub fn empty() -> Self {
        Self::default()
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

/// One font paired with the slots it should fill. A plain single-font apply is
/// one assignment, per-slot mode sends several.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FontAssignment {
    pub font_path: String,
    pub mappings: Vec<String>,
    #[serde(default)]
    pub locale_packs: Vec<String>,
}

fn is_slug_cache_file(name: &str) -> bool {
    let lower = name.to_ascii_lowercase();
    lower.ends_with(".slug") || lower.ends_with(".slugo")
}

fn file_locked_hint(raw_os_error: Option<i32>, message: &str) -> &'static str {
    let locked = match raw_os_error {
        #[cfg(windows)]
        Some(5) | Some(32) | Some(33) => true,
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

/// WoW's Slug GPU font cache. Safe to delete, the client rebuilds it on launch.
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
        let is_file = entry.file_type().await.map(|t| t.is_file()).unwrap_or(false);
        let name = entry.file_name();
        let Some(name) = name.to_str() else { continue };
        if !is_file || !is_slug_cache_file(name) {
            continue;
        }

        fs::remove_file(entry.path()).await.map_err(|e| {
            let hint = file_locked_hint(e.raw_os_error(), &e.to_string());
            format!("Failed to remove cache {}{}: {}", name, hint, e)
        })?;
        cleared += 1;
    }

    Ok(cleared)
}

fn flavor_folder_name(game_version: &str) -> Option<&'static str> {
    WOW_FLAVORS
        .iter()
        .find(|(id, _)| *id == game_version)
        .map(|(_, folder)| *folder)
}

fn resolve_flavor_path(wow_path: &str, game_version: &str) -> Result<PathBuf, String> {
    let path = PathBuf::from(wow_path);
    if !path.is_dir() {
        return Err(format!("WoW path does not exist: {}", wow_path));
    }

    let flavor = flavor_folder_name(game_version)
        .ok_or_else(|| format!("Unknown game version: {}", game_version))?;

    let flavor_path = if path.file_name().is_some_and(|n| n == flavor) {
        path
    } else {
        path.join(flavor)
    };

    if !flavor_path.is_dir() {
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
    let wanted: BTreeSet<&str> = if mappings.iter().any(|m| m == "all") {
        FONT_TARGETS.iter().map(|(key, _)| *key).collect()
    } else {
        let mut keys = BTreeSet::new();
        for mapping in mappings {
            let key = FONT_TARGETS
                .iter()
                .find(|(key, _)| *key == mapping.as_str())
                .map(|(key, _)| *key)
                .ok_or_else(|| format!("Unknown font mapping: {}", mapping))?;
            keys.insert(key);
        }
        keys
    };

    // Output follows FONT_TARGETS order regardless of selection order.
    let mut files: Vec<String> = FONT_TARGETS
        .iter()
        .filter(|(key, _)| wanted.contains(key))
        .map(|(_, file)| (*file).to_string())
        .collect();

    for pack_id in locale_packs {
        let pack_files = LOCALE_FONT_PACKS
            .iter()
            .find(|(id, _)| *id == pack_id.as_str())
            .map(|(_, files)| *files)
            .ok_or_else(|| format!("Unknown locale pack: {}", pack_id))?;
        files.extend(pack_files.iter().map(|f| (*f).to_string()));
    }

    // A locale-only selection (no Latin slot) is valid, selecting nothing is not.
    if files.is_empty() {
        return Err("No font targets selected".into());
    }

    Ok(files)
}

fn detect_flavors(base: &Path) -> DetectResult {
    let flavors = WOW_FLAVORS
        .iter()
        .filter_map(|(id, folder)| {
            let path = base.join(folder);
            path.is_dir()
                .then(|| ((*id).to_string(), path.to_string_lossy().into_owned()))
        })
        .collect();

    DetectResult {
        base_path: Some(base.to_string_lossy().into_owned()),
        flavors,
    }
}

pub fn detect_wow_path_sync() -> DetectResult {
    collect_install_candidates()
        .into_iter()
        .chain(collect_extended_install_candidates())
        .find(|candidate| candidate.is_dir() && is_wow_base(candidate))
        .map(|base| detect_flavors(&base))
        .unwrap_or_default()
}

/// Check the first bytes, not just the extension. WoW only loads TrueType or
/// CFF OpenType outlines, and a renamed WOFF or a collection fails silently
/// in game, which looks like the app did nothing.
fn check_font_header(header: &[u8]) -> Result<(), String> {
    match header {
        [0x00, 0x01, 0x00, 0x00, ..] | [b't', b'r', b'u', b'e', ..] | [b'O', b'T', b'T', b'O', ..] => {
            Ok(())
        }
        [b't', b't', b'c', b'f', ..] => Err(
            "Font collections (.ttc) are not supported. Extract a single font first.".into(),
        ),
        [b'w', b'O', b'F', b'F', ..] | [b'w', b'O', b'F', b'2', ..] => Err(
            "This is a web font (WOFF) with a .ttf or .otf name. Convert it to TrueType first."
                .into(),
        ),
        _ => Err("File is not a valid TrueType or OpenType font".into()),
    }
}

/// Validate a user-picked font by extension and header. Shared by apply and
/// by the preview command that opens asset access to the file.
pub fn validate_font_source(font_path: &str) -> Result<PathBuf, String> {
    let source_font = PathBuf::from(font_path);
    if !source_font.is_file() {
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

    let mut header = [0u8; 4];
    std::fs::File::open(&source_font)
        .and_then(|mut f| f.read_exact(&mut header))
        .map_err(|e| format!("Could not read font file: {}", e))?;
    check_font_header(&header)?;

    Ok(source_font)
}

/// Map every selected target to the font that should fill it. Later assignments
/// win when two of them name the same slot.
fn build_apply_plan(assignments: &[FontAssignment]) -> Result<BTreeMap<String, PathBuf>, String> {
    let mut plan: BTreeMap<String, PathBuf> = BTreeMap::new();

    for assignment in assignments {
        let source_font = validate_font_source(&assignment.font_path)?;
        for target in resolve_target_files(&assignment.mappings, &assignment.locale_packs)? {
            plan.insert(target, source_font.clone());
        }
    }

    if plan.is_empty() {
        return Err("No font targets selected".into());
    }

    Ok(plan)
}

/// Copy the current file at `target` into the backup folder, once. The first
/// backup is the original, later applies must not overwrite it.
async fn ensure_backup(fonts_dir: &Path, backup_dir: &Path, target: &str) -> Result<(), String> {
    let source = fonts_dir.join(target);
    let dest = backup_dir.join(target);
    if !source.is_file() || dest.exists() {
        return Ok(());
    }

    fs::copy(&source, &dest)
        .await
        .map(|_| ())
        .map_err(|e| format!("Failed to back up {}: {}", target, e))
}

async fn read_manifest(manifest_path: &Path) -> BTreeSet<String> {
    match fs::read_to_string(manifest_path).await {
        Ok(body) => body
            .lines()
            .map(str::trim)
            .filter(|line| !line.is_empty())
            .map(str::to_string)
            .collect(),
        Err(_) => BTreeSet::new(),
    }
}

/// Write bytes to a temp file next to the target, then rename over it, so the
/// game never sees a half-written font if the app is interrupted.
async fn write_replace(fonts_dir: &Path, target: &str, bytes: &[u8]) -> Result<(), String> {
    let dest = fonts_dir.join(target);
    let tmp = fonts_dir.join(format!(".{}.tmp", target));

    let result = async {
        fs::write(&tmp, bytes).await?;
        fs::rename(&tmp, &dest).await
    }
    .await;

    result.map_err(|e| {
        // Best effort, the temp file is ours and never read by the game.
        let _ = std::fs::remove_file(&tmp);
        let hint = file_locked_hint(e.raw_os_error(), &e.to_string());
        format!("Failed to apply font to {}{}: {}", target, hint, e)
    })
}

pub async fn apply_font_assignments_async(
    wow_path: String,
    game_version: String,
    assignments: Vec<FontAssignment>,
    compress_backup: bool,
) -> Result<ApplyResult, String> {
    let flavor_path = resolve_flavor_path(&wow_path, &game_version)?;
    let plan = build_apply_plan(&assignments)?;

    let fonts_dir = flavor_path.join("Fonts");
    let backup_dir = fonts_dir.join(BACKUP_DIR);
    // A default install ships fonts inside CASC, so `Fonts/` may not exist yet.
    fs::create_dir_all(&backup_dir)
        .await
        .map_err(|e| format!("Failed to create backup directory: {}", e))?;

    // Back up every original before the first write, so a failure part way
    // through never leaves an original without a copy.
    for target in plan.keys() {
        ensure_backup(&fonts_dir, &backup_dir, target).await?;
    }

    // Record targets before writing. Restore deletes a listed target only when
    // it has no backup, so listing one that never got written is harmless,
    // while missing one that did would strand a custom font.
    let manifest_path = backup_dir.join(APPLIED_MANIFEST);
    let mut manifest = read_manifest(&manifest_path).await;
    manifest.extend(plan.keys().cloned());
    fs::write(
        &manifest_path,
        manifest.into_iter().collect::<Vec<_>>().join("\n"),
    )
    .await
    .map_err(|e| format!("Failed to write apply manifest: {}", e))?;

    // Read each distinct source once, even when it fills many slots.
    let mut sources: HashMap<&Path, Vec<u8>> = HashMap::new();
    let mut applied = Vec::with_capacity(plan.len());
    for (target, source_font) in &plan {
        if !sources.contains_key(source_font.as_path()) {
            let bytes = fs::read(source_font)
                .await
                .map_err(|e| format!("Failed to read {}: {}", source_font.display(), e))?;
            sources.insert(source_font.as_path(), bytes);
        }
        // WoW requires the `.ttf` name even when the source is CFF OpenType.
        write_replace(&fonts_dir, target, &sources[source_font.as_path()]).await?;
        applied.push(target.clone());
    }

    let slug_cache_cleared = clear_slug_cache(&fonts_dir).await?;

    let compressed_backup = if compress_backup {
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

fn compress_backup_dir_sync(backup_dir: &Path) -> Result<String, String> {
    use std::io::Write;

    // Write the archive into the flavor root (the folder that holds Fonts/) so
    // no stray zip sits inside the directory WoW loads fonts from.
    let fonts_dir = backup_dir.parent().ok_or("Invalid backup path")?;
    let archive_dir = fonts_dir.parent().unwrap_or(fonts_dir);
    let stamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let zip_path = archive_dir.join(format!("wow-fonts-backup-{}.zip", stamp));

    let file = std::fs::File::create(&zip_path)
        .map_err(|e| format!("Failed to create zip archive: {}", e))?;
    let mut zip = zip::ZipWriter::new(file);
    let options = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    let entries = std::fs::read_dir(backup_dir)
        .map_err(|e| format!("Failed to read backup directory: {}", e))?;
    for entry in entries {
        let path = entry
            .map_err(|e| format!("Failed to iterate backup directory: {}", e))?
            .path();
        if !path.is_file() {
            continue;
        }
        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .ok_or("Invalid backup file name")?;

        zip.start_file(name, options)
            .map_err(|e| format!("Failed to start zip entry: {}", e))?;
        let bytes =
            std::fs::read(&path).map_err(|e| format!("Failed to read backup file: {}", e))?;
        zip.write_all(&bytes)
            .map_err(|e| format!("Failed to write zip entry: {}", e))?;
    }

    zip.finish()
        .map_err(|e| format!("Failed to finalize zip archive: {}", e))?;

    Ok(zip_path.to_string_lossy().into_owned())
}

pub async fn restore_defaults_async(
    wow_path: String,
    game_version: String,
) -> Result<Vec<String>, String> {
    let flavor_path = resolve_flavor_path(&wow_path, &game_version)?;
    let fonts_dir = flavor_path.join("Fonts");
    let backup_dir = fonts_dir.join(BACKUP_DIR);

    // Nothing was ever applied here. The UI reports this as "nothing to restore".
    if !backup_dir.is_dir() {
        return Ok(Vec::new());
    }

    let mut restored = Vec::new();
    let mut backed_up = BTreeSet::new();
    let mut entries = fs::read_dir(&backup_dir)
        .await
        .map_err(|e| format!("Failed to read backup directory: {}", e))?;

    while let Some(entry) = entries
        .next_entry()
        .await
        .map_err(|e| format!("Failed to iterate backup directory: {}", e))?
    {
        let is_file = entry.file_type().await.map(|t| t.is_file()).unwrap_or(false);
        let Some(file_name) = entry.file_name().to_str().map(str::to_string) else {
            continue;
        };
        if !is_file || file_name == APPLIED_MANIFEST {
            continue;
        }

        let bytes = fs::read(entry.path())
            .await
            .map_err(|e| format!("Failed to read backup of {}: {}", file_name, e))?;
        write_replace(&fonts_dir, &file_name, &bytes).await?;
        restored.push(file_name.clone());
        backed_up.insert(file_name);
    }

    // Targets that had no original were added by us, so remove them.
    for target in read_manifest(&backup_dir.join(APPLIED_MANIFEST)).await {
        if backed_up.contains(&target) {
            continue;
        }
        let custom = fonts_dir.join(&target);
        if custom.is_file() {
            fs::remove_file(&custom).await.map_err(|e| {
                let hint = file_locked_hint(e.raw_os_error(), &e.to_string());
                format!("Failed to remove applied font {}{}: {}", target, hint, e)
            })?;
            restored.push(target);
        }
    }

    clear_slug_cache(&fonts_dir).await?;

    // Every original is back in place, so the backup has done its job. Keeping
    // it would make a later restore undo fonts the player added by hand.
    fs::remove_dir_all(&backup_dir)
        .await
        .map_err(|e| format!("Restored, but could not remove the backup folder: {}", e))?;

    Ok(restored)
}

pub async fn validate_wow_path_async(path: String) -> Result<DetectResult, String> {
    let base = PathBuf::from(&path);
    if !base.is_dir() {
        return Err("Selected path does not exist".into());
    }

    let base = normalize_to_wow_base(base);
    if !is_wow_base(&base) {
        return Err("Not a valid World of Warcraft installation".into());
    }

    Ok(detect_flavors(&base))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A temp folder that cleans itself up, unique per test name and process.
    struct TempDir(PathBuf);

    impl TempDir {
        fn new(name: &str) -> Self {
            let dir = std::env::temp_dir().join(format!("wfc_{}_{}", name, std::process::id()));
            let _ = std::fs::remove_dir_all(&dir);
            std::fs::create_dir_all(&dir).unwrap();
            Self(dir)
        }
    }

    impl Drop for TempDir {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }

    const TTF: &[u8] = &[0x00, 0x01, 0x00, 0x00, 1, 2, 3];

    fn font(dir: &Path, name: &str, body: &[u8]) -> PathBuf {
        let path = dir.join(name);
        std::fs::write(&path, body).unwrap();
        path
    }

    fn rt() -> tokio::runtime::Runtime {
        tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap()
    }

    #[test]
    fn all_mapping_returns_every_latin_font() {
        let files = resolve_target_files(&["all".into()], &[]).unwrap();
        assert_eq!(files, ["skurri.ttf", "ARIALN.ttf", "MORPHEUS.ttf", "FRIZQT__.ttf"]);
    }

    #[test]
    fn single_mapping_resolves_to_one_file() {
        let files = resolve_target_files(&["quest".into()], &[]).unwrap();
        assert_eq!(files, ["FRIZQT__.ttf"]);
    }

    #[test]
    fn multiple_mappings_follow_declaration_order() {
        let files = resolve_target_files(&["chat".into(), "combat".into()], &[]).unwrap();
        assert_eq!(files, ["skurri.ttf", "ARIALN.ttf"]);
    }

    #[test]
    fn locale_pack_appends_extra_font_slots() {
        let files = resolve_target_files(&["quest".into()], &["cyrillic".into()]).unwrap();
        assert_eq!(
            files,
            [
                "FRIZQT__.ttf",
                "skurri_CYR.ttf",
                "ARIALN_CYR.ttf",
                "MORPHEUS_CYR.ttf",
                "FRIZQT___CYR.ttf",
            ]
        );
    }

    #[test]
    fn empty_selection_is_rejected() {
        assert!(resolve_target_files(&[], &[]).is_err());
    }

    #[test]
    fn locale_only_selection_is_allowed() {
        let files = resolve_target_files(&[], &["korean".into()]).unwrap();
        assert_eq!(files, ["2002.ttf", "2002B.ttf", "K_Damage.ttf", "K_Pagetext.ttf"]);
    }

    #[test]
    fn unknown_mapping_and_pack_are_rejected() {
        assert!(resolve_target_files(&["bogus".into()], &[]).is_err());
        assert!(resolve_target_files(&["quest".into()], &["bogus".into()]).is_err());
    }

    #[test]
    fn apply_plan_maps_each_slot_to_its_font() {
        let tmp = TempDir::new("plan");
        let font_a = font(&tmp.0, "a.ttf", TTF);
        let font_b = font(&tmp.0, "b.otf", b"OTTO....");

        let plan = build_apply_plan(&[
            FontAssignment {
                font_path: font_a.to_string_lossy().into_owned(),
                mappings: vec!["combat".into()],
                locale_packs: vec![],
            },
            FontAssignment {
                font_path: font_b.to_string_lossy().into_owned(),
                mappings: vec!["quest".into()],
                locale_packs: vec![],
            },
        ])
        .unwrap();

        assert_eq!(plan.get("skurri.ttf"), Some(&font_a));
        assert_eq!(plan.get("FRIZQT__.ttf"), Some(&font_b));
    }

    #[test]
    fn apply_plan_lets_a_later_assignment_win_the_same_slot() {
        let tmp = TempDir::new("plan_win");
        let font_a = font(&tmp.0, "a.ttf", TTF);
        let font_b = font(&tmp.0, "b.ttf", TTF);

        let plan = build_apply_plan(&[
            FontAssignment {
                font_path: font_a.to_string_lossy().into_owned(),
                mappings: vec!["all".into()],
                locale_packs: vec![],
            },
            FontAssignment {
                font_path: font_b.to_string_lossy().into_owned(),
                mappings: vec!["quest".into()],
                locale_packs: vec![],
            },
        ])
        .unwrap();

        assert_eq!(plan.get("FRIZQT__.ttf"), Some(&font_b));
        assert_eq!(plan.get("skurri.ttf"), Some(&font_a));
    }

    #[test]
    fn font_headers_are_checked() {
        assert!(check_font_header(&[0x00, 0x01, 0x00, 0x00]).is_ok());
        assert!(check_font_header(b"true").is_ok());
        assert!(check_font_header(b"OTTO").is_ok());
        assert!(check_font_header(b"ttcf").is_err());
        assert!(check_font_header(b"wOF2").is_err());
        assert!(check_font_header(b"<htm").is_err());
        assert!(check_font_header(b"").is_err());
    }

    #[test]
    fn renamed_web_font_is_rejected_before_apply() {
        let tmp = TempDir::new("woff");
        let fake = font(&tmp.0, "fake.ttf", b"wOFFxxxx");
        assert!(validate_font_source(&fake.to_string_lossy()).is_err());
    }

    #[test]
    fn flavor_folder_names_map_from_frontend_ids() {
        assert_eq!(flavor_folder_name("retail"), Some("_retail_"));
        assert_eq!(flavor_folder_name("forever"), Some("_forever_"));
        assert_eq!(flavor_folder_name("era"), Some("_classic_era_"));
        assert_eq!(flavor_folder_name("bogus"), None);
    }

    #[test]
    fn detect_lists_only_installed_flavors() {
        let tmp = TempDir::new("detect");
        std::fs::create_dir_all(tmp.0.join("_retail_")).unwrap();
        std::fs::create_dir_all(tmp.0.join("_forever_")).unwrap();

        let result = detect_flavors(&tmp.0);
        assert_eq!(result.flavors.len(), 2);
        assert!(result.flavors.contains_key("retail"));
        assert!(result.flavors.contains_key("forever"));
    }

    #[test]
    fn slug_cache_files_are_detected_case_insensitively() {
        assert!(is_slug_cache_file("FRIZQT__.slug"));
        assert!(is_slug_cache_file("something.SLUGO"));
        assert!(!is_slug_cache_file("FRIZQT__.ttf"));
    }

    #[test]
    fn apply_then_restore_returns_fonts_folder_to_original_state() {
        let tmp = TempDir::new("roundtrip");
        let base = tmp.0.join("World of Warcraft");
        let fonts = base.join("_forever_").join("Fonts");
        std::fs::create_dir_all(&fonts).unwrap();
        // One original the player already had, one slot that starts empty.
        std::fs::write(fonts.join("ARIALN.ttf"), b"original").unwrap();
        std::fs::write(fonts.join("1.slug"), b"cache").unwrap();
        let custom = font(&tmp.0, "custom.ttf", TTF);

        let base_str = base.to_string_lossy().into_owned();
        let rt = rt();
        let result = rt
            .block_on(apply_font_assignments_async(
                base_str.clone(),
                "forever".into(),
                vec![FontAssignment {
                    font_path: custom.to_string_lossy().into_owned(),
                    mappings: vec!["chat".into(), "quest".into()],
                    locale_packs: vec![],
                }],
                false,
            ))
            .unwrap();

        assert_eq!(result.applied, ["ARIALN.ttf", "FRIZQT__.ttf"]);
        assert_eq!(result.slug_cache_cleared, 1);
        assert_eq!(std::fs::read(fonts.join("ARIALN.ttf")).unwrap(), TTF);
        assert_eq!(std::fs::read(fonts.join("FRIZQT__.ttf")).unwrap(), TTF);
        assert!(!fonts.join(".ARIALN.ttf.tmp").exists());

        // A second apply must not overwrite the original backup.
        rt.block_on(apply_font_assignments_async(
            base_str.clone(),
            "forever".into(),
            vec![FontAssignment {
                font_path: custom.to_string_lossy().into_owned(),
                mappings: vec!["chat".into()],
                locale_packs: vec![],
            }],
            false,
        ))
        .unwrap();

        let mut restored = rt
            .block_on(restore_defaults_async(base_str.clone(), "forever".into()))
            .unwrap();
        restored.sort();
        assert_eq!(restored, ["ARIALN.ttf", "FRIZQT__.ttf"]);
        assert_eq!(std::fs::read(fonts.join("ARIALN.ttf")).unwrap(), b"original");
        assert!(!fonts.join("FRIZQT__.ttf").exists());
        assert!(!fonts.join(BACKUP_DIR).exists());

        // Restoring again is a quiet no-op, not an error.
        let again = rt
            .block_on(restore_defaults_async(base_str, "forever".into()))
            .unwrap();
        assert!(again.is_empty());
    }

    #[test]
    fn apply_to_missing_flavor_is_an_error() {
        let tmp = TempDir::new("missing_flavor");
        std::fs::create_dir_all(tmp.0.join("_retail_")).unwrap();
        let err = resolve_flavor_path(&tmp.0.to_string_lossy(), "forever").unwrap_err();
        assert!(err.contains("_forever_"));
    }
}
