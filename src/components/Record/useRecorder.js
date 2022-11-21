import { useEffect, useState } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import * as Tone from "tone";

import {
  tracksDataState,
  projectDataState,
  selectedTrackIdState,
  selectedTrackIndexState,
  playerStatusState,
  barWidthState,
  progressState,
  isPlayingState,
  isPausedState,
  isRecordingState,
  isMetronomeState,
  TrackData,
} from "../../lib/atoms";

const useRecorder = () => {
  const [recordURL, setRecordURL] = useState("");
  const [recordFile, setRecordFile] = useState(null);
  const [recorder, setRecorder] = useState(null);
  const [isRecording, setIsRecording] = useRecoilState(isRecordingState);
  const [playerStatus, setPlayerStatus] = useRecoilState(playerStatusState);

  let audioChunks = [];
  useEffect(() => {
    // Lazily obtain recorder first time we're recording.
    if (recorder === null) {
      if (isRecording) {
        requestRecorder().then(setRecorder, console.error);
      }
      return;
    }

    console.log(recorder.state);
    // Manage recorder state.
    // if (recorder.state === "inactive") {
    console.log("isRecording", isRecording);

    if (isRecording) {
      recorder.start();
    } else if (!isRecording) {
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
    console.log("startRecording");
    setIsRecording(true);
    setPlayerStatus("recording");
  };

  const stopRecording = () => {
    console.log("stopRecording");
    setIsRecording(false);
    setPlayerStatus("paused");
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
