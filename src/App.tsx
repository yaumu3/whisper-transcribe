import { invoke } from "@tauri-apps/api/tauri";
import { confirm, message, open, save } from "@tauri-apps/api/dialog";
import "./App.css";
import { ALLOWED_FILE_EXTENSIONS } from "./constants";
import { useEffect, useState } from "react";
import { TauriEvent, listen } from "@tauri-apps/api/event";
import { appWindow } from "@tauri-apps/api/window";
import ConfigForm, { Config } from "./components/ConfigForm";
import TextArea from "./components/TextArea";

// Path utils
const pathToFileName = (path: string) => path.replace(/^.*[\\\/]/, "");
const pathToParent = (path: string) =>
  path.slice(0, -pathToFileName(path).length);

enum AppStatus {
  Idle,
  Transcribing,
  Transcribed,
  Config,
}

function App() {
  const [isReadyToTranscribe, setIsReadyToTranscribe] = useState(false);
  const [hoveringClickOrDropArea, setHoveringClickOrDropArea] = useState(false);
  const [appStatus, setAppStatus] = useState(AppStatus.Idle);
  const [transcribingFilePath, setTranscribingFilePath] = useState("");
  const [transcription, setTranscription] = useState("");
  const resetAppStatus = () => {
    setAppStatus(() => AppStatus.Idle);
  };
  const setAppStatusToTranscribing = (path: string) => {
    setAppStatus(() => AppStatus.Transcribing);
    setTranscribingFilePath(() => path);
  };
  const setAppStatusToTranscribed = (transcribedText: string) => {
    setAppStatus(() => AppStatus.Transcribed);
    setTranscription(() => transcribedText);
  };
  const setAppStatusToConfig = () => {
    setAppStatus(() => AppStatus.Config);
  };

  const warningBeforeAbortingTranscriptionProcess =
    "There is an ongoing transcription process. Are you sure to discard it? This action cannot be reverted.";
  const warningBeforeDiscardingTranscription =
    "There is an unsaved transcription. Are you sure to discard it? This action cannot be reverted.";

  useEffect(() => {
    const unlistenWindowCloseRequested = appWindow.onCloseRequested(
      async (e) => {
        const isOkToCloseWindow = async () => {
          switch (appStatus) {
            case AppStatus.Transcribing:
              return await confirm(warningBeforeAbortingTranscriptionProcess, {
                type: "warning",
              });
            case AppStatus.Transcribed:
              return await confirm(warningBeforeDiscardingTranscription, {
                type: "warning",
              });
            default:
              return true;
          }
        };
        if (await isOkToCloseWindow()) {
          return;
        }
        e.preventDefault();
      }
    );
    const unlisteners = [unlistenWindowCloseRequested];

    invoke<boolean>("is_ready_to_transcribe").then((isReady) => {
      setIsReadyToTranscribe(isReady);

      // File hover by tauri API
      if (isReady && appStatus === AppStatus.Idle) {
        const unlistenFileDropHover = listen<TauriEvent.WINDOW_FILE_DROP_HOVER>(
          TauriEvent.WINDOW_FILE_DROP_HOVER,
          async () => {
            setHoveringClickOrDropArea(true);
          }
        );
        const unlistenFileDrop = listen<TauriEvent.WINDOW_FILE_DROP>(
          TauriEvent.WINDOW_FILE_DROP,
          async (event) => {
            setHoveringClickOrDropArea(false);
            postToWhisper(event.payload[0]);
          }
        );
        const unlistenFileDropCancelled =
          listen<TauriEvent.WINDOW_FILE_DROP_CANCELLED>(
            TauriEvent.WINDOW_FILE_DROP_CANCELLED,
            async () => {
              setHoveringClickOrDropArea(false);
            }
          );
        unlisteners.push(
          ...[
            unlistenFileDropHover,
            unlistenFileDrop,
            unlistenFileDropCancelled,
          ]
        );
      }
    });

    return () => {
      unlisteners.forEach((unlistener) => unlistener.then((e) => e()));
    };
  }, [appStatus]);

  const postToWhisper = async (filePath: string) => {
    const uploadConfirmed = await confirm(
      `Are you sure to upload ${pathToFileName(filePath)}?`
    );
    if (!uploadConfirmed) return;

    setAppStatusToTranscribing(filePath);
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
      warningBeforeDiscardingTranscription,
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
      defaultPath: pathToParent(transcribingFilePath),
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

  const cancelConfig = () => {
    resetAppStatus();
  };

  const saveConfig = (config: Config) => {
    invoke("set_config", { config });
    resetAppStatus();
  };

  const render = () => {
    switch (appStatus) {
      case AppStatus.Idle:
        return (
          <div
            className={`click-or-drop-area ${
              hoveringClickOrDropArea ? "hover" : ""
            } ${isReadyToTranscribe ? "idle" : "inactive"}`}
            onClick={isReadyToTranscribe ? openFileChooseDialog : () => {}}
            onPointerEnter={() => setHoveringClickOrDropArea(true)}
            onPointerLeave={() => setHoveringClickOrDropArea(false)}
          >
            <div className="app-status-icon idle" />
            <div className="app-status-text-wrapper">
              {isReadyToTranscribe ? (
                <>
                  <div className="app-status-text">
                    Click or drop file to this area
                  </div>
                  <div className="app-status-caveat">
                    Maximum file size is 25MB.
                  </div>
                </>
              ) : (
                <div className="app-status-text">
                  ⬇ Set your API key from here ⬇
                </div>
              )}
            </div>
            <div>
              <button
                className="button button-default"
                onClick={(e) => {
                  e.stopPropagation();
                  setAppStatusToConfig();
                }}
              >
                Config
              </button>
            </div>
          </div>
        );
      case AppStatus.Transcribing:
        return (
          <div className="click-or-drop-area transcribing">
            <div className="app-status-icon transcribing" />
            <div className="app-status-text-wrapper">
              <div className="app-status-text">
                Transcribing {pathToFileName(transcribingFilePath)}
              </div>
              <div className="app-status-caveat">
                This may take a few minutes.
              </div>
            </div>
          </div>
        );
      case AppStatus.Transcribed:
        return (
          <div className="click-or-drop-area inactive">
            <div className="transcribed-file-name">
              {pathToFileName(transcribingFilePath)}
            </div>
            <TextArea
              value={transcription}
              onChange={() => {}}
              disabled={true}
            />
            {/* <div className="transcription">{transcription}</div> */}
            <div className="buttons">
              <button
                className="button button-discard"
                onClick={discardTranscription}
              >
                Discard
              </button>
              <button
                className="button button-save"
                onClick={saveTranscription}
              >
                Save
              </button>
            </div>
          </div>
        );
      case AppStatus.Config:
        return (
          <div className="click-or-drop-area inactive">
            <ConfigForm cancelConfig={cancelConfig} saveConfig={saveConfig} />
          </div>
        );
      default:
        return <div />;
    }
  };

  return <div className="container">{render()}</div>;
}

export default App;
