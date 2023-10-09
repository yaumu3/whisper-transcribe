import { invoke } from "@tauri-apps/api/tauri";
import { confirm, message, open, save } from "@tauri-apps/api/dialog";
import { shell } from "@tauri-apps/api";
import "./App.css";
import { ALLOWED_FILE_EXTENSIONS } from "./constants";
import { useEffect, useState } from "react";
import { TauriEvent, listen } from "@tauri-apps/api/event";
import { appWindow } from "@tauri-apps/api/window";
import Input from "./components/Input";
import TextArea from "./components/TextArea";
import LabeledItem from "./components/LabeledItem";

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
        if (appStatus === AppStatus.Idle) {
          postToWhisper(event.payload[0]);
        }
      }
    );
    const unlistenFileDropCancelled =
      listen<TauriEvent.WINDOW_FILE_DROP_CANCELLED>(
        TauriEvent.WINDOW_FILE_DROP_CANCELLED,
        async () => {
          setHoveringClickOrDropArea(false);
        }
      );
    return () => {
      [
        unlistenWindowCloseRequested,
        unlistenFileDropHover,
        unlistenFileDrop,
        unlistenFileDropCancelled,
      ].forEach((promise) => promise.then((e) => e()));
    };
  }, [appStatus]);

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
                className="button button-default"
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
            <form className="config-form">
              <LabeledItem title="OpenAI API key">
                <Input type="password" placeholder="sk-..." />
              </LabeledItem>
              <LabeledItem
                title="Language (Optional)"
                tooltipElement={
                  <>
                    <span
                      className="link-like-text"
                      onClick={() =>
                        shell.open(
                          "https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes"
                        )
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
                <div className="button button-default" onClick={cancelConfig}>
                  Cancel
                </div>
                <div className="button button-save" onClick={saveConfig}>
                  Save
                </div>
              </div>
            </form>
          </div>
        );
      default:
        return <div />;
    }
  };

  return <div className="container">{render()}</div>;
}

export default App;
