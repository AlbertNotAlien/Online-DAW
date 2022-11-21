import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import produce from "immer";

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
  hoverMidiInfoState,
  playingNoteState,
  isLoadingState,
  TrackData,
  ProjectData,
  NoteData,
} from "../../lib/atoms";

import {
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  DocumentData,
  orderBy,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { storage } from "../../lib/firebase";
import { listAll, ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface PianoKeysProps {
  notation: string;
  isOnClick: boolean;
}

interface SixteenthBlockProps {
  notation: string;
  barsIndex: number;
  quartersIndex: number;
  sixteenthsIndex: number;
  notationIndex: number;
  octaveIndex: number;
}

const Container = styled.div`
  min-height: 720px;
  /* height: 100%; */
  /* max-width: 100%; */
  /* overflow: scroll; */
  display: flex;
  flex-direction: column-reverse;
  /* top: 0; */
`;

const PianoKey = styled.button<PianoKeysProps>`
  min-width: 25px;
  height: 10px;
  border-top: 1px solid black;
  border-right: 1px solid black;
  border-bottom: none;
  border-left: 1px solid black;
  background-color: ${(props) =>
    // props.notation.length > 1 ? "black" : "white"};
    (props.isOnClick === true && "red") ||
    (props.notation.length === 1 && props.isOnClick === false && "white") ||
    (props.notation.length > 1 && props.isOnClick === false && "black")};
`;

const OctaveWrapper = styled.div`
  display: flex;
  flex-direction: column-reverse;
`;

const NoationWrapper = styled.div`
  display: flex;
`;

const BarsWrapper = styled.div`
  display: flex;
`;

const QuartersWrapper = styled.div`
  display: flex;
`;

const MidiBlock = styled.div`
  width: 25px;
  height: 10px;
  /* border-right: 1px solid gray; */
  background-color: darkcyan;
  &:hover {
    filter: brightness(120%);
  }
`;

const SixteenthBlock = styled(MidiBlock)<SixteenthBlockProps>`
  background-color: ${(props) =>
    (props.notation.length === 1 && props.barsIndex % 2 === 0 && "#9F9F9F") ||
    (props.notation.length === 1 && props.barsIndex % 2 === 1 && "#A5A5A5") ||
    (props.notation.length === 2 && props.barsIndex % 2 === 0 && "#909090") ||
    (props.notation.length === 2 && props.barsIndex % 2 === 1 && "#969696")};
  border-right: ${(props) =>
    (props.sixteenthsIndex % 4 === 1 && "1px solid hsl(0, 0%, 50%)") ||
    (props.sixteenthsIndex % 2 === 1 && "1px solid hsl(0, 0%, 45%)") ||
    "1px solid hsl(0, 0%, 55%)"};
  border-top: ${(props) =>
    (props.notation === "E" &&
      props.barsIndex % 2 === 0 &&
      "1px solid hsl(0, 0%, 60%)") ||
    (props.notation === "E" &&
      props.barsIndex % 2 === 1 &&
      "1px solid hsl(0, 0%, 65%)") ||
    (props.notation === "B" &&
      props.barsIndex % 2 === 0 &&
      "1px solid hsl(0, 0%, 55%)") ||
    (props.notation === "B" &&
      props.barsIndex % 2 === 1 &&
      "1px solid hsl(0, 0%, 60%)")};
`;

const NotesPanel = (props: any) => {
  const BARS: number = 8;

  const selectedTrackIndex = useRecoilValue(selectedTrackIndexState);

  const setHoverMidiInfo = useSetRecoilState(hoverMidiInfoState);
  const [playingNote, setPlayingNote] = useRecoilState(playingNoteState);
  const [isMouseDownPianoRoll, setIsMouseDownPianoRoll] = useState(false);

  const [projectData, setProjectData] =
    useRecoilState<ProjectData>(projectDataState);
  const [tracksData, setTracksdata] = useRecoilState(tracksDataState);

  const handleAddNote = async (
    notation: string,
    notationIndex: number,
    octave: number,
    startBars: number,
    startQuarters: number,
    startSixteenths: number,
    selectedTrackIndex: number
  ) => {
    console.log("handleAddNote");

    if (tracksData) {
      console.log("projectData", projectData.id);
      console.log("selectedTrackIndex", selectedTrackIndex);
      console.log("selectedTrackID", tracksData[selectedTrackIndex].id);

      try {
        const trackRef = doc(
          db,
          "projects",
          projectData.id,
          "tracks",
          tracksData[selectedTrackIndex].id
        );

        const newNote = {
          notation: notation,
          notationIndex: notationIndex,
          octave: octave,
          start: {
            bars: startBars,
            quarters: startQuarters,
            sixteenths: startSixteenths,
          },
          length: {
            bars: 0,
            quarters: 0,
            sixteenths: 1,
          },
        };

        const newClips = produce(
          tracksData[selectedTrackIndex].clips,
          (draft) => {
            draft[0].notes.push(newNote);
          }
        );
        console.log("newNote", newNote);
        console.log("newClips", newClips);
        await updateDoc(trackRef, { clips: newClips });
        console.log("info uploaded");
      } catch (err) {
        console.log(err);
      }
    }
  };

  return (
    <Container>
      {new Array(props.OCTAVES).fill(0).map((_, octaveIndex) => (
        <OctaveWrapper key={octaveIndex}>
          {props.NOTATIONS.map((notation: string, notationIndex: number) => (
            <NoationWrapper
              key={`${notation}-${notationIndex}`}
              onMouseLeave={() => {
                setHoverMidiInfo(null);
              }}
            >
              <PianoKey
                notation={notation}
                onMouseDown={() => {
                  const newPlayingNote = {
                    notation: notation,
                    octave: octaveIndex + 1,
                  };
                  setPlayingNote(newPlayingNote);
                  setIsMouseDownPianoRoll(true);
                }}
                onMouseUp={() => {
                  setPlayingNote(null);
                  setIsMouseDownPianoRoll(false);
                }}
                isOnClick={
                  playingNote?.notation === notation &&
                  playingNote?.octave === octaveIndex + 1 &&
                  isMouseDownPianoRoll === true
                }
              />
              {new Array(BARS).fill(0).map((_, barsIndex) => (
                <BarsWrapper key={barsIndex}>
                  {new Array(4).fill(0).map((_, quartersIndex) => (
                    <QuartersWrapper key={quartersIndex}>
                      {new Array(4).fill(0).map((_, sixteenthsIndex) => (
                        <SixteenthBlock
                          onDoubleClick={() => {
                            console.log("doubleClick handleAddNote");
                            handleAddNote(
                              notation,
                              notationIndex,
                              octaveIndex + 1,
                              barsIndex,
                              quartersIndex,
                              sixteenthsIndex,
                              props.selectedTrackIndex
                            );
                          }}
                          onMouseOver={() => {
                            setHoverMidiInfo(() => {
                              const newHoverMidiInfo = {
                                notation: notation,
                                notationIndex: notationIndex,
                                octaveIndex: octaveIndex + 1,
                              };
                              return newHoverMidiInfo;
                            });
                          }}
                          notation={notation}
                          barsIndex={barsIndex}
                          quartersIndex={quartersIndex}
                          sixteenthsIndex={sixteenthsIndex}
                          notationIndex={notationIndex}
                          octaveIndex={octaveIndex + 1}
                          key={`
                                ${notation}-${
                            octaveIndex + 1
                          }-${barsIndex}-${quartersIndex}-${sixteenthsIndex}`}
                        />
                      ))}
                    </QuartersWrapper>
                  ))}
                </BarsWrapper>
              ))}
            </NoationWrapper>
          ))}
        </OctaveWrapper>
      ))}
    </Container>
  );
};

export default NotesPanel;
