// import * as React from "react";
// import { useState, useEffect, useRef, FC } from "react";
import { useState, useEffect, useRef } from "react";
import styled from "styled-components";

import Image from "next/image";
import useRecorder from "./useRecorder";
import Timeline from "../Timeline";

const Button = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  &:hover {
    transform: scale(110%);
  }
`;

const Record = (props: any) => {
  const [recordFile, recordURL, isRecording, startRecording, stopRecording] =
    useRecorder();
  // const [isRecording, setIsRecording] = useState(false);

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
      props.handlePlay();
    } else if (isRecording && typeof stopRecording === "function") {
      stopRecording();
      props.handlePause();
    }
  };

  return (
    <>
      {/* <audio src={recordURL} controls /> */}
      <Button onClick={handleRecord}>
        {/* <Image src="/record-button.svg" alt={""} width={20} height={20} /> */}
        <Image
          src={
            isRecording ? "/record-button-activated.svg" : "/record-button.svg"
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
