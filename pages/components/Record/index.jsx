// import * as React from "react";
// import { useState, useEffect, useRef, FC } from "react";
import useRecorder from "./useRecorder";
import Timeline from "../Timeline";
import { useEffect } from "react";

const Record = (props) => {
  let [recordFile, recordURL, isRecording, startRecording, stopRecording] =
    useRecorder();

  useEffect(() => {
    if (recordFile) {
      console.log(recordFile);
      props.handleUploadAudio(recordFile);
    }
  }, [recordFile]);

  return (
    <div className="App">
      {/* <audio src={recordURL} controls /> */}
      <button onClick={startRecording} disabled={isRecording}>
        start recording
      </button>
      <button
        onClick={() => {
          stopRecording();
        }}
        disabled={!isRecording}
      >
        stop recording
      </button>
    </div>
  );
};

export default Record;
