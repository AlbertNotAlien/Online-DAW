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
  justify-content: flex-end;
`;

const NoteRulerInfo = styled.p<hoverMidiInfoState>`
  width: 30px;
  height: 720px;
  margin: 0px;
  font-size: 12px;
  text-align: right;
  margin-top: ${(props) =>
    720 - ((props.octaveIndex - 1) * 12 + props.notationIndex + 1) * 10}px;
  margin-right: 10px;
  /* bottom: 0px; */
`;

const NoteRuler = (props: any) => {
  return (
    <Container>
      <NoteRulerInfo
        notation={props.hoverNote?.notation}
        notationIndex={props.hoverNote?.notationIndex}
        octaveIndex={props.hoverNote?.octaveIndex}
      >
        {props.hoverNote
          ? `${props.hoverNote.notation}${props.hoverNote.octaveIndex}`
          : ""}
      </NoteRulerInfo>
    </Container>
  );
};

export default NoteRuler;
