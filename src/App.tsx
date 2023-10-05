import { invoke } from "@tauri-apps/api/tauri";
import { confirm, open } from "@tauri-apps/api/dialog";
import "./App.css";
import { ALLOWED_FILE_EXTENSIONS } from "./constants";
import { useEffect, useState } from "react";
import { TauriEvent, listen } from "@tauri-apps/api/event";

function App() {
  useEffect(() => {
    const unlistenFileDropHover = listen<TauriEvent.WINDOW_FILE_DROP_HOVER>(
      "tauri://file-drop-hover",
      async (event) => {
        console.log(event);
      }
    );
    const unlistenFileDrop = listen<TauriEvent.WINDOW_FILE_DROP>(
      "tauri://file-drop",
      async (event) => {
        console.log(event);
        postToWhisper(event.payload[0]);
      }
    );
    const unlistenFileDropCancelled =
      listen<TauriEvent.WINDOW_FILE_DROP_CANCELLED>(
        "tauri://file-drop-cancelled",
        async (event) => {
          console.log(event);
        }
      );
    return () => {
      unlistenFileDropHover.then((e) => e());
      unlistenFileDrop.then((e) => e());
      unlistenFileDropCancelled.then((e) => e());
    };
  }, []);

  const [transcribingFileName, setTranscribingFileName] = useState<
    string | null
  >(null);
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

  async function postToWhisper(audioFilePath: string) {
    // TODO: Do nothing if already transcribing a file.
    const audioFileName = audioFilePath.replace(/^.*[\\\/]/, "");
    if (
      !(await confirm(
        `Are you sure to upload ${audioFileName}?`,
        "WhisperTranscribe"
      ))
    ) {
      return;
    }
    setTranscribingFileName(() => audioFileName);
    await new Promise((f) => setTimeout(f, 5000));
    invoke("post_to_whisper", {
      audioFilePath: audioFilePath,
    }).finally(() => setTranscribingFileName(() => null));
  }

  return (
    <div className="container">
      {transcribingFileName === null ? (
        <div className="click-or-drop-area" onClick={openFileChooseDialog}>
          <div className="speech-to-text-icon" />
          <div className="speech-to-text-description">
            <div className="click-or-drag-title">
              Click or drop file to this area
            </div>
            <div className="click-or-drag-caveat">
              Maximum file size is 25MB.
            </div>
          </div>
        </div>
      ) : (
        <div className="click-or-drop-area transcribing">
          <div className="speech-to-text-icon transcribing" />
          <div className="speech-to-text-description">
            <div className="click-or-drag-title">
              Transcribing: {transcribingFileName}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
