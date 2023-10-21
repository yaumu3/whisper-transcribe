use serde::{Deserialize, Serialize};
use std::{fs, io, path::PathBuf};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub api_key: String,
    pub language: Option<String>,
    pub prompt: Option<String>,
    pub temperature: Option<f32>,
}

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

fn read_config() -> Result<Option<Config>, io::Error> {
    let config_path = get_config_path()?;
    if let Some(path) = config_path {
        let content = fs::read_to_string(path)?;
        let config: Config = serde_json::from_str(&content)?;
        return Ok(Some(config));
    }
    Ok(None)
}

fn write_config(config: &Config) -> Result<(), io::Error> {
    let config_path = match get_config_path()? {
        Some(path) => path,
        None => {
            return Err(io::Error::new(
                io::ErrorKind::NotFound,
                "Settings path not found",
            ))
        }
    };
    let content = serde_json::to_string(config)?;
    fs::write(config_path, content)?;
    Ok(())
}

pub fn set_config(config: &Config) -> Result<(), io::Error> {
    write_config(config)
}

pub fn get_config() -> Result<Option<Config>, io::Error> {
    read_config()
}
