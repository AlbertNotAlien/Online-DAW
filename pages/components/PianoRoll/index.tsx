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

interface DraggableData {
  node: HTMLElement;
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
  lastX: number;
  lastY: number;
}

interface NoteBarProps {
  notation: string;
  notationIndex: number;
  octave: number;
  startBars: number;
  startQuarters: number;
  startSixteenths: number;
  lengthBars: number;
  lengthQuarters: number;
  lengthSixteenths: number;
}

interface PianoKeysProps {
  notation: string;
}

interface SixteenthBlockProps {
  notation: string;
  barsIndex: number;
  quartersIndex: number;
  sixteenthsIndex: number;
}

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

const PianoKey = styled.button<PianoKeysProps>`
  width: 25px;
  height: 10px;
  border: none;
  border-right: 1px solid black;
  border-top: 1px solid black;
  background-color: ${(props) =>
    props.notation.length > 1 ? "black" : "white"};
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

// const MidiKeys = styled.div`
//   display: flex;
// `;

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

const NoteBar = styled(MidiBlock)<NoteBarProps>`
  width: ${(props) =>
    (props.lengthBars * 16 +
      props.lengthQuarters * 4 +
      props.lengthSixteenths) *
    25}px;
  background: none;
  position: absolute;
  z-index: 1;
  display: flex;
  justify-content: space-between;
`;

const NoteBarCenter = styled.div`
  background-color: red;
  width: 100%;
  cursor: move;
`;

