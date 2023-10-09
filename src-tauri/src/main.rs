// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use command::{
    get_api_key_from_config_file, post_to_whisper, save_transcription, set_api_key_to_config_file,
};

mod api;
mod command;
mod config;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_api_key_from_config_file,
            post_to_whisper,
            save_transcription,
            set_api_key_to_config_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
