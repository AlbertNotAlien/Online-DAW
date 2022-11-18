import styled from "styled-components";
import { useRecoilState, useRecoilValue } from "recoil";

import {
  barWidthState,
  projectDataState,
  NoteData,
} from "../../../../lib/atoms";

interface MidiRegionProps {
  barWidth: number;
  length: number;
}

interface MidiNoteProps {
  length: {
    bars: number;
    quarters: number;
    sixteenths: number;
  };
  barWidth: number;
  start: {
    bars: number;
    quarters: number;
    sixteenths: number;
  };
  pitch: number;
  trackHeight: number;
}

const Clip = styled.div<MidiRegionProps>`
  width: ${(props) => props.barWidth * props.length}px;
  height: 130px;
  background-color: #ffffff20;
  position: relative;
  pointer-events: none;
  z-index: 1;
`;

const MidiNote = styled.div<MidiNoteProps>`
  width: ${(props) =>
    (props.length.bars * 16 +
      props.length.quarters * 4 +
      props.length.sixteenths) *
    props.barWidth *
    0.25}px;
  /* width: 10px; */
  height: ${(150 - 30) / 72}px;
  background-color: #ffffff;
  border: 1px solid #ffffff;
  position: absolute;
  bottom: ${(props) =>
    (props.pitch * (props.trackHeight - 20)) / (6 * 12 + 1)}px;
  left: ${(props) =>
    (props.start.bars * 16 +
      props.start.quarters * 4 +
      props.start.sixteenths) *
    props.barWidth *
    0.25}px;
  /* left: 0px; */
`;

const TrackNotes = (props: any) => {
  const [barWidth, setBarWidth] = useRecoilState(barWidthState);
  const projectData = useRecoilValue(projectDataState);

  return (
    <>
      <Clip barWidth={barWidth} length={100}>
        {props.trackData.clips[0].notes.map((note: NoteData, index: number) => {
          return (
            <MidiNote
              key={`${note.notation}-${note.octave}-${note.start.bars}-${note.start.quarters}-${note.start.sixteenths}`}
              start={note.start}
              length={note.length}
              barWidth={barWidth}
              pitch={(note.octave - 1) * 12 + note.notationIndex}
              trackHeight={projectData?.trackHeight}
            />
          );
        })}
      </Clip>
    </>
  );
};

export default TrackNotes;
