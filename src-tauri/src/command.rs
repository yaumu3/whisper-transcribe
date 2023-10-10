use crate::config::Config;

#[tauri::command]
pub fn get_config() -> Result<Config, String> {
    match crate::config::get_config() {
        Ok(Some(config)) => Ok(config),
        Ok(_) => Err("No API key found in config file".to_owned()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn set_config(config: Config) -> Result<(), String> {
    if crate::config::set_config(&config).is_ok() {
        Ok(())
    } else {
        Err("Failed to set API key.".to_owned())
    }
}

#[tauri::command]
pub async fn post_to_whisper(file_path: &str) -> Result<String, String> {
    let config = match crate::config::get_config() {
        Ok(Some(api_key)) => api_key,
        Ok(_) => return Err("No API key found in config file".to_owned()),
        Err(e) => return Err(e.to_string()),
    };
    tokio::task::block_in_place(move || match crate::api::post(&config, file_path) {
        Ok(response) => Ok(response),
        Err(e) => Err(e.to_string()),
    })
}

#[tauri::command]
pub async fn save_transcription(transcription: &str, save_file_path: &str) -> Result<(), String> {
    match std::fs::write(save_file_path, transcription) {
        Ok(_) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}
