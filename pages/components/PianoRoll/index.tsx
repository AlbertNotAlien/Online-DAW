import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import {
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  DocumentData,
  orderBy,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";

import Draggable, { DraggableEvent } from "react-draggable";
import produce from "immer";
import { useRecoilState } from "recoil";

import { tracksDataState, playingNoteState } from "../../../lib/atoms";

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
  width: ${(props) => (props.lengthBars * 8 + props.lengthBeats) * 25}px;
  background: none;
  position: absolute;
  z-index: 1;
  display: flex;
  justify-content: space-between;
`;

const NoteBarCenter = styled.div`
  background-color: red;
  /* flex-wrap: 1; */
  /* width: 23px; */
  width: 100%;
  cursor: move;
`;

const NoteBarSide = styled.div`
  width: 5px;
  /* height: 100%; */
  height: 10px;
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
  const [playingNote, setPlayingNote] = useRecoilState(playingNoteState);
  const notePrevLengthRef = useRef(0);
  const notePrevStartRef = useRef(0);

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
      const newNote = {
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

      const newTracksData = produce(tracksData, (draft) => {
        draft[props.selectedTrackIndex].clips[0].notes.push(newNote);
      });
      setTracksdata(newTracksData);

      const newPlayingNote = {
        notation: notation,
        octave: octave,
        length: {
          bars: 0,
          beats: 1,
        },
      };
      setPlayingNote(newPlayingNote);
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

  const handleDragNote = (
    event: DraggableEvent,
    dragElement: { x: number; y: number },
    notationIndex: number,
    octave: number,
    startBars: number,
    startBeats: number
  ) => {
    if (tracksData && props.selectedTrackIndex) {
      const newPositionX = dragElement.x - 25;
      const newPositionY = -dragElement.y;
      const prevNotes = tracksData[props.selectedTrackIndex].clips[0].notes;

      const selectedNoteIndex = prevNotes.findIndex(
        (note) =>
          note.notationIndex === notationIndex &&
          note.octave === octave &&
          note.start.bars === startBars &&
          note.start.beats === startBeats
      );

      const newBeats = (newPositionX % (25 * 8)) / 25 + 1;
      const newBars = Math.floor(newPositionX / (25 * 8)) + 1;
      const newNotationIndex = (newPositionY / 10) % 12;
      const newOctave = Math.floor(newPositionY / (10 * 12)) + 1;

      const newTracksData = produce(tracksData, (draft) => {
        const draftNotes =
          draft[props.selectedTrackIndex].clips[0].notes[selectedNoteIndex];

        draftNotes.start.beats = newBeats;
        draftNotes.start.bars = newBars;

        draftNotes.notationIndex = newNotationIndex;
        draftNotes.notation = NOTATIONS[newNotationIndex];
        draftNotes.octave = newOctave;
      });
      setTracksdata(newTracksData);
    }
  };

  const handleMoveNote = (
    event: DraggableEvent,
    dragElement: { x: number; y: number },
    notationIndex: number,
    octave: number,
    startBars: number,
    startBeats: number,
    lengthBars: number,
    lengthBeats: number
  ) => {
    if (tracksData && props.selectedTrackIndex) {
      const newPositionX = dragElement.x - 25;
      const newPositionY = -dragElement.y;
      const prevNotes = tracksData[props.selectedTrackIndex].clips[0].notes;

      const selectedNoteIndex = prevNotes.findIndex(
        (note) =>
          note.notationIndex === notationIndex &&
          note.octave === octave &&
          note.start.bars === startBars &&
          note.start.beats === startBeats
      );

      const newNotationIndex = (newPositionY / 10) % 12;
      const newNotation = NOTATIONS[newNotationIndex];
      const newOctave = Math.floor(newPositionY / (10 * 12)) + 1;

      if (
        !(
          newNotationIndex === prevNotes[selectedNoteIndex].notationIndex &&
          newOctave === prevNotes[selectedNoteIndex].octave
        )
      ) {
        const newPlayingNote = {
          notation: newNotation,
          octave: newOctave,
          length: {
            bars: lengthBars,
            beats: lengthBeats,
          },
        };
        // setPlayingNote(newPlayingNote);
      }
    }
  };

  const handleExtendNoteData = (
    event: DraggableEvent,
    dragElement: { x: number },
    notationIndex: number,
    octave: number,
    startBars: number,
    startBeats: number
  ) => {
    if (tracksData && props.selectedTrackIndex) {
      const prevNotes = tracksData[props.selectedTrackIndex].clips[0].notes;
      const selectedNoteIndex = prevNotes.findIndex(
        (note) =>
          note.notationIndex === notationIndex &&
          note.octave === octave &&
          note.start.bars === startBars &&
          note.start.beats === startBeats
      );
      const prevNote = prevNotes[selectedNoteIndex];

      notePrevLengthRef.current =
        prevNote.length.bars * 8 + prevNote.length.beats;
      notePrevStartRef.current =
        (prevNote.start.bars - 1) * 8 + (prevNote.start.beats - 1) + 1;
    }
    console.log("notePrevLengthRef.current", notePrevLengthRef.current);
    console.log("notePrevStartRef.current", notePrevStartRef.current);
  };

  const handleExtendNoteRight = (
    event: DraggableEvent,
    dragElement: { x: number },
    notationIndex: number,
    octave: number,
    startBars: number,
    startBeats: number
  ) => {
    if (tracksData && props.selectedTrackIndex) {
      const offsetBeats = dragElement.x / 25;
      const prevNotes = tracksData[props.selectedTrackIndex].clips[0].notes;

      const selectedNoteIndex = prevNotes.findIndex(
        (note) =>
          note.notationIndex === notationIndex &&
          note.octave === octave &&
          note.start.bars === startBars &&
          note.start.beats === startBeats
      );

      const newTracksData = produce(tracksData, (draft) => {
        const draftNotes =
          draft[props.selectedTrackIndex].clips[0].notes[selectedNoteIndex];

        const sumLengthBeats =
          notePrevLengthRef.current + offsetBeats <= 0
            ? 1
            : notePrevLengthRef.current + offsetBeats;

        draftNotes.length.bars =
          Math.floor(sumLengthBeats / 8) <= 0
            ? 0
            : Math.floor(sumLengthBeats / 8);
        draftNotes.length.beats = sumLengthBeats % 8;
      });
      setTracksdata(newTracksData);
    }
  };

  const handleExtendNoteLeft = (
    event: DraggableEvent,
    dragElement: { x: number },
    notationIndex: number,
    octave: number,
    startBars: number,
    startBeats: number
  ) => {
    if (tracksData && props.selectedTrackIndex) {
      console.log("-dragElement.x", -dragElement.x);
      const offsetBeats = -dragElement.x / 25;
      const prevNotes = tracksData[props.selectedTrackIndex].clips[0].notes;

      const selectedNoteIndex = prevNotes.findIndex(
        (note) =>
          note.notationIndex === notationIndex &&
          note.octave === octave &&
          note.start.bars === startBars &&
          note.start.beats === startBeats
      );

      const newTracksData = produce(tracksData, (draft) => {
        const draftNotes =
          draft[props.selectedTrackIndex].clips[0].notes[selectedNoteIndex];

        const sumLengthBeats =
          notePrevLengthRef.current + offsetBeats <= 0
            ? 1
            : notePrevLengthRef.current + offsetBeats;

        draftNotes.length.bars =
          Math.floor(sumLengthBeats / 8) <= 0
            ? 0
            : Math.floor(sumLengthBeats / 8);
        draftNotes.length.beats = sumLengthBeats % 8;

        console.log("notePrevStartRef.current", notePrevStartRef.current);
        console.log("offsetBeats", offsetBeats);
        const subStartBeats =
          notePrevStartRef.current - offsetBeats <= 1
            ? 1
            : notePrevStartRef.current - offsetBeats;
        console.log("subStartBeats", subStartBeats);
        console.log(
          "draftNotes.start.bars",
          subStartBeats % 8 === 0
            ? Math.floor(subStartBeats / 8)
            : Math.floor(subStartBeats / 8) + 1
        );
        console.log(
          "draftNotes.start.beats",
          subStartBeats % 8 === 0 ? 8 : subStartBeats % 8
        );

        draftNotes.start.bars = Math.floor(subStartBeats / 8) + 1;
        draftNotes.start.beats = subStartBeats % 8;
      });
      setTracksdata(newTracksData);
    }
  };

  // useEffect(() => {
  //   try {
  //     const trackRef = doc(
  //       db,
  //       "projects",
  //       props.projectId,
  //       "tracks",
  //       props.selectedTrackId
  //     );
  //     const newData = {prevNotes[selectedNoteIndex].notationIndex
  //       notation: notation,
  //       notationIndex: notationIndex,
  //       octave: octave,
  //       start: {
  //         bars: startBars,
  //         beats: startBeats,
  //       },
  //       length: {
  //         bars: 0,
  //         beats: 1,
  //       },
  //     };
  //     await updateDoc(trackRef, {
  //       clips:
  //         tracksData[props.selectedTrackIndex].clips[0].notes.push(newData),
  //     });
  //     console.log("info updated");
  //   } catch (err) {
  //     console.log(err);
  //   }
  // }, []);

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
          tracksData[props.selectedTrackIndex].type === "midi" &&
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
              return (
                <Draggable
                  axis="both"
                  onStop={(event: DraggableEvent, dragElement: DraggableData) =>
                    handleDragNote(
                      event,
                      dragElement,
                      note.notationIndex,
                      note.octave,
                      note.start.bars,
                      note.start.beats
                    )
                  }
                  onDrag={(event: DraggableEvent, dragElement: DraggableData) =>
                    handleMoveNote(
                      event,
                      dragElement,
                      note.notationIndex,
                      note.octave,
                      note.start.bars,
                      note.start.beats,
                      note.length.bars,
                      note.length.beats
                    )
                  }
                  grid={[25, 10]}
                  position={{
                    x:
                      ((note.start.bars - 1) * 8 + (note.start.beats - 1) + 1) *
                      25,
                    y: ((note.octave - 1) * 12 + note.notationIndex) * -10,
                  }}
                  handle=".handle-NoteBar"
                  key={`NoteBar-${note.notation}-${note.octave}-${note.start.bars}-${note.start.beats}-${note.length}`}
                >
                  <NoteBar
                    notation={note.notation}
                    notationIndex={note.notationIndex}
                    octave={note.octave}
                    startBars={note.start.bars}
                    startBeats={note.start.beats}
                    lengthBars={note.length.bars}
                    lengthBeats={note.length.beats}
                  >
                    <Draggable
                      axis="both"
                      onStart={(
                        event: DraggableEvent,
                        dragElement: DraggableData
                      ) => {
                        handleExtendNoteData(
                          event,
                          dragElement,
                          note.notationIndex,
                          note.octave,
                          note.start.bars,
                          note.start.beats
                        );
                      }}
                      onDrag={(
                        event: DraggableEvent,
                        dragElement: DraggableData
                      ) => {
                        handleExtendNoteLeft(
                          event,
                          dragElement,
                          note.notationIndex,
                          note.octave,
                          note.start.bars,
                          note.start.beats
                        );
                      }}
                      grid={[25, 0]}
                      position={{
                        x: 0,
                        y: 0,
                      }}
                      handle=".handle-NoteBarSide-Left"
                    >
                      {/* <NoteBarSide className="handle-NoteBar handle-NoteBarSide-Left" /> */}
                      <NoteBarSide className="handle-NoteBarSide-Left" />
                    </Draggable>
                    <NoteBarCenter
                      className="handle-NoteBar"
                      onDoubleClick={() => {
                        handleDeleteNote(
                          note.notationIndex,
                          note.octave,
                          note.start.bars,
                          note.start.beats
                        );
                      }}
                    />
                    <Draggable
                      axis="both"
                      onStart={(
                        event: DraggableEvent,
                        dragElement: DraggableData
                      ) => {
                        handleExtendNoteData(
                          event,
                          dragElement,
                          note.notationIndex,
                          note.octave,
                          note.start.bars,
                          note.start.beats
                        );
                      }}
                      onDrag={(
                        event: DraggableEvent,
                        dragElement: DraggableData
                      ) => {
                        handleExtendNoteRight(
                          event,
                          dragElement,
                          note.notationIndex,
                          note.octave,
                          note.start.bars,
                          note.start.beats
                        );
                      }}
                      grid={[25, 0]}
                      position={{
                        x: 0,
                        y: 0,
                      }}
                      handle=".handle-NoteBarSide-Right"
                    >
                      <NoteBarSide className="handle-NoteBarSide-Right" />
                    </Draggable>
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
