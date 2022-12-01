import { useState, memo, useCallback } from "react";
import styled from "styled-components";

import NoteRuler from "./NoteRuler";
import Notes from "./Notes";
import NotesPanel from "./NotesPanel";

import {
  tracksDataState,
  projectDataState,
  playingNoteState,
  selectedTrackIdState,
  selectedTrackIndexState,
  barWidthState,
  progressState,
  isPlayingState,
  isMetronomeState,
  isLoadingState,
  playerStatusState,
  TrackData,
  NoteData,
  AudioData,
  ClipData,
  inputProgressState,
  hoverMidiInfoState,
} from "../../context/atoms";

const Container = styled.div`
  display: flex;
  height: 100%;
  width: 500px;
  width: 100%;
  position: relative;
  overflow: auto;
`;

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

const PianoRoll = (props: any) => {
  const [hoverNote, setHoverNote] = useState<hoverMidiInfoState | null>(null);

  console.log("PianoRoll");

  return (
    <Container>
      <NoteRuler hoverNote={hoverNote} />
      <Notes
        NOTATIONS={NOTATIONS}
        selectedTrackIndex={props.selectedTrackIndex}
      />
      <NotesPanel
        OCTAVES={OCTAVES}
        NOTATIONS={NOTATIONS}
        selectedTrackIndex={props.selectedTrackIndex}
        setHoverNote={setHoverNote}
      />
    </Container>
  );
};

export default memo(PianoRoll);
