import { useState, useEffect } from "react";
import styled from "styled-components";

const PianoRoll = styled.div`
  display: flex;
  flex-direction: column;
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
  & + & {
    border-bottom: red;
  }
`;

const BlackKeys = styled(MidiKeys)``;

const PianoWhiteKey = styled(PianoKey)`
  background-color: white;
  & + & {
    border-bottom: red;
  }
`;

const PianoBlackKey = styled(PianoKey)`
  background-color: black;
`;

const MidiColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const MidiBlock = styled.div`
  width: 25px;
  height: 10px;
  /* border-bottom: 1px solid gray; */
  border-right: 1px solid gray;
  background-color: darkcyan;
  &:hover {
    filter: brightness(120%);
  }
`;

const MidiBlockRowEnd = styled.div`
  &:last-child {
    border-right: 1px solid blue;
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

export default function App() {
  const OCTAVE: number = 6;
  const MUISCALSCALE: string[] = [
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
    <>
      <PianoRoll>
        {new Array(OCTAVE).fill(0).map((_, octaveIndex) => (
          <MidiColumn key={octaveIndex}>
            {MUISCALSCALE.map((note, index) => (
              <div key={index}>
                {note.length === 1 ? (
                  <WhiteKeys key={index}>
                    <PianoWhiteKey onClick={() => {}} />
                    {new Array(4).fill(0).map((_, index) => (
                      <>
                        {new Array(4).fill(0).map((_, index) => (
                          <MidiBlockWhiteKeyDark
                            onClick={() => {}}
                            key={index}
                          />
                        ))}
                        {new Array(4).fill(0).map((_, index) => (
                          <MidiBlockWhiteKeyBright
                            onClick={() => {}}
                            key={index}
                          />
                        ))}
                      </>
                    ))}
                  </WhiteKeys>
                ) : (
                  <BlackKeys key={index}>
                    <PianoBlackKey onClick={() => {}} />
                    {new Array(4).fill(0).map((_, index) => (
                      <>
                        {new Array(4).fill(0).map((_, index) => (
                          <MidiBlockBlackKeyDark
                            onClick={() => {}}
                            key={index}
                          />
                        ))}
                        {new Array(4).fill(0).map((_, index) => (
                          <MidiBlockBlackKeyBright
                            onClick={() => {}}
                            key={index}
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
    </>
  );
}
