mod wow;
mod wow_paths;

use tauri::Manager;
use wow::{
    apply_font_assignments_async, detect_wow_path_sync, restore_defaults_async,
    validate_font_source, validate_wow_path_async, ApplyResult, DetectResult, FontAssignment,
};

#[tauri::command]
async fn detect_wow_path() -> DetectResult {
    tokio::task::spawn_blocking(detect_wow_path_sync)
        .await
        .unwrap_or_else(|_| DetectResult::empty())
}

#[tauri::command]
async fn validate_wow_path(path: String) -> Result<DetectResult, String> {
    validate_wow_path_async(path).await
}

/// The asset protocol starts with an empty scope. Each font the user picks or
/// drops is checked, then that one file is opened up for the live preview, so
/// the webview can never read arbitrary files from disk.
#[tauri::command]
fn allow_preview_font(app: tauri::AppHandle, path: String) -> Result<(), String> {
    let font = validate_font_source(&path)?;
    app.asset_protocol_scope()
        .allow_file(&font)
        .map_err(|e| format!("Could not open font for preview: {}", e))
}

#[tauri::command]
async fn apply_custom_fonts(
    wow_path: String,
    game_version: String,
    assignments: Vec<FontAssignment>,
    compress_backup: bool,
) -> Result<ApplyResult, String> {
    apply_font_assignments_async(wow_path, game_version, assignments, compress_backup).await
}

#[tauri::command]
async fn restore_defaults(wow_path: String, game_version: String) -> Result<Vec<String>, String> {
    restore_defaults_async(wow_path, game_version).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            detect_wow_path,
            validate_wow_path,
            allow_preview_font,
            apply_custom_fonts,
            restore_defaults,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
