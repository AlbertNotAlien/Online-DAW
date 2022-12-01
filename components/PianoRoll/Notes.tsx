import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import Draggable, { DraggableEvent } from "react-draggable";
import produce from "immer";

import {
  tracksDataState,
  playingNoteState,
  selectedTrackIndexState,
  projectDataState,
  ProjectData,
} from "../../context/atoms";

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
import { db } from "../../config/firebase";
import { storage } from "../../config/firebase";
import { listAll, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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

const Container = styled.div`
  display: flex;
  flex-direction: column-reverse;
  height: 720px;
  position: relative;
`;

const NoteBar = styled.div<NoteBarProps>`
  width: ${(props) =>
    (props.lengthBars * 16 +
      props.lengthQuarters * 4 +
      props.lengthSixteenths) *
    25}px;
  height: 10px;
  background: none;
  position: absolute;
  z-index: 1;
  display: flex;
  justify-content: space-between;
`;

const NoteBarCenter = styled.div`
  background-color: #f6ddcd;
  width: 100%;
  cursor: move;
`;

const NoteBarSide = styled.div`
  width: 5px;
  height: 10px;
  background-color: #f6ddcd;
  cursor: col-resize;
  z-index: 2;
`;

const Notes = (props: any) => {
  const [tracksData, setTracksData] = useRecoilState(tracksDataState);
  const setPlayingNote = useSetRecoilState(playingNoteState);
  const selectedTrackIndex = useRecoilValue(selectedTrackIndexState);
  const [projectData, setProjectData] =
    useRecoilState<ProjectData>(projectDataState);

  const prevNoteLengthRef = useRef(0);
  const prevNoteStartIndexRef = useRef(0);

  // const tracksData = useRecoilValue(tracksDataState);

  const handleDeleteNote = async (
    notation: string,
    notationIndex: number,
    octave: number,
    startBars: number,
    startQuarters: number,
    startSixteenths: number,
    lengthBars: number,
    lengthQuarters: number,
    lengthSixteenths: number
  ) => {
    console.log("handleDeleteNote");
    console.log("tracksData", tracksData);
    console.log("selectedTrackIndex", selectedTrackIndex);
    if (tracksData && selectedTrackIndex !== null) {
      try {
        const trackRef = doc(
          db,
          "projects",
          projectData.id,
          "tracks",
          tracksData[selectedTrackIndex].id
        );

        // const selectedNote = {
        //   notation: notation,
        //   notationIndex: notationIndex,
        //   octave: octave,
        //   start: {
        //     bars: startBars,
        //     quarters: startQuarters,
        //     sixteenths: startSixteenths,
        //   },
        //   length: {
        //     bars: lengthBars,
        //     quarters: lengthQuarters,
        //     sixteenths: lengthSixteenths,
        //   },
        // };

        const prevNotes = tracksData[selectedTrackIndex].clips[0].notes;

        const selectedNoteIndex = prevNotes.findIndex(
          (note) =>
            note.notationIndex === notationIndex &&
            note.octave === octave &&
            note.start.bars === startBars &&
            note.start.quarters === startQuarters &&
            note.start.sixteenths === startSixteenths
        );

        const newClips = produce(
          tracksData[selectedTrackIndex].clips,
          (draft) => {
            draft[0].notes.splice(selectedNoteIndex, 1);
          }
        );

        console.log(newClips);

        await updateDoc(trackRef, { clips: newClips });
        console.log("info uploaded");
      } catch (err) {
        console.log(err);
      }

      const newTracksData = produce(tracksData, (draft) => {
        draft[selectedTrackIndex].clips[0].notes = draft[
          selectedTrackIndex
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
      setTracksData(newTracksData);
    }
  };

  const handleSetNote = (
    event: DraggableEvent,
    dragElement: { x: number; y: number },
    notationIndex: number,
    octave: number,
    startBars: number,
    startQuarters: number,
    startSixteenths: number
  ) => {
    console.log("handleSetNote");
    if (tracksData && selectedTrackIndex) {
      const sixteenthsIndex = (dragElement.x - 25) / 25;
      const pitchIndex = -dragElement.y / 10;
      const prevNotes = tracksData[selectedTrackIndex].clips[0].notes;

      const selectedNoteIndex = prevNotes.findIndex(
        (note) =>
          note.notationIndex === notationIndex &&
          note.octave === octave &&
          note.start.bars === startBars &&
          note.start.quarters === startQuarters &&
          note.start.sixteenths === startSixteenths
      );

      // console.log("sixteenthsIndex", sixteenthsIndex);

      const newSixteenths = sixteenthsIndex % 4;
      const newQuarters = Math.floor((sixteenthsIndex % 16) / 4);
      const newBars = Math.floor(sixteenthsIndex / 16);

      const newNotationIndex = pitchIndex % 12;
      const newOctave = Math.floor(pitchIndex / 12) + 1;

      const newTracksData = produce(tracksData, (draft) => {
        const draftNotes =
          draft[selectedTrackIndex].clips[0].notes[selectedNoteIndex];

        draftNotes.start.sixteenths = newSixteenths;
        draftNotes.start.quarters = newQuarters;
        draftNotes.start.bars = newBars;

        draftNotes.octave = newOctave;
        draftNotes.notationIndex = newNotationIndex;
        draftNotes.notation = props.NOTATIONS[newNotationIndex];
      });
      setTracksData(newTracksData);
    }
  };

  const handleDragNote = (
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
    // console.log("handleDragNote");
    if (tracksData && selectedTrackIndex) {
      const pitchIndex = -dragElement.y / 10;
      const prevNotes = tracksData[selectedTrackIndex].clips[0].notes;

      const selectedNoteIndex = prevNotes.findIndex(
        (note) =>
          note.notationIndex === notationIndex &&
          note.octave === octave &&
          note.start.bars === startBars &&
          note.start.quarters === startQuarters &&
          note.start.sixteenths === startSixteenths
      );

      const newNotationIndex = pitchIndex % 12;
      const newNotation = props.NOTATIONS[newNotationIndex];
      console.log("pitchIndex", pitchIndex);
      const newOctave = Math.floor(pitchIndex / 12) + 1;

      if (
        newNotationIndex !== prevNotes[selectedNoteIndex].notationIndex ||
        newOctave !== prevNotes[selectedNoteIndex].octave
      ) {
        const newPlayingNote = {
          notation: newNotation,
          octave: newOctave,
        };
        console.log("newPlayingNote", newPlayingNote);
        setPlayingNote(newPlayingNote);
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
    if (tracksData && selectedTrackIndex) {
      const prevNotes = tracksData[selectedTrackIndex].clips[0].notes;
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
        prevNote.start.bars * 16 +
        prevNote.start.quarters * 4 +
        prevNote.start.sixteenths;
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
    if (tracksData && selectedTrackIndex) {
      const offsetSixteenths = dragElement.x / 25;
      const prevNotes = tracksData[selectedTrackIndex].clips[0].notes;

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
          draft[selectedTrackIndex].clips[0].notes[selectedNoteIndex];

        const sumLengthSixteenths =
          prevNoteLengthRef.current + offsetSixteenths <= 0
            ? 1
            : prevNoteLengthRef.current + offsetSixteenths;

        draftNotes.length.bars = Math.floor(sumLengthSixteenths / 16);
        draftNotes.length.quarters = Math.floor((sumLengthSixteenths % 16) / 4);
        draftNotes.length.sixteenths = sumLengthSixteenths % 4;
      });
      setTracksData(newTracksData);
    }
  };

  // const handleExtendNoteLeft = (
  //   event: DraggableEvent,
  //   dragElement: { x: number },
  //   notationIndex: number,
  //   octave: number,
  //   startBars: number,
  //   startQuarters: number,
  //   startSixteenths: number
  // ) => {
  //   if (tracksData && selectedTrackIndex) {
  //     console.log("-dragElement.x", -dragElement.x);
  //     const offsetSixteenths = -dragElement.x / 25;
  //     const prevNotes = tracksData[selectedTrackIndex].clips[0].notes;

  //     const selectedNoteIndex = prevNotes.findIndex(
  //       (note) =>
  //         note.notationIndex === notationIndex &&
  //         note.octave === octave &&
  //         note.start.bars === startBars &&
  //         note.start.quarters === startQuarters &&
  //         note.start.sixteenths === startSixteenths
  //     );

  //     const newTracksData = produce(tracksData, (draft) => {
  //       const draftNotes =
  //         draft[selectedTrackIndex].clips[0].notes[selectedNoteIndex];

  //       const newLengthSixteenths =
  //         prevNoteLengthRef.current + offsetSixteenths <= 0
  //           ? 1
  //           : prevNoteLengthRef.current + offsetSixteenths;

  //       draftNotes.length.bars = Math.floor(newLengthSixteenths / 16);
  //       draftNotes.length.quarters = Math.floor((newLengthSixteenths % 16) / 4);
  //       draftNotes.length.sixteenths = newLengthSixteenths % 4;

  //       const newStartSixteenthsIndex =
  //         prevNoteStartIndexRef.current - offsetSixteenths <= 0
  //           ? 0
  //           : prevNoteStartIndexRef.current - offsetSixteenths;

  //       const newStartSixteenths = newStartSixteenthsIndex % 4;
  //       const newStartQuarters = Math.floor((newStartSixteenthsIndex % 16) / 4);
  //       const newStartBars = Math.floor(newStartSixteenthsIndex / 16);

  //       draftNotes.start.bars = newStartBars;
  //       draftNotes.start.quarters = newStartQuarters;
  //       draftNotes.start.sixteenths = newStartSixteenths;
  //     });
  //     setTracksData(newTracksData);
  //   }
  // };

  return (
    <Container>
      {tracksData &&
        selectedTrackIndex !== null &&
        tracksData[selectedTrackIndex]?.type === "midi" &&
        tracksData[selectedTrackIndex].clips[0].notes.map(
          (note: {
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
          }) => {
            return (
              <Draggable
                axis="both"
                onStop={(event: DraggableEvent, dragElement: DraggableData) =>
                  handleSetNote(
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
                  handleDragNote(
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
                    (note.start.bars * 16 +
                      note.start.quarters * 4 +
                      note.start.sixteenths) *
                      25 +
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
                  {/* <Draggable
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
                    <NoteBarSide className="handle-NoteBarSide-Left" />
                  </Draggable> */}
                  <NoteBarCenter
                    onDoubleClick={() => {
                      console.log("onDoubleClick handleDeleteNote");
                      handleDeleteNote(
                        note.notation,
                        note.notationIndex,
                        note.octave,
                        note.start.bars,
                        note.start.quarters,
                        note.start.sixteenths,
                        note.length.bars,
                        note.length.quarters,
                        note.length.sixteenths
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
    </Container>
  );
};

export default Notes;
