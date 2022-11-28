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
import Modal from "../../Modal";

const Container = styled.div`
  display: flex;
  min-height: 30px;
  width: calc(100vw - 200px - 20px - 10px);
  align-items: center;
  padding-left: 10px;
  background-color: gray;
  border-radius: 10px;
  column-gap: 10px;
`;

const FileInput = styled.input`
  display: none;
`;

const Button = styled.p`
  /* font-size: 10px; */
  /* line-height: 20px; */
  background-color: gray;
  display: flex;
  cursor: pointer;
`;

const ModalWrapper = styled.div`
  display: flex;
  /* flex-direction: column; */
  /* row-gap: 10px; */
  column-gap: 10px;
`;

const TimeRuler = (props: any) => {
  const [tracksData, setTracksdata] = useRecoilState(tracksDataState);
  const [projectData, setProjectData] = useRecoilState(projectDataState);
  const [selectedTrackIndex, setSelectedTrackIndex] = useRecoilState(
    selectedTrackIndexState
  );
  const [selectedTrackId, setSelectedTrackId] =
    useRecoilState(selectedTrackIdState);
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

      props.updateSelectedTrackIndex();
    } catch (err) {
      console.log(err);
    } finally {
      if (tracksData && selectedTrackIndex !== null) {
        const newSelectedTrackIndex = tracksData.findIndex(
          (track) => track.id === selectedTrackId
        );
        setSelectedTrackIndex(newSelectedTrackIndex);
        console.log("newSelectedTrackIndex", newSelectedTrackIndex);
      }
    }
  };

  return (
    <>
      <Container>
        <Button
          onClick={() => {
            props.setIsModalOpen(true);
          }}
        >
          +++
        </Button>
        {props.isModalOpen && (
          <Modal setIsModalOpen={props.setIsModalOpen}>
            <ModalWrapper>
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
                onClick={() => {
                  addMidiTrack(projectData.id);
                }}
              >
                add midi
              </Button>
            </ModalWrapper>
          </Modal>
        )}
      </Container>
    </>
  );
};

export default TimeRuler;
