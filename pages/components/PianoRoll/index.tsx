import { useState, useEffect } from "react";
import styled from "styled-components";
// import {
//   doc,
//   collection,
//   getDoc,
//   setDoc,
//   updateDoc,
//   onSnapshot,
//   DocumentData,
//   orderBy,
//   arrayUnion,
//   arrayRemove,
// } from "firebase/firestore";
// import { db } from "../../../lib/firebase";

import Draggable, { DraggableEvent } from "react-draggable";
import produce from "immer";
import { useRecoilState } from "recoil";

import { tracksDataState, TrackData } from "../../../lib/atoms";

const Container = styled.div`
  display: flex;
`;

const PianoRoll = styled.div`
  display: flex;
  flex-direction: column-reverse;
  position: relative;
`;

const NoteRuler = styled.div``;

const NoteRulerInfo = styled.p`
  width: 100px;
  margin: 0px;
`;

const PianoKey = styled.button`
  width: 25px;
  height: 10px;
  border: none;
  border-bottom: 1px solid gray;
  border-right: 1px solid black;
  /* &:hover {
    filter: brightness(120%);
  } */
`;

const MidiKeys = styled.div`
  display: flex;
`;

const WhiteKeys = styled(MidiKeys)`
  /* & + & {
    border-bottom: red;
  } */
`;

const BlackKeys = styled(MidiKeys)``;

const PianoWhiteKey = styled(PianoKey)`
  background-color: white;
  /* & + & {
    border-bottom: red;
  } */
`;

const PianoBlackKey = styled(PianoKey)`
  background-color: black;
`;

const MidiColumn = styled.div`
  display: flex;
  flex-direction: column-reverse;
`;

const MidiBlock = styled.div`
  width: 25px;
  height: 10px;
  border-right: 1px solid gray;
  background-color: darkcyan;
  &:hover {
    filter: brightness(120%);
  }
`;

const MidiBlockWhiteKeyBright = styled(MidiBlock)`
  background-color: #a5a5a5;
`;

const MidiBlockBlackKeyBright = styled(MidiBlock)`
  background-color: #969696;
`;

const MidiBlockWhiteKeyDark = styled(MidiBlock)`
  background-color: #9f9f9f;
`;

const MidiBlockBlackKeyDark = styled(MidiBlock)`
  background-color: #8f8f8f;
`;

const NoteBar = styled(MidiBlock)<NoteBarProps>`
  background-color: red;
  position: absolute;
  z-index: 1;
  /* cursor: grab; */

  /* left: ${(props) =>
    ((props.startBars - 1) * 8 + (props.startBeats - 1) + 1) * 25}px; */
  /* bottom: ${(props) =>
    ((props.octave - 1) * 12 + props.notationIndex) * 10}px; */

  width: ${(props) => (props.lengthBars * 8 + props.lengthBeats) * 25}px;
  display: flex;
  justify-content: space-between;
  cursor: move;
`;

const NoteBarSide = styled.div`
  width: 3px;
  height: 100%;
  background-color: blue;
  cursor: col-resize;
  z-index: 2;
`;

interface NoteBarProps {
  notation: string;
  notationIndex: number;
  octave: number;
  startBars: number;
  startBeats: number;
  lengthBars: number;
  lengthBeats: number;
}

interface DraggableData {
  node: HTMLElement;
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
  lastX: number;
  lastY: number;
}

