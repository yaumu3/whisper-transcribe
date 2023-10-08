#[tauri::command]
pub fn set_api_key_to_config_file(api_key: &str) -> Result<(), String> {
    if crate::config::set_api_key(api_key).is_ok() {
        Ok(())
    } else {
        Err("Failed to set API key.".to_owned())
    }
}

#[tauri::command]
pub fn post_to_whisper(lang: &str, file_path: &str) -> Result<String, String> {
    let api_key = match crate::config::get_api_key() {
        Ok(Some(api_key)) => api_key,
        Ok(_) => return Err("No API key found in config file".to_owned()),
        Err(e) => return Err(e.to_string()),
    };
    let response = match crate::api::post(&api_key, lang, file_path) {
        Ok(response) => response,
        Err(e) => return Err(e.to_string()),
    };
    Ok(response)
}
