import { useRef } from "react";
import styled from "styled-components";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import Draggable, { DraggableEvent } from "react-draggable";
import produce from "immer";

import { doc, updateDoc } from "firebase/firestore";
import {
  NoteData,
  playingNoteState,
  ProjectData,
  projectDataState,
  selectedTrackIndexState,
  tracksDataState,
} from "../../store/atoms";
import { db } from "../../config/firebase";

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

interface NotesProps {
  NOTATIONS: string[];
  selectedTrackIndex: number | null;
}

const Notes = (props: NotesProps) => {
  const [tracksData, setTracksData] = useRecoilState(tracksDataState);
  const setPlayingNote = useSetRecoilState(playingNoteState);
  const selectedTrackIndex = useRecoilValue(selectedTrackIndexState);
  const projectData = useRecoilValue<ProjectData>(projectDataState);

  const prevNoteLengthRef = useRef(0);
  const prevNoteStartIndexRef = useRef(0);

  const handleDeleteNote = async (
    notation: string,
    notationIndex: number,
    octave: number,
    startBars: number,
    startQuarters: number,
    startSixteenths: number
  ) => {
    if (!tracksData || selectedTrackIndex === null) return;
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

    try {
      const trackRef = doc(
        db,
        "projects",
        projectData.id,
        "tracks",
        tracksData[selectedTrackIndex].id
      );

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

      await updateDoc(trackRef, { clips: newClips });
    } catch (err) {
      console.log(err);
    }
  };

  const handleSetNote = async (
    event: DraggableEvent,
    dragElement: { x: number; y: number },
    notationIndex: number,
    octave: number,
    startBars: number,
    startQuarters: number,
    startSixteenths: number
  ) => {
    if (!tracksData || selectedTrackIndex === null) return;
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

    const newBars = Math.floor(sixteenthsIndex / 16);
    const newQuarters = Math.floor((sixteenthsIndex % 16) / 4);
    const newSixteenths = sixteenthsIndex % 4;

    const newNotationIndex = pitchIndex % 12;
    const newOctave = Math.floor(pitchIndex / 12) + 1;

    const newTracksData = produce(tracksData, (draft) => {
      const draftNote =
        draft[selectedTrackIndex].clips[0].notes[selectedNoteIndex];

      draftNote.start.bars = newBars;
      draftNote.start.quarters = newQuarters;
      draftNote.start.sixteenths = newSixteenths;

      draftNote.octave = newOctave;
      draftNote.notationIndex = newNotationIndex;
      draftNote.notation = props.NOTATIONS[newNotationIndex];
    });
    setTracksData(newTracksData);

    try {
      const trackRef = doc(
        db,
        "projects",
        projectData.id,
        "tracks",
        tracksData[selectedTrackIndex].id
      );

      const newClips = produce(
        tracksData[selectedTrackIndex].clips,
        (draft) => {
          draft[0].notes[selectedNoteIndex].start.sixteenths = newSixteenths;
          draft[0].notes[selectedNoteIndex].start.quarters = newQuarters;
          draft[0].notes[selectedNoteIndex].start.bars = newBars;

          draft[0].notes[selectedNoteIndex].octave = newOctave;
          draft[0].notes[selectedNoteIndex].notationIndex = newNotationIndex;
          draft[0].notes[selectedNoteIndex].notation =
            props.NOTATIONS[newNotationIndex];
        }
      );

      await updateDoc(trackRef, { clips: newClips });
    } catch (err) {
      console.log(err);
    }
  };

  const handleNotePreview = (
    event: DraggableEvent,
    dragElement: { x: number; y: number },
    notationIndex: number,
    octave: number,
    startBars: number,
    startQuarters: number,
    startSixteenths: number
  ) => {
    if (!tracksData || selectedTrackIndex === null) return;

    const pitchIndex = -dragElement.y / 10;
    const prevNotes = tracksData[selectedTrackIndex].clips[0].notes;

    const selectedNoteIndex = prevNotes.findIndex(
      (note: NoteData) =>
        note.notationIndex === notationIndex &&
        note.octave === octave &&
        note.start.bars === startBars &&
        note.start.quarters === startQuarters &&
        note.start.sixteenths === startSixteenths
    );

    const newNotationIndex = pitchIndex % 12;
    const newNotation = props.NOTATIONS[newNotationIndex];
    const newOctave = Math.floor(pitchIndex / 12) + 1;

    if (
      newNotationIndex !== prevNotes[selectedNoteIndex].notationIndex ||
      newOctave !== prevNotes[selectedNoteIndex].octave
    ) {
      const newPlayingNote = {
        notation: newNotation,
        octave: newOctave,
      };
      setPlayingNote(newPlayingNote);
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
    if (!tracksData || selectedTrackIndex === null) return;

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
  };

  const handleExtendNoteRight = async (
    event: DraggableEvent,
    dragElement: { x: number },
    notationIndex: number,
    octave: number,
    startBars: number,
    startQuarters: number,
    startSixteenths: number
  ) => {
    if (!tracksData || selectedTrackIndex === null) return;

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

    const sumLengthSixteenths =
      prevNoteLengthRef.current + offsetSixteenths <= 0
        ? 1
        : prevNoteLengthRef.current + offsetSixteenths;

    const newLengthBars = Math.floor(sumLengthSixteenths / 16);
    const newLengthQuarters = Math.floor((sumLengthSixteenths % 16) / 4);
    const newLengthSixteenths = sumLengthSixteenths % 4;

    const newTracksData = produce(tracksData, (draft) => {
      const draftNote =
        draft[selectedTrackIndex].clips[0].notes[selectedNoteIndex];

      draftNote.length.bars = newLengthBars;
      draftNote.length.quarters = newLengthQuarters;
      draftNote.length.sixteenths = newLengthSixteenths;
    });
    setTracksData(newTracksData);

    try {
      const trackRef = doc(
        db,
        "projects",
        projectData.id,
        "tracks",
        tracksData[selectedTrackIndex].id
      );

      const newClips = produce(
        tracksData[selectedTrackIndex].clips,
        (draft) => {
          draft[0].notes[selectedNoteIndex].length.bars = newLengthBars;
          draft[0].notes[selectedNoteIndex].length.quarters = newLengthQuarters;
          draft[0].notes[selectedNoteIndex].length.sixteenths =
            newLengthSixteenths;
        }
      );

      await updateDoc(trackRef, { clips: newClips });
    } catch (err) {
      console.log(err);
    }
  };

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
                onStop={(event: DraggableEvent, dragElement: DraggableData) => {
                  handleSetNote(
                    event,
                    dragElement,
                    note.notationIndex,
                    note.octave,
                    note.start.bars,
                    note.start.quarters,
                    note.start.sixteenths
                  );
                }}
                onDrag={(event: DraggableEvent, dragElement: DraggableData) => {
                  handleNotePreview(
                    event,
                    dragElement,
                    note.notationIndex,
                    note.octave,
                    note.start.bars,
                    note.start.quarters,
                    note.start.sixteenths
                  );
                }}
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
                  <NoteBarCenter
                    onDoubleClick={() => {
                      handleDeleteNote(
                        note.notation,
                        note.notationIndex,
                        note.octave,
                        note.start.bars,
                        note.start.quarters,
                        note.start.sixteenths
                      );
                    }}
                    className="handle-NoteBar"
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
