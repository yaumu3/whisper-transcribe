// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn post_to_whisper(audio_file: &str) {
    println!("[Rust] passed {} from JS.", audio_file)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![post_to_whisper])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
