import {
  barWidthState,
  NoteData,
  ProjectData,
  TrackData,
} from "../../../store/atoms";
import styled from "styled-components";
import { useRecoilValue } from "recoil";

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

interface MidiBarProps {
  isPlaying: boolean;
  projectData: ProjectData;
  trackData: TrackData;
  barWidth: number;
}

const MidiBar = (props: MidiBarProps) => {
  const barWidth = useRecoilValue(barWidthState);

  return (
    <>
      <Clip barWidth={barWidth} length={100}>
        {props.trackData.clips[0].notes.length > 0 &&
          props.trackData.clips[0].notes.map((note: NoteData) => {
            return (
              <MidiNote
                key={`${note.notation}-${note.octave}-${note.start.bars}-${note.start.quarters}-${note.start.sixteenths}`}
                start={note.start}
                length={note.length}
                barWidth={barWidth}
                pitch={(note.octave - 1) * 12 + note.notationIndex}
                trackHeight={150}
              />
            );
          })}
      </Clip>
    </>
  );
};

export default MidiBar;
