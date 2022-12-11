import { useEffect, useState, useRef } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { isRecordingState, playerStatusState } from "../store/atoms";

const useRecorder = () => {
  const [recordURL, setRecordURL] = useState("");
  const [recordFile, setRecordFile] = useState<Blob | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useRecoilState(isRecordingState);
  const setPlayerStatus = useSetRecoilState(playerStatusState);

  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Lazily obtain recorder first time we're recording.
    if (recorder === null) {
      if (isRecording) {
        requestRecorder().then((recorder) => {
          setRecorder(recorder);
        }, console.error);
      }
      return;
    }

    if (isRecording) {
      recorder.start();
    } else if (!isRecording) {
      recorder.stop();
    }

    // Obtain the audio when ready.
    const handleData = (e: BlobEvent) => {
      audioChunksRef.current = [];
      console.log("handleData");
      setRecordURL(window.URL.createObjectURL(e.data));
      audioChunksRef.current.push(e.data);
      let blob = new Blob(audioChunksRef.current, { type: "audio/mp3" });
      setRecordFile(blob);
    };

    recorder.addEventListener("dataavailable", handleData);
    return () => recorder.removeEventListener("dataavailable", handleData);
  }, [recorder, isRecording]);

  const startRecording = () => {
    setIsRecording(true);
    setPlayerStatus("recording");
  };

  const stopRecording = () => {
    setIsRecording(false);
    setPlayerStatus("paused");
  };

  return [
    recordFile,
    setRecordFile,
    recordURL,
    startRecording,
    stopRecording,
  ] as const;
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
