import Image from "next/image";
import { useState, useEffect, useRef, MouseEvent } from "react";
import styled, { keyframes } from "styled-components";
import { useRecoilState, useSetRecoilState } from "recoil";
import produce from "immer";

import {
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  DocumentData,
  orderBy,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { storage } from "../../../lib/firebase";
import { listAll, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
} from "../../../lib/atoms";

const FileInput = styled.input`
  display: none;
`;

const UploadButton = styled.p`
  min-height: 30px;
  width: 100%;
  border-radius: 10px;
  background-color: gray;
  display: flex;
  align-items: center;
  padding-left: 10px;
  font-size: 20px;
  line-height: 20px;
  cursor: pointer;
`;

const TimeRuler = (props: any) => {
  const [tracksData, setTracksdata] = useRecoilState(tracksDataState);
  const uploadRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <label>
        <FileInput
          type="file"
          accept=".mp3,audio/*"
          multiple={false}
          ref={uploadRef}
          onInput={() => {
            if (uploadRef.current?.files) {
              props.handleUploadAudio(uploadRef.current?.files[0]);
            }
          }}
        />
        <UploadButton>+</UploadButton>
      </label>
    </>
  );
};

export default TimeRuler;
