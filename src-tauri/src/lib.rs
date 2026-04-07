use std::process::Command;
use std::sync::Mutex;

static PROJECT_PATH: Mutex<Option<String>> = Mutex::new(None);

#[cfg(target_os = "windows")]
fn get_sekai_executable() -> &'static str {
    "sekai.exe"
}
#[cfg(not(target_os = "windows"))]
fn get_sekai_executable() -> &'static str {
    "sekai.x86_64"
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            run_command,
            set_project_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn set_project_path(path: &str) -> Result<(), String> {
    let mut global_path = PROJECT_PATH.lock()
        .map_err(|e| e.to_string())?;
    *global_path = Some(path.to_string());
    Ok(())
}

#[tauri::command]
fn run_command(command: &str) -> Result<(), String>  {
    let project_path = {
           let global_path = PROJECT_PATH.lock()
               .map_err(|e| e.to_string())?;
           global_path.clone()
               .ok_or_else(|| "项目路径未设置".to_string())?
       };
    let exe_path = std::env::current_exe()
        .map_err(|e| e.to_string())?;
    let exe_dir = exe_path.parent()
        .ok_or_else(|| "无法获取程序目录".to_string())?;
    
    let (cmd, args) = match command {
        "start" => start(&project_path),
        _ => {
            return Err(format!("未知命令: {}", command));
        },
    };

    Command::new(cmd)
        .args(args)
        .current_dir(exe_dir)
        .output()
        .map_err(|e| e.to_string())?;

    Ok(())
}

fn start(project_path: &str) -> (String, Vec<String>) {
    let cmd = format!("./module/{}", get_sekai_executable());
    let args = vec![
        "--path".to_string(),
        project_path.to_string()
    ];
    (cmd, args)
}

