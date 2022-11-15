import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useRecoilValue } from "recoil";

import { hoverMidiInfoState } from "../../../lib/atoms";

interface NoteRulerInfoProps {
  // notation: string;
  notationIndex: number;
  octaveIndex: number;
}

const Container = styled.div`
  width: 100px;
  height: 720px;
`;

const NoteRulerInfo = styled.p<NoteRulerInfoProps>`
  width: 100px;
  height: 100%;

  margin: 0px;
  font-size: 15px;
  text-align: right;
  padding-right: 10px;
  bottom: ${(props) => props.octaveIndex}px;
`;

const NoteRuler = (props: any) => {
  const hoverMidiInfo = useRecoilValue(hoverMidiInfoState);

  return (
    <Container>
      {hoverMidiInfo && (
        <NoteRulerInfo
          // notation={hoverMidiInfo.notation}
          notationIndex={hoverMidiInfo.notationIndex}
          octaveIndex={hoverMidiInfo.octaveIndex}
        >
          {`${hoverMidiInfo.notation}${hoverMidiInfo.octaveIndex}`}
        </NoteRulerInfo>
      )}
    </Container>
  );
};

export default NoteRuler;
