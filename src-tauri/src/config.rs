use std::{fs, io, path::PathBuf};

fn get_config_path() -> Result<Option<PathBuf>, io::Error> {
    let config_dir = match dirs_next::config_dir() {
        Some(path) => path,
        None => return Ok(None),
    };
    let config_dir = config_dir.join("whisper-transcribe");
    fs::create_dir_all(&config_dir)?;
    let config_path = config_dir.join("settings.json");
    Ok(Some(config_path))
}

fn read_api_key_from_config() -> Result<Option<String>, io::Error> {
    let config_path = get_config_path()?;
    if let Some(path) = config_path {
        let content = fs::read_to_string(path)?;
        let json: serde_json::Value = serde_json::from_str(&content)?;
        if let Some(api_key) = json.get("apiKey").and_then(serde_json::Value::as_str) {
            return Ok(Some(api_key.to_string()));
        }
    }
    Ok(None)
}

fn write_api_key_to_config(api_key: &str) -> Result<(), io::Error> {
    let config_path = match get_config_path()? {
        Some(path) => path,
        None => {
            return Err(io::Error::new(
                io::ErrorKind::NotFound,
                "Settings path not found",
            ))
        }
    };
    let json = serde_json::json!({
        "apiKey": api_key
    });
    let content = serde_json::to_string_pretty(&json)?;
    fs::write(config_path, content)?;
    Ok(())
}

pub fn set_api_key(api_key: &str) -> Result<(), io::Error> {
    write_api_key_to_config(api_key)
}

pub fn get_api_key() -> Result<Option<String>, io::Error> {
    read_api_key_from_config()
}
