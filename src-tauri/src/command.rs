use crate::config::Config;

#[tauri::command]
pub fn is_ready_to_transcribe() -> Result<bool, ()> {
    match crate::config::get_config() {
        // Bare minimum API key validation
        Ok(Some(config)) => Ok(!config.api_key.is_empty()),
        _ => Ok(false),
    }
}

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
    // let ten_millis: std::time::Duration = std::time::Duration::from_millis(3000);
    // std::thread::sleep(ten_millis);
    // Ok("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean feugiat eget quam vel feugiat. Fusce aliquet felis enim, vel luctus arcu venenatis ut. Morbi venenatis viverra risus ac facilisis. Fusce et ex non lorem consequat volutpat. Suspendisse lacinia tempor tortor, eget lobortis nisl commodo vitae. Nulla facilisi. Duis justo nisl, imperdiet at varius sit amet, laoreet at felis. Mauris fermentum quam ut congue tincidunt. In vel leo feugiat, congue ipsum varius, ornare lacus. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nulla vehicula leo ac purus auctor tempus. Cras hendrerit nisi ac diam euismod pulvinar. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Etiam quis ante vel dolor ultrices eleifend. Duis in velit vitae diam gravida molestie. Aenean tempor odio purus, eu aliquet sem egestas at. Morbi pharetra est at nibh tincidunt tempor. Cras accumsan dictum dictum. Nunc at efficitur urna. Proin sit amet mauris eu erat tincidunt elementum. Mauris in scelerisque dui, quis lobortis turpis. Vivamus a nisl ultrices, aliquam ex quis, interdum ante. Aliquam erat volutpat. Morbi at odio ac purus laoreet auctor. Cras dapibus metus pulvinar tempus laoreet. Nulla ut nisl ac elit iaculis pretium. Aenean nec odio finibus, fringilla arcu nec, lobortis diam. In mi libero, auctor sed feugiat et, laoreet et dui. Duis malesuada lacus a augue dapibus, eu laoreet leo auctor.".to_owned())
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
