import { useState, memo } from "react";
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
  position: relative;
  overflow: auto;
`;

const PianoRoll = (props: any) => {
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

  const [hoverNote, setHoverNote] = useState<hoverMidiInfoState | null>(null);

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
        hoverNote={hoverNote}
      />
    </Container>
  );
};

export default PianoRoll;
