// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use command::{post_to_whisper, set_api_key_to_config_file};

mod api;
mod command;
mod config;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            post_to_whisper,
            set_api_key_to_config_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
