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

    if (tracksData) {
      console.log(tracksData[0].clips[0].url);

      const url = tracksData[0].clips[0].url;
      const audio = new Audio(url);
      const ctx = new window.AudioContext();
      const streamDest = ctx.createMediaStreamDestination();
      const source = ctx.createMediaElementSource(audio);
      const audioNode = source.connect(streamDest);
      console.log("source", source);

      const dest = ctx.createMediaStreamDestination();
      console.log("dest", dest);
      dest.connect(audioNode);

      const finalStream = dest.stream;
      console.log(finalStream);
    }
  };
  return <button onClick={exportAudio}>export</button>;
};

export default Export;
