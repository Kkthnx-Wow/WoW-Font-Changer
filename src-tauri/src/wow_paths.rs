use std::collections::HashSet;
use std::path::{Path, PathBuf};

const WOW_FOLDER: &str = "World of Warcraft";

pub(crate) const WOW_FLAVOR_FOLDERS: &[&str] = &[
    "_retail_",
    "_ptr_",
    "_beta_",
    "_xptr_",
    "_classic_",
    "_classic_ptr_",
    "_classic_beta_",
    "_classic_titan_",
    "_anniversary_",
    "_classic_era_",
    "_classic_era_ptr_",
    "_classic_era_beta_",
];

pub(crate) fn is_wow_base(base: &Path) -> bool {
    WOW_FLAVOR_FOLDERS
        .iter()
        .any(|folder| base.join(folder).is_dir())
}

pub(crate) fn is_flavor_folder(path: &Path) -> bool {
    path.file_name()
        .and_then(|n| n.to_str())
        .map(|name| WOW_FLAVOR_FOLDERS.contains(&name))
        .unwrap_or(false)
}

pub(crate) fn normalize_to_wow_base(path: PathBuf) -> PathBuf {
    if is_flavor_folder(&path) {
        path.parent()
            .map(PathBuf::from)
            .unwrap_or(path)
    } else {
        path
    }
}

fn push_unique(paths: &mut Vec<PathBuf>, seen: &mut HashSet<PathBuf>, candidate: PathBuf) {
    if seen.insert(candidate.clone()) {
        paths.push(candidate);
    }
}

fn push_wow_under(
    paths: &mut Vec<PathBuf>,
    seen: &mut HashSet<PathBuf>,
    parent: &Path,
) {
    push_unique(paths, seen, parent.join(WOW_FOLDER));
}

#[cfg(windows)]
pub(crate) fn read_registry_install_path() -> Option<PathBuf> {
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
                let trimmed = path.trim();
                if !trimmed.is_empty() {
                    return Some(PathBuf::from(trimmed));
                }
            }
        }
    }

    None
}

#[cfg(not(windows))]
pub(crate) fn read_registry_install_path() -> Option<PathBuf> {
    None
}

#[cfg(windows)]
fn available_drive_roots() -> Vec<PathBuf> {
    (b'A'..=b'Z')
        .map(|letter| PathBuf::from(format!("{}:\\", letter as char)))
        .filter(|root| root.exists())
        .collect()
}

#[cfg(target_os = "macos")]
fn mac_install_roots() -> Vec<PathBuf> {
    let mut roots = vec![
        PathBuf::from("/Applications"),
        PathBuf::from("/Users/Shared"),
    ];

    if let Ok(home) = std::env::var("HOME") {
        let home = PathBuf::from(home);
        roots.push(home.join("Applications"));
        roots.push(home.join("Games"));
    }

    if let Ok(entries) = std::fs::read_dir("/Volumes") {
        for entry in entries.flatten() {
            let volume = entry.path();
            roots.push(volume.join("Applications"));
            roots.push(volume.join("Games"));
        }
    }

    roots
}

#[cfg(target_os = "linux")]
fn wow_path_in_prefix(prefix: &Path) -> Option<PathBuf> {
    [
        prefix.join("drive_c/Program Files (x86)/World of Warcraft"),
        prefix.join("drive_c/Program Files/World of Warcraft"),
        prefix.join("drive_c/Games/World of Warcraft"),
    ]
    .into_iter()
    .find(|path| path.is_dir())
}

#[cfg(target_os = "linux")]
fn should_descend_linux(path: &Path, depth: usize) -> bool {
    if depth == 0 {
        return false;
    }

    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();

    matches!(
        name.as_str(),
        "games"
            | "lutris"
            | "bottles"
            | "prefixes"
            | "pfx"
            | "runners"
            | "wine"
            | "wineprefixes"
            | "battle.net"
            | "heroic"
            | "data"
    ) || name.starts_with("wine-")
}

#[cfg(target_os = "linux")]
fn scan_linux_dir(dir: &Path, depth: usize, found: &mut Vec<PathBuf>, seen: &mut HashSet<PathBuf>) {
    if depth == 0 {
        return;
    }

    let entries = match std::fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(_) => return,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        if path.file_name().is_some_and(|n| n == WOW_FOLDER) && is_wow_base(&path) {
            push_unique(found, seen, path);
            continue;
        }

        if path.file_name().is_some_and(|n| n == "drive_c") {
            if let Some(parent) = path.parent() {
                if let Some(wow) = wow_path_in_prefix(parent) {
                    push_unique(found, seen, wow);
                }
            }
            continue;
        }

        if should_descend_linux(&path, depth) {
            scan_linux_dir(&path, depth - 1, found, seen);
        }
    }
}

