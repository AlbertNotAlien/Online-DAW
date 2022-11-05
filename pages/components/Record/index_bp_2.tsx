import * as React from "react";
import { render } from "react-dom";
import useRecorder from "./useRecorder";

const Record = () => {
  let [audioURL, isRecording, startRecording, stopRecording] = useRecorder();

  return (
    <div className="App">
      <audio src={audioURL} controls />
      <button onClick={startRecording} disabled={isRecording}>
        start recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        stop recording
      </button>
    </div>
  );
};

export default Record;
