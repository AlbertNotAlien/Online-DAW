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
  inputProgressState,
} from "../../../context/atoms";
import Modal from "../../Modal";
import { calculateBackoffMillis } from "@firebase/util";

const Container = styled.div`
  width: 10200px;
  height: 30px;
  border-radius: 10px;
  background-color: gray;
  display: flex;
`;

const Controls = styled.div`
  width: 200px;
  height: 100%;
  padding: 5px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const FileInput = styled.input`
  display: none;
`;

const AddTrackButton = styled.button`
  color: white;
  background-color: #9f9f9f;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  height: 100%;
`;

const Rulers = styled.div`
  display: flex;
  height: 100%;
  align-items: flex-end;
`;

interface RulerProps {
  rulerIndex: number;
  barWidth: number;
}

const Ruler = styled.div<RulerProps>`
  border-left: 1px solid white;
  height: ${(props) =>
    (props.rulerIndex % 4 === 0 && `calc(100% - 5px)`) ||
    (props.rulerIndex % 2 === 0 && "10px") ||
    "5px"};
  width: ${(props) => props.barWidth}px;
  padding-left: 5px;
  font-size: 5px;
  color: white;
  cursor: pointer;

  &:hover {
    filter: brightness(75%);
  }
`;

const ModalButton = styled.div`
  width: 150px;
  height: 150px;
  font-size: 14px;
  background-color: gray;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  filter: brightness(110%);

  &:hover {
    filter: brightness(120%);
  }
`;

const ModalWrapper = styled.div`
  display: flex;
  column-gap: 10px;
`;

const TimeRuler = (props: any) => {
  const [tracksData, setTracksData] = useRecoilState(tracksDataState);
  const [projectData, setProjectData] = useRecoilState(projectDataState);
  const [selectedTrackIndex, setSelectedTrackIndex] = useRecoilState(
    selectedTrackIndexState
  );
  const [selectedTrackId, setSelectedTrackId] =
    useRecoilState(selectedTrackIdState);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [barWidth, setBarWidth] = useRecoilState(barWidthState);
  const [progress, setProgress] = useRecoilState(progressState);
  const [inputProgress, setInputProgress] = useRecoilState(inputProgressState);

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

  const handleSetProgressLine = (quartersIndex: number) => {
    const currentBars = Math.floor(quartersIndex / 4);
    const currentQuarters = quartersIndex % 4;
    setProgress({
      bars: currentBars,
      quarters: currentQuarters,
      sixteenths: 0,
    });
    setInputProgress({
      bars: currentBars,
      quarters: currentQuarters,
      sixteenths: 0,
    });
  };

  return (
    <>
      <Container>
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
                    console.log("onInput1");
                    if (uploadRef.current?.files) {
                      props.handleUploadAudio(uploadRef.current?.files[0]);
                      console.log("onInput2");
                      props.setIsModalOpen(false);
                    }
                  }}
                />
                <ModalButton onClick={() => {}}>
                  <Image
                    src="/sound.svg"
                    alt="upload audio"
                    width={100}
                    height={100}
                  />
                  <div>upload mp3</div>
                </ModalButton>
              </label>

              <ModalButton
                onClick={() => {
                  addMidiTrack(projectData.id);
                  props.setIsModalOpen(false);
                }}
              >
                <Image
                  src="/piano.svg"
                  alt="upload audio"
                  width={100}
                  height={100}
                />
                add midi track
              </ModalButton>
            </ModalWrapper>
          </Modal>
        )}
        <Controls>
          <AddTrackButton
            onClick={() => {
              props.setIsModalOpen(true);
            }}
          >
            +
          </AddTrackButton>
        </Controls>
        <Rulers>
          {new Array(500).fill(0).map((_, rulerIndex) => {
            return (
              <Ruler
                key={rulerIndex}
                barWidth={barWidth}
                rulerIndex={rulerIndex}
                onClick={() => {
                  handleSetProgressLine(rulerIndex);
                }}
              >
                {rulerIndex % 4 === 0 && Math.floor(rulerIndex / 4 + 1)}
              </Ruler>
            );
          })}
        </Rulers>
      </Container>
    </>
  );
};

export default TimeRuler;