#[cfg(target_os = "linux")]
fn linux_wine_candidates(seen: &mut HashSet<PathBuf>) -> Vec<PathBuf> {
    let mut found = Vec::new();
    let Some(home) = std::env::var("HOME").ok().map(PathBuf::from) else {
        return found;
    };

    if let Ok(prefix) = std::env::var("WINEPREFIX") {
        let prefix = PathBuf::from(prefix);
        if let Some(wow) = wow_path_in_prefix(&prefix) {
            push_unique(&mut found, seen, wow);
        }
    }

    let scan_roots = [
        home.join("Games"),
        home.join(".wine"),
        home.join(".local/share/lutris"),
        home.join(".local/share/Steam/steamapps/compatdata"),
        home.join(".var/app/com.usebottles.bottles/data/bottles"),
        home.join(".var/app/net.lutris.Lutris/data/lutris"),
        home.join(".local/share/heroic"),
    ];

    for root in scan_roots {
        if root.is_dir() {
            scan_linux_dir(&root, 5, &mut found, seen);
        }
    }

    found
}

pub(crate) fn collect_install_candidates() -> Vec<PathBuf> {
    let mut seen = HashSet::new();
    let mut candidates = Vec::new();

    if let Some(base) = read_registry_install_path() {
        push_unique(&mut candidates, &mut seen, normalize_to_wow_base(base));
    }

    push_primary_candidates(&mut candidates, &mut seen);
    candidates
}

/// Extra scan pass over all drive letters on Windows (slower).
pub(crate) fn collect_extended_install_candidates() -> Vec<PathBuf> {
    let mut seen = HashSet::new();
    let mut candidates = Vec::new();
    push_extended_candidates(&mut candidates, &mut seen);
    candidates
}

fn push_primary_candidates(paths: &mut Vec<PathBuf>, seen: &mut HashSet<PathBuf>) {
    #[cfg(windows)]
    {
        if let Ok(pf) = std::env::var("ProgramFiles(x86)") {
            push_wow_under(paths, seen, Path::new(&pf));
        }
        if let Ok(pf) = std::env::var("ProgramFiles") {
            push_wow_under(paths, seen, Path::new(&pf));
        }
        push_unique(
            paths,
            seen,
            PathBuf::from(r"C:\Games\World of Warcraft"),
        );
    }

    #[cfg(target_os = "macos")]
    {
        for root in mac_install_roots() {
            push_wow_under(paths, seen, &root);
            push_wow_under(paths, seen, &root.join("Blizzard"));
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(home) = std::env::var("HOME") {
            let home = PathBuf::from(home);
            push_wow_under(paths, seen, &home.join("Games"));
            push_unique(
                paths,
                seen,
                home.join(".local/share/Steam/steamapps/common/World of Warcraft"),
            );
        }

        paths.extend(linux_wine_candidates(seen));
    }
}

fn push_extended_candidates(paths: &mut Vec<PathBuf>, seen: &mut HashSet<PathBuf>) {
    #[cfg(windows)]
    {
        for drive in available_drive_roots() {
            push_wow_under(paths, seen, &drive);
            push_wow_under(paths, seen, &drive.join("Games"));
            push_wow_under(paths, seen, &drive.join("Blizzard"));
            push_wow_under(paths, seen, &drive.join("Program Files (x86)"));
            push_wow_under(paths, seen, &drive.join("Program Files"));
            push_wow_under(
                paths,
                seen,
                &drive.join("Program Files (x86)").join("Blizzard"),
            );
            push_wow_under(
                paths,
                seen,
                &drive.join("Program Files").join("Blizzard"),
            );
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn flavor_folders_are_recognized() {
        assert!(is_flavor_folder(&PathBuf::from("games").join("wow").join("_retail_")));
        assert!(is_flavor_folder(&PathBuf::from("_classic_era_")));
        assert!(!is_flavor_folder(&PathBuf::from("games").join("World of Warcraft")));
    }

    #[test]
    fn normalize_climbs_out_of_a_flavor_folder() {
        let base = PathBuf::from("games").join("World of Warcraft");
        let flavor = base.join("_retail_");
        assert_eq!(normalize_to_wow_base(flavor), base);
    }

    #[test]
    fn normalize_leaves_a_base_path_untouched() {
        let base = PathBuf::from("games").join("World of Warcraft");
        assert_eq!(normalize_to_wow_base(base.clone()), base);
    }
}
