import { useState, useEffect, useRef, MouseEvent } from "react";
import styled from "styled-components";
import { useRecoilValue } from "recoil";

import {
  tracksDataState,
  selectedTrackIndexState,
  TrackData,
} from "../../../lib/atoms";

const Export = () => {
  const tracksData = useRecoilValue(tracksDataState);

  const exportAudio = () => {
    // const OutgoingAudioMediaStream = new MediaStream();
    // OutgoingAudioMediaStream.addTrack(OutgoingStream.getAudioTracks()[0]);

    // if (tracksData) {
    //   console.log(tracksData[0].clips[0].url);

    //   const url = tracksData[0].clips[0].url;
    //   const audio = new Audio(url);
    //   const ctx = new window.AudioContext();
    //   const source = ctx.createMediaElementSource(audio);
    //   const streamDest = ctx.createMediaStreamDestination();
    //   const audioNode = source.connect(streamDest);

    //   const dest = ctx.createMediaStreamDestination();
    //   dest.connect(audioNode);

    //   const finalStream = dest.stream;
    // }
    if (tracksData) {
      // console.log(tracksData[0].clips[0].url);

      const url = tracksData[0].clips[0].url;
      const audio = new Audio(url);
      audio.crossOrigin = "anonymous";
      const ctx = new window.AudioContext();
      const source = ctx.createMediaElementSource(audio);
      // console.log("source", source);
      // const streamDest = ctx.createMediaStreamDestination();
      // console.log("streamDest", streamDest);
      const dest = ctx.createMediaStreamDestination();
      const finalDest = source.connect(dest);
      // console.log("finalDest", finalDest);

      // console.log("dest", dest);
      // audioNode.connect(dest);

      const finalStream = dest.stream;
      // console.log(finalStream);

      const recorder = new MediaRecorder(finalStream);
      console.log("recorder", recorder);

      let audioChunks: any[] = [];
      const handleData = (e: any) => {
        console.log("handleData");
        audioChunks.push(e.data);
        console.log("e.data", e.data);
        let blob = new Blob(audioChunks, { type: "audio/mp3" });
        console.log("blob", blob);
      };

      recorder.start();
      recorder.addEventListener("dataavailable", handleData);
      // recorder.addEventListener("dataavailable", function (e) {
      //   console.log("file");
      //   const file = new File([e.data], "fileName", {
      //     type: "audio/mp3",
      //   });
      //   console.log(file);
      // });
    }
  };
  return <button onClick={exportAudio}>export</button>;
};

export default Export;
