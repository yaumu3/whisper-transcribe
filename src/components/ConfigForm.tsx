import { open } from "@tauri-apps/api/shell";
import Input from "./Input";
import LabeledItem from "./LabeledItem";
import TextArea from "./TextArea";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

type ConfigFormProps = {
  cancelConfig: () => void;
  saveConfig: () => void;
};

function ConfigForm(props: ConfigFormProps) {
  const [apiKey, setApiKey] = useState("");
  useEffect(() => {
    invoke<string>("get_api_key_from_config_file").then((key) =>
      setApiKey(key)
    );
  }, []);
  const { cancelConfig, saveConfig } = props;
  return (
    <form className="config-form">
      <LabeledItem title="OpenAI API key">
        <Input type="password" placeholder="sk-..." value={apiKey} />
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
        <Input type="text" spellcheck={false} />
      </LabeledItem>
      <LabeledItem title="Prompt (Optional)" grow={true}>
        <TextArea />
      </LabeledItem>
      <LabeledItem
        title="Temperature (Optional)"
        tooltipElement={<>Between 0 and 1</>}
      >
        <Input type="number" />
      </LabeledItem>
      <div className="buttons">
        <button className="button button-default" onClick={cancelConfig}>
          Cancel
        </button>
        <button className="button button-save" onClick={saveConfig}>
          Save
        </button>
      </div>
    </form>
  );
}

export default ConfigForm;
