import { useEffect, useState } from "react";

const useRecorder = () => {
  const [recordURL, setRecordURL] = useState("");
  const [recordFile, setRecordFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);

  let audioChunks = [];
  useEffect(() => {
    // Lazily obtain recorder first time we're recording.
    if (recorder === null) {
      if (isRecording) {
        requestRecorder().then(setRecorder, console.error);
      }
      return;
    }

    // Manage recorder state.
    if (isRecording) {
      recorder.start();
    } else {
      recorder.stop();
    }

    // Obtain the audio when ready.
    const handleData = (e) => {
      setRecordURL(window.URL.createObjectURL(e.data));
      audioChunks.push(e.data);
      let blob = new Blob(audioChunks, { type: "audio/mp3" });
      setRecordFile(blob);
    };

    recorder.addEventListener("dataavailable", handleData);
    return () => recorder.removeEventListener("dataavailable", handleData);
  }, [recorder, isRecording]);

  const startRecording = () => {
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  return [recordFile, recordURL, isRecording, startRecording, stopRecording];
};

async function requestRecorder() {
  const stream = await window.navigator.mediaDevices.getUserMedia({
    audio: {
      sampleRate: 44100,
      channelCount: 1,
    },
    video: false,
  });
  const options = {
    mimeType: "audio/webm;codec=pcm",
    // audioBitsPerSecond: 44100 * 16,
  };
  return new MediaRecorder(stream, options);
}

export default useRecorder;
