use std::{fmt::Display, str::FromStr};

use async_openai::{
    config::OpenAIConfig, error::OpenAIError, types::CreateTranscriptionRequest, Client,
};
use serde::{Deserialize, Deserializer, Serialize};

use crate::config::Config;

#[derive(Debug, Clone, Copy)]
pub enum TranscriptionModel {
    Gpt4oTranscribe,
    Gpt4oMiniTranscribe,
    Whisper1,
}

impl Default for TranscriptionModel {
    fn default() -> Self {
        Self::Gpt4oTranscribe
    }
}

impl FromStr for TranscriptionModel {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "gpt-4o-transcribe" => Ok(Self::Gpt4oTranscribe),
            "gpt-4o-mini-transcribe" => Ok(Self::Gpt4oMiniTranscribe),
            "whisper-1" => Ok(Self::Whisper1),
            _ => Err(()),
        }
    }
}

impl Display for TranscriptionModel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TranscriptionModel::Gpt4oTranscribe => write!(f, "gpt-4o-transcribe"),
            TranscriptionModel::Gpt4oMiniTranscribe => write!(f, "gpt-4o-mini-transcribe"),
            TranscriptionModel::Whisper1 => write!(f, "whisper-1"),
        }
    }
}

impl Serialize for TranscriptionModel {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl<'de> Deserialize<'de> for TranscriptionModel {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer).unwrap_or_default();
        Ok(TranscriptionModel::from_str(&s).unwrap_or_default())
    }
}

#[tokio::main]
pub async fn post(config: &Config, file_path: &str) -> Result<String, OpenAIError> {
    let openai_config: OpenAIConfig = OpenAIConfig::new().with_api_key(config.api_key.to_owned());
    let client: Client<OpenAIConfig> = Client::with_config(openai_config);
    let request = CreateTranscriptionRequest {
        file: file_path.into(),
        response_format: None,
        model: config.transcription_model.to_string(),
        language: config.language.to_owned(),
        prompt: config.prompt.to_owned(),
        temperature: config.temperature,
    };
    let response = client.audio().transcribe(request).await?;
    Ok(response.text)
}
