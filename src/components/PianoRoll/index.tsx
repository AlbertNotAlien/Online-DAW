import styled from "styled-components";

import NoteRuler from "./NoteRuler";
import Notes from "./Notes";
import NotesPanel from "./NotesPanel";

const Container = styled.div`
  display: flex;

  /* width: 100vw; */

  /* transition: box-shadow 0.2s ease-in-out;
  &:hover {
    box-shadow: 0 0 10px #00000050;
    transition: box-shadow 0.2s ease-in-out;
  } */
  height: 100%;
  position: relative;
  overflow: auto;
`;

// const PianoRoll = styled.div`
//   display: flex;
//   flex-direction: column-reverse;
//   position: relative;
//   height: 100%;
// `;

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

  return (
    <Container>
      {/* <NoteRuler /> */}
      <Notes
        NOTATIONS={NOTATIONS}
        selectedTrackIndex={props.selectedTrackIndex}
      />
      <NotesPanel OCTAVES={OCTAVES} NOTATIONS={NOTATIONS} />
    </Container>
  );
}
