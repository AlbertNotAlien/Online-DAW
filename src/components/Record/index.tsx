// import * as React from "react";
// import { useState, useEffect, useRef, FC } from "react";
import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useRecoilState, useSetRecoilState } from "recoil";

import Image from "next/image";
import useRecorder from "./useRecorder";
import Timeline from "../Project";

import {
  tracksDataState,
  projectDataState,
  selectedTrackIdState,
  selectedTrackIndexState,
  barWidthState,
  progressState,
  isPlayingState,
  isPausedState,
  isRecordingState,
  isMetronomeState,
  playerStatusState,
  isLoadingState,
  TrackData,
} from "../../lib/atoms";

const Button = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  height: 100%;
  &:hover {
    transform: scale(110%);
  }
`;

const Record = (props: any) => {
  const [recordFile, recordURL, isRecording, startRecording, stopRecording] =
    useRecorder();
  // const [isRecording, setIsRecording] = useState(false);
  const [playerStatus, setPlayerStatus] = useRecoilState(playerStatusState);

  useEffect(() => {
    if (recordFile) {
      console.log(recordFile);
      props.handleUploadAudio(recordFile);
    }
  }, [recordFile]);

  const handleRecord = () => {
    console.log("isRecording", isRecording);
    if (!isRecording && typeof startRecording === "function") {
      startRecording();
      // props.handlePlay();
      setPlayerStatus("recording");
    } else if (isRecording && typeof stopRecording === "function") {
      stopRecording();
      // props.handlePause();
    }
  };

  return (
    <>
      {/* <audio src={recordURL} controls /> */}
      <Button onClick={handleRecord}>
        {/* <Image src="/record-button.svg" alt={""} width={20} height={20} /> */}
        <Image
          src={
            playerStatus === "recording"
              ? "/record-button-activated.svg"
              : "/record-button.svg"
          }
          alt={""}
          width={20}
          height={20}
        />
      </Button>
    </>
  );
};

export default Record;
