use async_openai::{
    config::OpenAIConfig, error::OpenAIError, types::CreateTranscriptionRequestArgs, Client,
};
const WHISPER_MODEL_NAME: &str = "whisper-1";

#[tokio::main]
pub async fn post(api_key: &str, lang: &str, file_path: &str) -> Result<String, OpenAIError> {
    let config: OpenAIConfig = OpenAIConfig::new().with_api_key(api_key);
    let client: Client<OpenAIConfig> = Client::with_config(config);
    let request = CreateTranscriptionRequestArgs::default()
        .file(file_path)
        .language(lang)
        .model(WHISPER_MODEL_NAME)
        .build()?;
    let response = client.audio().transcribe(request).await?;
    Ok(response.text)
}