const NoteBarSide = styled.div`
  width: 5px;
  height: 10px;
  background-color: blue;
  cursor: col-resize;
  z-index: 2;
`;

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

  const [hoverNote, setHoverNote] = useState("G5");
  const [tracksData, setTracksdata] = useRecoilState(tracksDataState);
  const [playingNote, setPlayingNote] = useRecoilState(playingNoteState);
  const prevNoteLengthRef = useRef(0);
  const prevNoteStartIndexRef = useRef(0);

  // console.log("tracksData", tracksData);

  const handleAddNote = (
    notation: string,
    notationIndex: number,
    octave: number,
    startBars: number,
    startQuarters: number,
    startSixteenths: number
  ) => {
    console.log("handleAddNote");
    if (tracksData && props.selectedTrackIndex) {
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
      console.log("newNote", newNote);

      const newTracksData = produce(tracksData, (draft) => {
        draft[props.selectedTrackIndex].clips[0].notes.push(newNote);
      });
      // console.log("newTracksData", newTracksData);
      setTracksdata(newTracksData);

      const newPlayingNote = {
        notation: notation,
        octave: octave,
        length: {
          bars: 0,
          quarters: 0,
          sixteenths: 1,
        },
      };
      setPlayingNote(newPlayingNote);
    }
  };

  const handleDeleteNote = (
    notationIndex: number,
    octave: number,
    startBars: number,
    startQuarters: number,
    startSixteenths: number
  ) => {
    console.log("handleDeleteNote");
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
              note.start.quarters === startQuarters &&
              note.start.sixteenths === startSixteenths
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
    startQuarters: number,
    startSixteenths: number
  ) => {
    console.log("handleDragNote");
    if (tracksData && props.selectedTrackIndex) {
      const sixteenthsIndex = (dragElement.x - 25) / 25;
      const pitchIndex = -dragElement.y / 10;
      const prevNotes = tracksData[props.selectedTrackIndex].clips[0].notes;

      const selectedNoteIndex = prevNotes.findIndex(
        (note) =>
          note.notationIndex === notationIndex &&
          note.octave === octave &&
          note.start.bars === startBars &&
          note.start.quarters === startQuarters &&
          note.start.sixteenths === startSixteenths
      );

      // console.log("sixteenthsIndex", sixteenthsIndex);

      const newSixteenths = (sixteenthsIndex % 4) + 1;
      const newQuarters = Math.floor((sixteenthsIndex % 16) / 4) + 1;
      const newBars = Math.floor(sixteenthsIndex / 16) + 1;

      const newNotationIndex = pitchIndex % 12;
      const newOctave = Math.floor(pitchIndex / 12) + 1;

      const newTracksData = produce(tracksData, (draft) => {
        const draftNotes =
          draft[props.selectedTrackIndex].clips[0].notes[selectedNoteIndex];

        draftNotes.start.sixteenths = newSixteenths;
        draftNotes.start.quarters = newQuarters;
        draftNotes.start.bars = newBars;

        draftNotes.octave = newOctave;
        draftNotes.notationIndex = newNotationIndex;
        draftNotes.notation = NOTATIONS[newNotationIndex];
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
    startQuarters: number,
    startSixteenths: number,
    lengthBars: number,
    lengthQuarters: number,
    lengthSixteenths: number
  ) => {
    console.log("handleMoveNote");
    if (tracksData && props.selectedTrackIndex) {
      const pitchIndex = -dragElement.y;
      const prevNotes = tracksData[props.selectedTrackIndex].clips[0].notes;

      const selectedNoteIndex = prevNotes.findIndex(
        (note) =>
          note.notationIndex === notationIndex &&
          note.octave === octave &&
          note.start.bars === startBars &&
          note.start.quarters === startQuarters &&
          note.start.sixteenths === startSixteenths
      );

      const newNotationIndex = pitchIndex % 12;
      const newNotation = NOTATIONS[newNotationIndex];
      const newOctave = Math.floor(pitchIndex / 12) + 1;

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
            quarters: lengthQuarters,
            sixteenths: lengthSixteenths,
          },
        };
        // setPlayingNote(newPlayingNote);
      }
    }
  };

  const handlePrevNoteData = (
    event: DraggableEvent,
    dragElement: { x: number },
    notationIndex: number,
    octave: number,
    startBars: number,
    startQuarters: number,
    startSixteenths: number
  ) => {
    console.log("handlePrevNoteData");
    if (tracksData && props.selectedTrackIndex) {
      const prevNotes = tracksData[props.selectedTrackIndex].clips[0].notes;
      const selectedNoteIndex = prevNotes.findIndex(
        (note) =>
          note.notationIndex === notationIndex &&
          note.octave === octave &&
          note.start.bars === startBars &&
          note.start.quarters === startQuarters &&
          note.start.sixteenths === startSixteenths
      );
      const prevNote = prevNotes[selectedNoteIndex];

      prevNoteLengthRef.current =
        prevNote.length.bars * 16 +
        prevNote.length.quarters * 4 +
        prevNote.length.sixteenths;
      prevNoteStartIndexRef.current =
        (prevNote.start.bars - 1) * 16 +
        (prevNote.start.quarters - 1) * 4 +
        (prevNote.start.sixteenths - 1);
    }
    console.log("prevNoteLengthRef.current", prevNoteLengthRef.current);
    console.log("prevNoteStartIndexRef.current", prevNoteStartIndexRef.current);
  };

  const handleExtendNoteRight = (
    event: DraggableEvent,
    dragElement: { x: number },
    notationIndex: number,
    octave: number,
    startBars: number,
    startQuarters: number,
    startSixteenths: number
  ) => {
    if (tracksData && props.selectedTrackIndex) {
      const offsetSixteenths = dragElement.x / 25;
      const prevNotes = tracksData[props.selectedTrackIndex].clips[0].notes;

      const selectedNoteIndex = prevNotes.findIndex(
        (note) =>
          note.notationIndex === notationIndex &&
          note.octave === octave &&
          note.start.bars === startBars &&
          note.start.quarters === startQuarters &&
          note.start.sixteenths === startSixteenths
      );

      const newTracksData = produce(tracksData, (draft) => {
        const draftNotes =
          draft[props.selectedTrackIndex].clips[0].notes[selectedNoteIndex];

        const sumLengthSixteenths =
          prevNoteLengthRef.current + offsetSixteenths <= 0
            ? 1
            : prevNoteLengthRef.current + offsetSixteenths;

        draftNotes.length.bars = Math.floor(sumLengthSixteenths / 16);
        draftNotes.length.quarters = Math.floor((sumLengthSixteenths % 16) / 4);
        draftNotes.length.sixteenths = sumLengthSixteenths % 4;
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
    startQuarters: number,
    startSixteenths: number
  ) => {
    if (tracksData && props.selectedTrackIndex) {
      console.log("-dragElement.x", -dragElement.x);
      const offsetSixteenths = -dragElement.x / 25;
      const prevNotes = tracksData[props.selectedTrackIndex].clips[0].notes;

      const selectedNoteIndex = prevNotes.findIndex(
        (note) =>
          note.notationIndex === notationIndex &&
          note.octave === octave &&
          note.start.bars === startBars &&
          note.start.quarters === startQuarters &&
          note.start.sixteenths === startSixteenths
      );

      const newTracksData = produce(tracksData, (draft) => {
        const draftNotes =
          draft[props.selectedTrackIndex].clips[0].notes[selectedNoteIndex];

        const newLengthSixteenths =
          prevNoteLengthRef.current + offsetSixteenths <= 0
            ? 1
            : prevNoteLengthRef.current + offsetSixteenths;

        draftNotes.length.bars = Math.floor(newLengthSixteenths / 16);
        draftNotes.length.quarters = Math.floor((newLengthSixteenths % 16) / 4);
        draftNotes.length.sixteenths = newLengthSixteenths % 4;

        const newStartSixteenthsIndex =
          prevNoteStartIndexRef.current - offsetSixteenths <= 0
            ? 0
            : prevNoteStartIndexRef.current - offsetSixteenths;

        const newStartSixteenths = (newStartSixteenthsIndex % 4) + 1;
        const newStartQuarters =
          Math.floor((newStartSixteenthsIndex % 16) / 4) + 1;
        const newStartBars = Math.floor(newStartSixteenthsIndex / 16) + 1;

        draftNotes.start.bars = newStartBars;
        draftNotes.start.quarters = newStartQuarters;
        draftNotes.start.sixteenths = newStartSixteenths;
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
  //         quarters: startQuarters,
  //       },
  //       length: {
  //         bars: 0,
  //         quarters: 1,
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
        <NoteRulerInfo>{hoverNote}</NoteRulerInfo>
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
                  quarters: number;
                  sixteenths: number;
                };
                length: {
                  bars: number;
                  quarters: number;
                  sixteenths: number;
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
                      note.start.quarters,
                      note.start.sixteenths
                    )
                  }
                  onDrag={(event: DraggableEvent, dragElement: DraggableData) =>
                    handleMoveNote(
                      event,
                      dragElement,
                      note.notationIndex,
                      note.octave,
                      note.start.bars,
                      note.start.quarters,
                      note.start.sixteenths,
                      note.length.bars,
                      note.length.quarters,
                      note.length.sixteenths
                    )
                  }
                  grid={[25, 10]}
                  position={{
                    x:
                      ((note.start.bars - 1) * 16 +
                        (note.start.quarters - 1) * 4 +
                        (note.start.sixteenths - 1) +
                        1) *
                      25,
                    y: ((note.octave - 1) * 12 + note.notationIndex) * -10,
                  }}
                  handle=".handle-NoteBar"
                  key={`NoteBar-${note.notation}-${note.octave}-${note.start.bars}-${note.start.quarters}-${note.start.sixteenths}`}
                >
                  <NoteBar
                    notation={note.notation}
                    notationIndex={note.notationIndex}
                    octave={note.octave}
                    startBars={note.start.bars}
                    startQuarters={note.start.quarters}
                    startSixteenths={note.start.sixteenths}
                    lengthBars={note.length.bars}
                    lengthQuarters={note.length.quarters}
                    lengthSixteenths={note.length.sixteenths}
                  >
                    <Draggable
                      axis="both"
                      onStart={(
                        event: DraggableEvent,
                        dragElement: DraggableData
                      ) => {
                        handlePrevNoteData(
                          event,
                          dragElement,
                          note.notationIndex,
                          note.octave,
                          note.start.bars,
                          note.start.quarters,
                          note.start.sixteenths
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
                          note.start.quarters,
                          note.start.sixteenths
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
                        console.log("onDoubleClick handleDeleteNote");
                        handleDeleteNote(
                          note.notationIndex,
                          note.octave,
                          note.start.bars,
                          note.start.quarters,
                          note.start.sixteenths
                        );
                      }}
                    />
                    <Draggable
                      axis="both"
                      onStart={(
                        event: DraggableEvent,
                        dragElement: DraggableData
                      ) => {
                        handlePrevNoteData(
                          event,
                          dragElement,
                          note.notationIndex,
                          note.octave,
                          note.start.bars,
                          note.start.quarters,
                          note.start.sixteenths
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
                          note.start.quarters,
                          note.start.sixteenths
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
          <OctaveWrapper key={octaveIndex}>
            {NOTATIONS.map((notation, notationIndex) => (
              <NoationWrapper
                key={`${notation}-${notationIndex}`}
                onMouseLeave={() => {
                  setHoverNote("");
                }}
              >
                <PianoKey notation={notation} onClick={() => {}} />
                {new Array(4).fill(0).map((_, barsIndex) => (
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
                                barsIndex + 1,
                                quartersIndex + 1,
                                sixteenthsIndex + 1
                              );
                              // tracksData[2].clips[0].notes.forEach((note) => {
                              //   console.log("note", note);
                              // });
                            }}
                            onMouseOver={() => {
                              setHoverNote(
                                `
                                notation${notation}
                                octave${octaveIndex + 1}
                                bars${barsIndex + 1}
                                quarters${quartersIndex + 1}
                                sixteenths${sixteenthsIndex + 1}
                                `
                              );
                            }}
                            notation={notation}
                            barsIndex={barsIndex}
                            quartersIndex={quartersIndex}
                            sixteenthsIndex={sixteenthsIndex}
                            key={`
                              ${notation}-${octaveIndex + 1}-${barsIndex + 1}-${
                              quartersIndex + 1
                            }-${sixteenthsIndex + 1}`}
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
      </PianoRoll>
    </Container>
  );
}
