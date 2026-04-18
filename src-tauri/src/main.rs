#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod binary;
mod command;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            command::run_command,
            command::set_project_path,
            binary::download_binary,
            binary::check_binary_exists,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

