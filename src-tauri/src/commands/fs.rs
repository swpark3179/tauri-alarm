use std::path::PathBuf;
use std::fs;
use serde_json::Value;
use tauri::async_runtime::spawn_blocking;

fn validate_id(id: &str) -> Result<(), String> {
    if id.contains('/') || id.contains('\\') || id.contains("..") {
        return Err("Invalid ID: Path traversal detected".to_string());
    }
    Ok(())
}

pub fn get_alarm_dir() -> PathBuf {
    let mut path = dirs::home_dir().expect("Failed to get home directory");
    path.push(".alarm");
    path
}

pub fn get_alarms_file() -> PathBuf {
    let mut path = get_alarm_dir();
    path.push("alarms.json");
    path
}

pub fn get_config_file() -> PathBuf {
    let mut path = get_alarm_dir();
    path.push("config.properties");
    path
}

#[tauri::command]
pub async fn init_fs() -> Result<(), String> {
    let alarm_dir = get_alarm_dir();
    let alarms_file = get_alarms_file();
    let config_file = get_config_file();
    let home_dir = dirs::home_dir().ok_or("Failed to get home directory")?;

    spawn_blocking(move || {
        if !alarm_dir.exists() {
            fs::create_dir_all(&alarm_dir).map_err(|e| e.to_string())?;
        }

        if !alarms_file.exists() {
            fs::write(&alarms_file, "[]").map_err(|e| e.to_string())?;
        }

        if !config_file.exists() {
            let default_config = format!(
                "executable_path={}\\.alarm\\Trigger.exe\n",
                home_dir.display()
            );
            fs::write(&config_file, default_config).map_err(|e| e.to_string())?;
        }
        Ok(())
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn read_alarms() -> Result<Value, String> {
    let alarms_file = get_alarms_file();
    let data = spawn_blocking(move || {
        fs::read_to_string(alarms_file).map_err(|e| e.to_string())
    }).await.map_err(|e| e.to_string())??;

    let json: Value = serde_json::from_str(&data).map_err(|e| e.to_string())?;
    Ok(json)
}

#[tauri::command]
pub async fn write_alarms(alarms: Value) -> Result<(), String> {
    let alarms_file = get_alarms_file();
    let data = serde_json::to_string_pretty(&alarms).map_err(|e| e.to_string())?;
    spawn_blocking(move || {
        fs::write(alarms_file, data).map_err(|e| e.to_string())
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn read_alarm_content(id: String) -> Result<String, String> {
    validate_id(&id)?;
    let mut path = get_alarm_dir();
    path.push(format!("{}.md", id));
    spawn_blocking(move || {
        if path.exists() {
            fs::read_to_string(path).map_err(|e| e.to_string())
        } else {
            Ok("".to_string())
        }
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn write_alarm_content(id: String, content: String) -> Result<(), String> {
    validate_id(&id)?;
    let mut path = get_alarm_dir();
    path.push(format!("{}.md", id));
    spawn_blocking(move || {
        fs::write(path, content).map_err(|e| e.to_string())
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn delete_alarm_content(id: String) -> Result<(), String> {
    validate_id(&id)?;
    let mut path = get_alarm_dir();
    path.push(format!("{}.md", id));
    spawn_blocking(move || {
        if path.exists() {
            fs::remove_file(path).map_err(|e| e.to_string())?;
        }
        Ok(())
    }).await.map_err(|e| e.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_alarm_dir() {
        let alarm_dir = get_alarm_dir();
        assert!(alarm_dir.ends_with(".alarm"));
        assert!(alarm_dir.is_absolute());
    }

    #[test]
    fn test_get_alarms_file() {
        let alarms_file = get_alarms_file();
        assert!(alarms_file.ends_with("alarms.json"));
        assert!(alarms_file.parent().unwrap().ends_with(".alarm"));
    }

    #[test]
    fn test_get_config_file() {
        let config_file = get_config_file();
        assert!(config_file.ends_with("config.properties"));
        assert!(config_file.parent().unwrap().ends_with(".alarm"));
    }

    #[test]
    fn test_validate_id() {
        // Valid IDs
        assert!(validate_id("12345").is_ok());
        assert!(validate_id("abcde-12345").is_ok());
        assert!(validate_id("some_valid_id").is_ok());

        // Invalid IDs with path traversal
        assert!(validate_id("../12345").is_err());
        assert!(validate_id("12345/..").is_err());
        assert!(validate_id("12345\\..").is_err());
        assert!(validate_id("dir/12345").is_err());
        assert!(validate_id("dir\\12345").is_err());
        assert!(validate_id("..\\12345").is_err());
        assert!(validate_id("..").is_err());
        assert!(validate_id("/12345").is_err());
        assert!(validate_id("\\12345").is_err());
    }
}
