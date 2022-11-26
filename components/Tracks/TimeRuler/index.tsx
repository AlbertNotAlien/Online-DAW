import Image from "next/image";
import { useState, useEffect, useRef, MouseEvent } from "react";
import styled, { keyframes } from "styled-components";
import { useRecoilState, useSetRecoilState } from "recoil";
import produce from "immer";
const { v4: uuidv4 } = require("uuid");

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

const Container = styled.div`
  display: flex;
  min-height: 30px;
  width: 100%;
  align-items: center;
  padding-left: 10px;
  background-color: #183248;
  border-radius: 10px;
  column-gap: 10px;
`;

const FileInput = styled.input`
  display: none;
`;

const Button = styled.p`
  /* font-size: 10px; */
  /* line-height: 20px; */
  /* background-color: gray; */
  display: flex;
  cursor: pointer;
`;

const TimeRuler = (props: any) => {
  const [tracksData, setTracksdata] = useRecoilState(tracksDataState);
  const [projectData, setProjectData] = useRecoilState(projectDataState);
  const uploadRef = useRef<HTMLInputElement>(null);

  const addMidiTrack = async (projectId: string) => {
    try {
      const trackId = uuidv4().split("-")[0];
      const docRef = doc(db, "projects", projectId, "tracks", trackId);
      const newData = {
        clips: [
          {
            notes: [],
            startPoint: {
              bars: 0,
              quarters: 0,
              sixteenths: 0,
            },
            clipName: "",
          },
        ],
        id: trackId,
        isMuted: false,
        isSolo: false,
        selectedBy: "",
        name: "Midi",
        type: "midi",
      };
      await setDoc(docRef, newData);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <Container>
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
          <Button>upload audio</Button>
        </label>
        <Button
          onDoubleClick={() => {
            addMidiTrack(projectData.id);
          }}
        >
          add midi
        </Button>
      </Container>
    </>
  );
};

export default TimeRuler;
