import { useState, useEffect, useRef } from "react";
import Recorder from "recorder-js";

const Record = () => {

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({audio:true})
    .then(stream => {
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorder.start()
      let chuck = [];
  
      mediaRecorder.
    })
  }

  
  return (
    <>
      <button onClick={startRecording}>startRecording</button>
      <button onClick={stopRecording}>stopRecording</button>
      <button onClick={download}>download</button>
    </>
  );
};

export default Record;
