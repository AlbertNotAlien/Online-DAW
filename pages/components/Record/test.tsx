import { useState, useEffect, useRef } from "react";
import Recorder from "recorder-js";

const Record = () => {
  const audioContext: any =
    typeof window !== "undefined" && new window.AudioContext();
  const recorderRef = useRef(
    new Recorder(audioContext, {
      // onAnalysed: (data) => console.log(data),
    })
  );

  const [isRecording, setIsRecording] = useState(false);
  let blob: any = null;

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => recorderRef.current.init(stream))
        .catch((err) => console.log("unable to get stream ", err));
    }
  }, []);

  function startRecording() {
    console.log("recorderRef", recorderRef);
    const res = recorderRef.current
      .start()
      .then((res) => {
        setIsRecording(true);
        console.log(res);
        console.log("!");
      })
      .catch((err) => console.log(err));
    console.log("res", res);
  }

  function stopRecording() {
    recorderRef.current
      .stop()
      .then(({ blob, buffer }) => {
        blob = blob;

        // buffer is an AudioBuffer
      })
      .catch((err) => console.log(err));
  }

  function download() {
    Recorder.download(blob, "my-audio-file"); // downloads a .wav file
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
