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
import { db } from "../../../config/firebase";
import { storage } from "../../../config/firebase";
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
} from "../../../context/atoms";

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
  const [projectData, setProjectData] = useRecoilState(projectDataState);
  const uploadRef = useRef<HTMLInputElement>(null);

  const addMidiTrack = async () => {
    try {
      const trackRef = doc(
        collection(db, "projects", projectData.id, "tracks")
      );
      const newData = {
        id: trackRef.id,
        trackName: "Midi",
        type: "midi",
        isMuted: false,
        isSolo: false,
        clips: [
          {
            clipName: "",
            notes: [],
            startPoint: {
              bars: 0,
              quarters: 0,
              sixteenths: 0,
            },
          },
        ],
        selectedBy: "",
      };
      await setDoc(trackRef, newData);
      console.log("info uploaded");
    } catch (err) {
      console.log(err);
    }
  };

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
      <p
        onDoubleClick={() => {
          addMidiTrack();
        }}
      >
        ++
      </p>
    </>
  );
};

export default TimeRuler;
