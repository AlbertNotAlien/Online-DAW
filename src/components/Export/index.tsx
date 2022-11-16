import { useState, useEffect, useRef, MouseEvent } from "react";
import styled from "styled-components";
import { useRecoilValue } from "recoil";
import * as Tone from "tone";

import {
  tracksDataState,
  selectedTrackIndexState,
  TrackData,
} from "../../../lib/atoms";
import useRecorder from "../Record/useRecorder";

const Export = (props: any) => {
  // const [recordFile, recordURL, isRecording, startRecording, stopRecording] =
  //   useRecorder();
  const tracksData = useRecoilValue(tracksDataState);

  const exportAudio = () => {
    if (tracksData) {
      const audioContext = new window.AudioContext();
      const url1 = tracksData[0].clips[0].url;
      const url2 = tracksData[3].clips[0].url;
      const audio1 = new Audio(url1);
      const audio2 = new Audio(url2);
      audio1.crossOrigin = "anonymous";
      audio2.crossOrigin = "anonymous";
      const source1 = audioContext.createMediaElementSource(audio1);
      const source2 = audioContext.createMediaElementSource(audio2);
      console.log("source1", source1);
      console.log("source2", source2);
      const dest = audioContext.createMediaStreamDestination();

      source1.connect(dest);
      source2.connect(dest);

      console.log("dest", dest);

      const recorder = new MediaRecorder(dest.stream);

      let audioChunks: any[] = [];

      recorder.start();

      recorder.onstart = async (event) => {
        console.log("onstart");
        // your code here
      };

      recorder.ondataavailable = (e) => {
        audioChunks.push(e.data);
        let blob = new Blob(audioChunks, { type: "audio/mp3" });
        console.log("blob", blob);
        props.handleUploadAudio(blob);
      };

      // recorder.onstop = async (event) => {
      //   console.log("onstop");
      //   // your code here
      // };

      recorder.addEventListener("error", (event) => {
        console.log("error", event.error);
      });

      recorder.addEventListener("stop", (event) => {
        console.log("stop", event);
      });

      // setTimeout(() => {
      //   source2.connect(dest);
      // }, 3000);

      setTimeout(() => {
        recorder.stop();
      }, 6000);
    }
  };
  return <button onClick={exportAudio}>export</button>;
};

export default Export;