export default function App(props: any) {
  const OCTAVES: number = 6;
  const NOTATIONS: string[] = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const DOUBLE_MEASURES: number = 4;
  // const BEATS: number = 4;

  const [hoverNote, setHoverNote] = useState("G5");
  const [tracksData, setTracksdata] = useRecoilState(tracksDataState);

  // console.log("tracksData", tracksData);

  const handleAddNote = (
    notation: string,
    notationIndex: number,
    octave: number,
    startBars: number,
    startBeats: number
  ) => {
    console.log("doubleClick");
    if (tracksData && props.selectedTrackIndex) {
      const newData = {
        notation: notation,
        notationIndex: notationIndex,
        octave: octave,
        start: {
          bars: startBars,
          beats: startBeats,
        },
        length: {
          bars: 0,
          beats: 1,
        },
      };

      // const existedNote = trackData.clips[0].notes.filter(
      //   (note) =>
      //     newData.notationIndex === note.notationIndex &&
      //     newData.octave === note.octave &&
      //     newData.start.bars * 8 + newData.start.beats >=
      //       note.start.bars * 8 + note.start.beats &&
      //     newData.start.bars * 8 + newData.start.beats <=
      //       (note.start.bars + note.length.bars) * 8 +
      //         (note.start.beats + note.length.beats)
      // );
      // console.log("existedNote", existedNote);

      const newTracksData = produce(tracksData, (draft) => {
        draft[props.selectedTrackIndex].clips[0].notes.push(newData);
      });
      setTracksdata(newTracksData);
      console.log(
        "tracksData[props.selectedTrackIndex]",
        tracksData[props.selectedTrackIndex]
      );
    }
  };

  const handleDeleteNote = (
    notationIndex: number,
    octave: number,
    startBars: number,
    startBeats: number
  ) => {
    if (tracksData && props.selectedTrackIndex) {
      const newTracksData = produce(tracksData, (draft) => {
        draft[props.selectedTrackIndex].clips[0].notes = draft[
          props.selectedTrackIndex
        ].clips[0].notes.filter(
          (note) =>
            !(
              note.notationIndex === notationIndex &&
              note.octave === octave &&
              note.start.bars === startBars &&
              note.start.beats === startBeats
            )
        );
      });
      setTracksdata(newTracksData);
    }
  };

  const handleDragNotePosition = (
    event: DraggableEvent,
    dragElement: { x: number; y: number },
    notationIndex: number,
    octave: number,
    startBars: number,
    startBeats: number
    // index: number
  ) => {
    if (tracksData && props.selectedTrackIndex) {
      const newPositionX = dragElement.x - 25;
      const newPositionY = -dragElement.y;
      // console.log("dragElement.y", dragElement.y);

      console.log("newPositionX", newPositionX);
      console.log("newPositionY", newPositionY);

      const selectedNoteIndex = tracksData[
        props.selectedTrackIndex
      ].clips[0].notes.findIndex(
        (note) =>
          note.notationIndex === notationIndex &&
          note.octave === octave &&
          note.start.bars === startBars &&
          note.start.beats === startBeats
      );

      // console.log(data);

      // console.log("selectedNoteIndex", selectedNoteIndex);

      const newTracksData = produce(tracksData, (draft) => {
        const newBeats = (newPositionX % (25 * 8)) / 25 + 1;
        const newBars = Math.floor(newPositionX / (25 * 8)) + 1;

        // console.log("newBeats", newBeats);
        // console.log("newBars", newBars);
        console.log(draft[props.selectedTrackIndex].clips[0]);

        draft[props.selectedTrackIndex].clips[0].notes[
          selectedNoteIndex
        ].start.beats = newBeats;
        draft[props.selectedTrackIndex].clips[0].notes[
          selectedNoteIndex
        ].start.bars = newBars;

        const newNotationIndex = (newPositionY / 10) % 12;
        const newOctave = Math.floor(newPositionY / (10 * 12)) + 1;

        draft[props.selectedTrackIndex].clips[0].notes[
          selectedNoteIndex
        ].notationIndex = newNotationIndex;

        // console.log(newNotationIndex);

        draft[props.selectedTrackIndex].clips[0].notes[
          selectedNoteIndex
        ].notation = NOTATIONS[newNotationIndex];
        // console.log(NOTATIONS[newNotationIndex]);

        draft[props.selectedTrackIndex].clips[0].notes[
          selectedNoteIndex
        ].octave = newOctave;

        console.log("newNotationIndex", newNotationIndex);
        console.log("newOctave", newOctave);
      });
      console.log(newTracksData);
      setTracksdata(newTracksData);
    }
  };

  const handleDragNoteStart = () => {};

  const handleDragNoteEnd = () => {};

  useEffect(() => {
    // try {
    //   const trackRef = doc(
    //     db,
    //     "projects",
    //     props.projectId,
    //     "tracks",
    //     props.selectedTrackId
    //   );
    //   const newData = {
    //     notation: notation,
    //     notationIndex: notationIndex,
    //     octave: octave,
    //     start: {
    //       bars: startBars,
    //       beats: startBeats,
    //     },
    //     length: {
    //       bars: 0,
    //       beats: 1,
    //     },
    //   };
    //   await updateDoc(trackRef, {
    //     clips: tracksData[props.selectedTrackIndex].clips[0].notes.push(newData),
    //   });
    //   console.log("info updated");
    // } catch (err) {
    //   console.log(err);
    // }
  }, []);

  return (
    <Container>
      <NoteRuler>
        <>
          <NoteRulerInfo>{hoverNote}</NoteRulerInfo>
        </>
      </NoteRuler>
      <PianoRoll>
        {tracksData &&
          props.selectedTrackIndex &&
          tracksData[props.selectedTrackIndex].clips[0].notes.map(
            (
              note: {
                notation: string;
                notationIndex: number;
                octave: number;
                start: {
                  bars: number;
                  beats: number;
                };
                length: {
                  bars: number;
                  beats: number;
                };
              },
              index: number
            ) => {
              // console.log(note);
              return (
                <Draggable
                  axis="both"
                  onStop={(event: DraggableEvent, dragElement: DraggableData) =>
                    handleDragNotePosition(
                      event,
                      dragElement,
                      note.notationIndex,
                      note.octave,
                      note.start.bars,
                      note.start.beats
                    )
                  }
                  grid={[25, 10]}
                  position={{
                    x:
                      ((note.start.bars - 1) * 8 + (note.start.beats - 1) + 1) *
                      25,
                    y: ((note.octave - 1) * 12 + note.notationIndex) * -10,
                  }}
                  handle="#handle"
                  key={`${note.notation}-${note.octave}-${note.start.bars}-${note.start.beats}-${note.length}`}
                >
                  <NoteBar
                    key={`${note.notation}-${note.octave}-${note.start.bars}-${note.start.beats}-${note.length}`}
                    id="handle"
                    notation={note.notation}
                    notationIndex={note.notationIndex}
                    octave={note.octave}
                    startBars={note.start.bars}
                    startBeats={note.start.beats}
                    lengthBars={note.length.bars}
                    lengthBeats={note.length.beats}
                    onDoubleClick={() => {
                      handleDeleteNote(
                        note.notationIndex,
                        note.octave,
                        note.start.bars,
                        note.start.beats
                      );
                    }}
                  >
                    <NoteBarSide />
                    <NoteBarSide />
                  </NoteBar>
                </Draggable>
              );
            }
          )}
        {new Array(OCTAVES).fill(0).map((_, octaveIndex) => (
          <MidiColumn key={octaveIndex}>
            {NOTATIONS.map((notation, notationIndex) => (
              <div
                key={`${notation}-${notationIndex}`}
                onMouseLeave={() => {
                  setHoverNote("");
                }}
              >
                {notation.length === 1 ? (
                  <WhiteKeys>
                    <PianoWhiteKey onClick={() => {}} />
                    {new Array(DOUBLE_MEASURES).fill(0).map((_, barsIndex) => (
                      <>
                        {new Array(8).fill(0).map((_, beatsIndex) => (
                          <MidiBlockWhiteKeyDark
                            onDoubleClick={() => {
                              handleAddNote(
                                notation,
                                notationIndex,
                                octaveIndex + 1,
                                barsIndex * 2 + 1,
                                beatsIndex + 1
                              );
                            }}
                            onMouseOver={() => {
                              setHoverNote(
                                `notation${notation}
                                  octave${octaveIndex + 1}
                                  bars${barsIndex * 2 + 1}
                                  beats${beatsIndex + 1}`
                              );
                            }}
                            key={`
                                ${notation}-${octaveIndex + 1}-${
                              barsIndex * 2 + 1
                            }-${beatsIndex + 1}`}
                          />
                        ))}
                        {new Array(8).fill(0).map((_, beatsIndex) => (
                          <MidiBlockWhiteKeyBright
                            onDoubleClick={() => {
                              handleAddNote(
                                notation,
                                notationIndex,
                                octaveIndex + 1,
                                (barsIndex + 1) * 2,
                                beatsIndex + 1
                              );
                            }}
                            onMouseOver={() => {
                              setHoverNote(
                                `notation${notation} octave${
                                  octaveIndex + 1
                                } bars${(barsIndex + 1) * 2} beats${
                                  beatsIndex + 1
                                }`
                              );
                            }}
                            key={`
                              ${notation}-${octaveIndex + 1}-${
                              (barsIndex + 1) * 2
                            }-${beatsIndex + 1}`}
                          />
                        ))}
                      </>
                    ))}
                  </WhiteKeys>
                ) : (
                  <BlackKeys>
                    <PianoBlackKey onClick={() => {}} />
                    {new Array(DOUBLE_MEASURES).fill(0).map((_, barsIndex) => (
                      <>
                        {new Array(8).fill(0).map((_, beatsIndex) => (
                          <MidiBlockBlackKeyDark
                            onDoubleClick={() => {
                              handleAddNote(
                                notation,
                                notationIndex,
                                octaveIndex + 1,
                                barsIndex * 2 + 1,
                                beatsIndex + 1
                              );
                            }}
                            onMouseOver={() => {
                              setHoverNote(
                                `notation${notation} octave${
                                  octaveIndex + 1
                                } bars${barsIndex * 2 + 1} beats${
                                  beatsIndex + 1
                                }`
                              );
                            }}
                            key={`
                                ${notation}-${octaveIndex + 1}-${
                              barsIndex * 2 + 1
                            }-${beatsIndex + 1}`}
                          />
                        ))}
                        {new Array(8).fill(0).map((_, beatsIndex) => (
                          <MidiBlockBlackKeyBright
                            onDoubleClick={() => {
                              handleAddNote(
                                notation,
                                notationIndex,
                                octaveIndex + 1,
                                (barsIndex + 1) * 2,
                                beatsIndex + 1
                              );
                            }}
                            onMouseOver={() => {
                              setHoverNote(
                                `notation${notation} octave${
                                  octaveIndex + 1
                                } bars${(barsIndex + 1) * 2} beats${
                                  beatsIndex + 1
                                }`
                              );
                            }}
                            key={`
                              ${notation}-${octaveIndex + 1}-${
                              (barsIndex + 1) * 2
                            }-${beatsIndex + 1}`}
                          />
                        ))}
                      </>
                    ))}
                  </BlackKeys>
                )}
              </div>
            ))}
          </MidiColumn>
        ))}
      </PianoRoll>
    </Container>
  );
}
