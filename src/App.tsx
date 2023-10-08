import { invoke } from "@tauri-apps/api/tauri";
import { confirm, message, open, save } from "@tauri-apps/api/dialog";
import "./App.css";
import { ALLOWED_FILE_EXTENSIONS } from "./constants";
import { useEffect, useState } from "react";
import { TauriEvent, listen } from "@tauri-apps/api/event";

enum AppStatus {
  Idle,
  Transcribing,
  Transcribed,
  Config,
}

function App() {
  const [hoveringClickOrDropArea, setHoveringClickOrDropArea] = useState(false);
  const [appStatus, setAppStatus] = useState(AppStatus.Idle);
  const [transcribingFileName, setTranscribingFileName] = useState("");
  const [transcription, setTranscription] = useState("");
  const resetAppStatus = () => {
    setAppStatus(() => AppStatus.Idle);
    setTranscribingFileName(() => "");
    setTranscription(() => "");
  };
  const setAppStatusToTranscribing = (fileNameToTranscribe: string) => {
    setAppStatus(() => AppStatus.Transcribing);
    setTranscribingFileName(() => fileNameToTranscribe);
  };
  const setAppStatusToTranscribed = (transcribedText: string) => {
    setAppStatus(() => AppStatus.Transcribed);
    setTranscription(() => transcribedText);
  };
  const setAppStatusToConfig = () => {
    setAppStatus(() => AppStatus.Config);
  };

  useEffect(() => {
    const unlistenFileDropHover = listen<TauriEvent.WINDOW_FILE_DROP_HOVER>(
      "tauri://file-drop-hover",
      async () => {
        setHoveringClickOrDropArea(true);
      }
    );
    const unlistenFileDrop = listen<TauriEvent.WINDOW_FILE_DROP>(
      "tauri://file-drop",
      async (event) => {
        setHoveringClickOrDropArea(false);
        if (appStatus === AppStatus.Idle) {
          postToWhisper(event.payload[0]);
        }
      }
    );
    const unlistenFileDropCancelled =
      listen<TauriEvent.WINDOW_FILE_DROP_CANCELLED>(
        "tauri://file-drop-cancelled",
        async () => {
          setHoveringClickOrDropArea(false);
        }
      );
    return () => {
      unlistenFileDropHover.then((e) => e());
      unlistenFileDrop.then((e) => e());
      unlistenFileDropCancelled.then((e) => e());
    };
  }, []);

  const postToWhisper = async (filePath: string) => {
    const fileName = filePath.replace(/^.*[\\\/]/, "");
    const uploadConfirmed = await confirm(
      `Are you sure to upload ${fileName}?`
    );
    if (!uploadConfirmed) return;

    setAppStatusToTranscribing(fileName);
    invoke<string>("post_to_whisper", {
      lang: "en",
      filePath: filePath,
    })
      .then((res) => {
        setAppStatusToTranscribed(res);
      })
      .catch(async (e) => {
        resetAppStatus();
        await message(e, { title: "", type: "error" });
      });
  };

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
      postToWhisper(file);
    });
  };

  const discardTranscription = async () => {
    const discardConfirmed = await confirm(
      "Are you sure to discard the transcription?\nThis action cannot be reverted.",
      { type: "warning" }
    );

    if (discardConfirmed) {
      resetAppStatus();
    }
  };

  const saveTranscription = async () => {
    const saveFilePath = await save({
      filters: [
        {
          name: "Text",
          extensions: ["txt"],
        },
      ],
    });
    if (saveFilePath === null) {
      // Save dialog was dismissed without specifying a path
      return;
    }
    invoke("save_transcription", {
      transcription,
      saveFilePath: saveFilePath,
    })
      .then(() => resetAppStatus())
      .catch(
        async () =>
          await message(
            [
              "Something went wrong while saving the transcription.",
              "Please change the destination or copy & paste the text manually.",
            ].join("\n"),
            { title: "", type: "error" }
          )
      );
  };

  const discardConfig = () => {
    resetAppStatus();
  };

  const saveConfig = () => {
    // TODO: save config
    resetAppStatus();
  };

  const render = () => {
    switch (appStatus) {
      case AppStatus.Idle:
        return (
          <div
            className={`click-or-drop-area idle ${
              hoveringClickOrDropArea ? "hover" : ""
            }`}
            onClick={openFileChooseDialog}
            onPointerEnter={() => setHoveringClickOrDropArea(true)}
            onPointerLeave={() => setHoveringClickOrDropArea(false)}
          >
            <div className="app-status-icon idle" />
            <div className="app-status-text-wrapper">
              <div className="app-status-text">
                Click or drop file to this area
              </div>
              <div className="app-status-caveat">
                Maximum file size is 25MB.
              </div>
            </div>
            <div>
              <div
                className="button button-config"
                onClick={(e) => {
                  e.stopPropagation();
                  setAppStatusToConfig();
                }}
              >
                Config
              </div>
            </div>
          </div>
        );
      case AppStatus.Transcribing:
        return (
          <div className="click-or-drop-area transcribing">
            <div className="app-status-icon transcribing" />
            <div className="app-status-text-wrapper">
              <div className="app-status-text">
                Transcribing {transcribingFileName}
              </div>
              <div className="app-status-caveat">
                This may take a few minutes.
              </div>
            </div>
          </div>
        );
      case AppStatus.Transcribed:
        return (
          <div className="click-or-drop-area transcribed">
            <div className="transcribed-file-name">{transcribingFileName}</div>
            <div className="transcription">{transcription}</div>
            <div className="buttons">
              <div
                className="button button-discard"
                onClick={discardTranscription}
              >
                Discard
              </div>
              <div className="button button-save" onClick={saveTranscription}>
                Save
              </div>
            </div>
          </div>
        );
      case AppStatus.Config:
        return (
          <div className="click-or-drop-area transcribed">
            <div className="config-form-wrapper">
              <div className="api-key-title">OpenAI API key</div>
              <div className="api-key-input-wrapper">
                <input
                  className="api-key-input"
                  type="password"
                  placeholder="sk-..."
                ></input>
              </div>
            </div>

            <div className="buttons">
              <div className="button button-discard" onClick={discardConfig}>
                Discard
              </div>
              <div className="button button-save" onClick={saveConfig}>
                Save
              </div>
            </div>
          </div>
        );
      default:
        return <div />;
    }
  };

  return <div className="container">{render()}</div>;
}

export default App;
