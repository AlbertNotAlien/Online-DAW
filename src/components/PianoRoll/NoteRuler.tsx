import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useRecoilValue } from "recoil";

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
  height: 720px;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const NoteRulerInfoWrapper = styled.div`
  width: 30px;
  height: 720px;
  display: flex;
  align-items: flex-end;
  font-size: 10px;
  text-align: right;
  display: flex;
`;

interface NoteRulerInfo {
  octaveIndex: number;
  notationIndex: number;
  notation: string;
}

const NoteRulerInfo = styled.div<NoteRulerInfo>`
  border-bottom: 1px solid black;
  margin-bottom: ${(props) =>
    ((props.octaveIndex - 1) * 12 + props.notationIndex) * 10}px;
`;

const OctaveInfoWrapper = styled(NoteRulerInfoWrapper)`
  position: absolute;
`;

const OctaveInfo = styled.div<OctaveInfoProps>`
  border-bottom: 1px solid black;
  margin-bottom: ${(props) => props.octaveIndex * 12 * 10}px;
  display: ${(props) => (props.isClosedToOctaveInfo ? "none" : "inherit")};
`;

interface OctaveInfoProps {
  isClosedToOctaveInfo: boolean;

  octaveIndex: number;
}

const NoteRuler = (props: any) => {
  return (
    <Container>
      <NoteRulerInfoWrapper>
        <NoteRulerInfo
          notation={props.hoverNote?.notation}
          notationIndex={props.hoverNote?.notationIndex}
          octaveIndex={props.hoverNote?.octaveIndex}
        >
          {props.hoverNote
            ? `${props.hoverNote.notation}${props.hoverNote.octaveIndex}`
            : ""}
        </NoteRulerInfo>
      </NoteRulerInfoWrapper>
      {new Array(6).fill(0).map((_, octaveIndex) => (
        <OctaveInfoWrapper key={octaveIndex}>
          <OctaveInfo
            octaveIndex={octaveIndex}
            isClosedToOctaveInfo={
              Math.abs(
                props.hoverNote?.octaveIndex * 12 +
                  props.hoverNote?.notationIndex -
                  octaveIndex * 12
              ) < 2 && props.hoverNote?.octaveIndex === octaveIndex
            }
          >{`C${octaveIndex}`}</OctaveInfo>
        </OctaveInfoWrapper>
      ))}
    </Container>
  );
};

export default NoteRuler;
