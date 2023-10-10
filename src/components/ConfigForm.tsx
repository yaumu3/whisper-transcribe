import { open } from "@tauri-apps/api/shell";
import Input from "./Input";
import LabeledItem from "./LabeledItem";
import TextArea from "./TextArea";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

type ConfigFormProps = {
  cancelConfig: () => void;
  saveConfig: (config: Config) => void;
};

export type Config = {
  apiKey: string;
  language?: string;
  prompt?: string;
  temperature?: number;
};

function ConfigForm(props: ConfigFormProps) {
  const [apiKey, setApiKey] = useState("");
  const [language, setLanguage] = useState<string | undefined>(undefined);
  const [prompt, setPrompt] = useState<string | undefined>(undefined);
  const [temperature, setTemperature] = useState("");
  useEffect(() => {
    invoke<Config>("get_config").then((c) => {
      setApiKey(c.apiKey);
      setLanguage(c.language);
      setPrompt(c.prompt);
      setTemperature(c.temperature === 0 ? "0" : String(c.temperature || ""));
    });
  }, []);
  const { cancelConfig, saveConfig } = props;
  return (
    <form className="config-form">
      <LabeledItem title="OpenAI API key">
        <Input
          type="password"
          placeholder="sk-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </LabeledItem>
      <LabeledItem
        title="Language (Optional)"
        tooltipElement={
          <>
            <span
              className="link-like-text"
              onClick={() =>
                open("https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes")
              }
            >
              ISO 639-1
            </span>
            &nbsp;code
          </>
        }
      >
        <Input
          type="text"
          spellcheck={false}
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        />
      </LabeledItem>
      <LabeledItem title="Prompt (Optional)" grow={true}>
        <TextArea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      </LabeledItem>
      <LabeledItem
        title="Temperature (Optional)"
        tooltipElement={<>Between 0 and 1</>}
      >
        <Input
          type="number"
          value={String(temperature)}
          onChange={(e) => setTemperature(e.target.value)}
        />
      </LabeledItem>
      <div className="buttons">
        <button className="button button-default" onClick={cancelConfig}>
          Cancel
        </button>
        <button
          className="button button-save"
          onClick={() =>
            saveConfig({
              apiKey,
              language: language || undefined,
              prompt: prompt || undefined,
              temperature:
                temperature === "0" ? 0 : parseFloat(temperature) || undefined,
            })
          }
        >
          Save
        </button>
      </div>
    </form>
  );
}

export default ConfigForm;
