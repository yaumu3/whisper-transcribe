use async_openai::{
    config::OpenAIConfig, error::OpenAIError, types::CreateTranscriptionRequest, Client,
};

use crate::config::Config;
const WHISPER_MODEL_NAME: &str = "whisper-1";

#[tokio::main]
pub async fn post(config: &Config, file_path: &str) -> Result<String, OpenAIError> {
    let openai_config: OpenAIConfig = OpenAIConfig::new().with_api_key(config.api_key.to_owned());
    let client: Client<OpenAIConfig> = Client::with_config(openai_config);
    let request = CreateTranscriptionRequest {
        file: file_path.into(),
        response_format: None,
        model: WHISPER_MODEL_NAME.to_owned(),
        language: config.language.to_owned(),
        prompt: config.prompt.to_owned(),
        temperature: config.temperature,
    };
    let response = client.audio().transcribe(request).await?;
    Ok(response.text)
}
