use std::env;
use std::fs::File;
use std::io::Write;

pub struct BinaryConfig {
    pub key: &'static str,
    pub win_name: &'static str,
    pub linux_name: &'static str,
    pub url: &'static str,
}

pub static BINARY_CONFIG: [BinaryConfig; 2] = [
    BinaryConfig {
        key: "template",
        win_name: "sekai.exe",
        linux_name: "sekai.x86_64",
        url: "https://{}/Sekai-Engine/sekai-template/raw/master/src/{}",
    },
    BinaryConfig {
        key: "pack",
        win_name: "sekaipack.exe",
        linux_name: "sekaipack",
        url: "https://{}/Sekai-Engine/sekai-pack/raw/master/src/sekai{}",
    },
];

#[tauri::command]
pub fn download_binary(key: &str, source: &str, os_type: &str) -> Result<String, String> {
    let config = BINARY_CONFIG
        .iter()
        .find(|c| c.key == key)
        .ok_or_else(|| format!("未知的二进制文件标识: {}", key))?;

    let (filename, url) = match os_type {
        "windows" => (config.win_name, config.url.replace("{}", source).replace("{}", config.win_name)),
        "linux" => (config.linux_name, config.url.replace("{}", source).replace("{}", config.linux_name)),
        _ => return Err(format!("不支持的系统类型: {}", os_type)),
    };

    let exe_path = env::current_exe().map_err(|e| e.to_string())?;
    let exe_dir = exe_path
        .parent()
        .ok_or_else(|| "无法获取程序目录".to_string())?;
    let module_dir = exe_dir.join("module");

    if !module_dir.exists() {
        std::fs::create_dir_all(&module_dir).map_err(|e| format!("创建目录失败: {}", e))?;
    }

    let file_path = module_dir.join(filename);

    let response = reqwest::blocking::get(url).map_err(|e| format!("网络请求失败: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("下载失败，状态码: {}", response.status()));
    }

    let bytes = response
        .bytes()
        .map_err(|e| format!("读取数据失败: {}", e))?;

    let mut file = File::create(&file_path).map_err(|e| format!("创建文件失败: {}", e))?;

    file.write_all(&bytes)
        .map_err(|e| format!("写入文件失败: {}", e))?;

    #[cfg(not(target_os = "windows"))]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = file.metadata().map_err(|e| e.to_string())?.permissions();
        perms.set_mode(0o755);
        std::fs::set_permissions(&file_path, perms).map_err(|e| format!("设置权限失败: {}", e))?;
    }

    Ok(format!("下载成功: {}", filename))
}

#[tauri::command]
pub fn check_binary_exists(key: &str) -> Result<String, String> {
    let config = BINARY_CONFIG
        .iter()
        .find(|c| c.key == key)
        .ok_or_else(|| format!("未知的二进制文件标识: {}", key))?;
    let os_type = if cfg!(target_os = "windows") {
        "windows"
    } else {
        "linux"
    };
    let filename = match os_type {
        "windows" => config.win_name,
        "linux" => config.linux_name,
        _ => return Err(format!("不支持的系统类型: {}", os_type)),
    };
    let exe_path = env::current_exe().map_err(|e| e.to_string())?;
    let exe_dir = exe_path.parent().ok_or_else(|| "无法获取程序目录".to_string())?;
    let file_path = exe_dir.join("module").join(filename);
    if file_path.exists() {
        Ok("exists".to_string())
    } else {
        Ok(os_type.to_string())
    }
}


