import styled from "styled-components";
import { useState, memo } from "react";
import { TrackData, hoverMidiInfo, ProjectData } from "../../store/atoms";
import NoteRuler from "./NoteRuler";
import Notes from "./Notes";
import NotesPanel from "./NotesPanel";


const Container = styled.div`
  display: flex;
  height: 100%;
  /* width: 500px; */
  width: 100%;
  position: relative;
  overflow: auto;
`;

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

interface PianoRollProps {
  projectId: string;
  projectData: ProjectData;
  tracksData: TrackData[];
  selectedTrackId: string | null;
  selectedTrackIndex: number;
}

const PianoRoll = (props: PianoRollProps) => {
  const [hoverNote, setHoverNote] = useState<hoverMidiInfo | null>(null);

  return (
    <Container>
      <NoteRuler hoverNote={hoverNote} />
      <Notes
        NOTATIONS={NOTATIONS}
        selectedTrackIndex={props.selectedTrackIndex}
      />
      <NotesPanel
        NOTATIONS={NOTATIONS}
        selectedTrackIndex={props.selectedTrackIndex}
        setHoverNote={setHoverNote}
      />
    </Container>
  );
};

export default memo(PianoRoll);
