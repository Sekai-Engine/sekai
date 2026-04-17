use std::process::Command;
use std::sync::Mutex;
use crate::binary::BINARY_CONFIG;

pub static PROJECT_PATH: Mutex<Option<String>> = Mutex::new(None);

#[tauri::command]
pub fn set_project_path(path: &str) -> Result<(), String> {
    let mut global_path = PROJECT_PATH.lock().map_err(|e| e.to_string())?;
    *global_path = Some(path.to_string());
    Ok(())
}

#[tauri::command]
pub fn run_command(command: &str) -> Result<(), String> {
    let project_path = {
        let global_path = PROJECT_PATH.lock().map_err(|e| e.to_string())?;
        global_path
            .clone()
            .ok_or_else(|| "项目路径未设置".to_string())?
    };
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    let exe_dir = exe_path
        .parent()
        .ok_or_else(|| "无法获取程序目录".to_string())?;

    let (cmd, args) = match command {
        "start" => start(&project_path),
        _ => {
            return Err(format!("未知命令: {}", command));
        }
    };

    Command::new(cmd)
        .args(args)
        .current_dir(exe_dir)
        .output()
        .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn start(project_path: &str) -> (String, Vec<String>) {
    let exe_path = std::env::current_exe().map_err(|e| e.to_string()).unwrap();
    let exe_dir = exe_path.parent().unwrap();
    let module_dir = exe_dir.join("module");
    let filename = BINARY_CONFIG
        .iter()
        .find(|c| c.key == "template")
        .map(|c| {
            if cfg!(target_os = "windows") {
                c.win_name
            } else {
                c.linux_name
            }
        })
        .unwrap();
    let cmd = module_dir.join(filename).to_string_lossy().to_string();
    let args = vec!["--path".to_string(), project_path.to_string()];
    (cmd, args)
}


