import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/api/dialog";
import "./App.css";
import { ALLOWED_FILE_EXTENSIONS } from "./constants";

function App() {
  listen("tauri://file-drop", (event) => {
    if (event.windowLabel !== "main") {
      return;
    }
    console.log(event);
    postToWhisper(event.payload[0]);
  });

  const openFileChooseDialog = () => {
    open({
      directory: false,
      multiple: false,
      filters: [
        {
          name: "audio",
          extensions: Object.values(ALLOWED_FILE_EXTENSIONS).reduce(
            (acc, val) => acc.concat(val),
            []
          ),
        },
      ],
    }).then((file) => {
      if (file === null || Array.isArray(file)) {
        return;
      }
      console.log(file);
      postToWhisper(file);
    });
  };

  async function postToWhisper(audioFile: string) {
    await new Promise((f) => setTimeout(f, 2000));
    invoke("post_to_whisper", {
      audioFile,
    });
  }

  return (
    <div className="container">
      <div className="click-or-drop-area" onClick={openFileChooseDialog}>
        <div className="speech-to-text-icon" />
        <div className="speech-to-text-description">
          <div className="click-or-drag-title">
            Click or drop file to this area
          </div>
          <div className="click-or-drag-caveat">Maximum file size is 25MB.</div>
        </div>
      </div>
    </div>
  );
}

export default App;
