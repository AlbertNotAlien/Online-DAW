import { useState, useEffect, useRef } from "react";
import Recorder from "recorder-js";

// const audioContext: any =
//   typeof window !== "undefined" && new (window.AudioContext || window.webkitAudioContext)();

interface Window {
  webkitAudioContext: typeof AudioContext;
}

const audioContext: any =
  typeof window !== "undefined" && new window.AudioContext();

const constraints = {
  audio: true,
  video: false,
};

const Record = () => {
  const recorderRef = useRef(
    new Recorder(audioContext, {
      // onAnalysed: (data) => console.log(data),
    })
  );
  const blobRef: any = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia(constraints)
        .then((stream) => recorderRef.current.init(stream))
        .catch((err) => console.log("unable to get stream ", err));
    }
  }, []);

  function startRecording() {
    recorderRef.current.start().then((res) => {
      setIsRecording(true);
      console.log(res);
    });
    // .catch((err) => console.log(err));
  }

  function stopRecording() {
    // console.log(recorderRef.current);
    if (isRecording) {
      recorderRef.current.stop().then(({ blob, buffer }) => {
        blobRef.current = blob;
        console.log(blob);
        console.log(buffer);
      });
    }
    setIsRecording(false);
    // .catch((err) => console.log(err));
  }

  function download() {
    if (blobRef.current) {
      console.log(blobRef.current);
      Recorder.download(blobRef.current, "my-audio-file"); // downloads a .wav file
    }
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
