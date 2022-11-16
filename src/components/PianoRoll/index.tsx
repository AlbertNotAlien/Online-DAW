import styled from "styled-components";

import NoteRuler from "./NoteRuler";
import Notes from "./Notes";
import NotesPanel from "./NotesPanel";

const Container = styled.div`
  display: flex;
`;

const PianoRoll = styled.div`
  display: flex;
  flex-direction: column-reverse;
  position: relative;
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
  const BARS: number = 4;

  return (
    <Container>
      {/* <NoteRuler /> */}
      <PianoRoll>
        <Notes
          NOTATIONS={NOTATIONS}
          selectedTrackIndex={props.selectedTrackIndex}
        />
        <NotesPanel OCTAVES={OCTAVES} NOTATIONS={NOTATIONS} BARS={BARS} />
      </PianoRoll>
    </Container>
  );
}
