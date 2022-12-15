import Image from "next/image";
import { useRef, SetStateAction, Dispatch } from "react";
import styled from "styled-components";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";

import { doc, setDoc } from "firebase/firestore";
import Modal from "../Modal";
import {
  tracksDataState,
  projectDataState,
  selectedTrackIdState,
  selectedTrackIndexState,
  barWidthState,
  progressState,
  inputProgressState,
} from "../../store/atoms";
import { db } from "../../config/firebase";
const { v4: uuidv4 } = require("uuid");

const Container = styled.div`
  width: 10200px;
  height: 30px;
  border-radius: 10px;
  background-color: gray;
  display: flex;
`;

const Controls = styled.div`
  min-width: 200px;
  height: 100%;
  padding: 5px 5px;
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

interface TimeRulerProps {
  handleUploadAudio: Function;
  updateSelectedTrackIndex: Function;
  isModalOpen: boolean;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  appendToFilename: Function;
}

const TimeRuler = (props: TimeRulerProps) => {
  const tracksData = useRecoilValue(tracksDataState);
  const projectData = useRecoilValue(projectDataState);
  const [selectedTrackIndex, setSelectedTrackIndex] = useRecoilState(
    selectedTrackIndexState
  );
  const selectedTrackId = useRecoilValue(selectedTrackIdState);
  const uploadRef = useRef<HTMLInputElement>(null);
  const barWidth = useRecoilValue(barWidthState);
  const [progress, setProgress] = useRecoilState(progressState);
  const setInputProgress = useSetRecoilState(inputProgressState);

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
        volume: 0,
        pan: 0,
        selectedBy: "",
        name: "Midi",
        type: "midi",
        createdTime: new Date(),
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
                    const startTime = {
                      bars: progress.bars,
                      quarters: progress.quarters,
                      sixteenths: progress.sixteenths,
                    };

                    if (uploadRef.current?.files) {
                      const trackId = uuidv4().split("-")[0];
                      const newTrackName = `Audio ${tracksData.length + 1}`;
                      const newFileName = props.appendToFilename(
                        uploadRef.current?.files[0].name
                      );

                      props.handleUploadAudio(
                        uploadRef.current?.files[0],
                        "audio",
                        startTime,
                        trackId, // new track id,
                        newTrackName,
                        newFileName
                      );
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
