// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use command::{
    get_config, is_ready_to_transcribe, post_to_whisper, save_transcription, set_config,
};

mod api;
mod command;
mod config;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            is_ready_to_transcribe,
            get_config,
            set_config,
            post_to_whisper,
            save_transcription,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
