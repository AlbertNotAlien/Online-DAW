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
  width: number;
  barWidth: number;
  startTime: number;
  pitch: number;
  trackHeight: number;
}

const MidiRegion = styled.div<MidiRegionProps>`
  width: ${(props) => props.barWidth * props.length}px;
  height: 130px;
  background-color: #ffffff20;
  position: relative;
`;

const MidiNote = styled.div<MidiNoteProps>`
  width: ${(props) => props.width * 0.5}px;
  height: ${(150 - 30) / 72}px;
  background-color: #ffffff;
  border: 1px solid #ffffff;
  position: absolute;
  bottom: ${(props) =>
    (props.pitch * (props.trackHeight - 20)) / (6 * 12 + 1)}px;
  left: ${(props) => props.barWidth * props.startTime * 0.25}px;
`;

const TrackNotes = (props: any) => {
  const [barWidth, setBarWidth] = useRecoilState(barWidthState);
  const projectData = useRecoilValue(projectDataState);

  return (
    <>
      <MidiRegion barWidth={barWidth} length={100}>
        {props.trackData.clips[0].notes.map((note: NoteData, index: number) => {
          // console.log(note);
          // console.log(barWidth);
          return (
            <MidiNote
              key={`${note.notation}-${note.octave}-${note.start.bars}-${note.start.quarters}-${note.start.sixteenths}`}
              startTime={
                (note.start.bars - 1) * 16 +
                (note.start.quarters - 1) * 4 +
                (note.start.sixteenths - 1)
              }
              width={
                (note.length.bars * 16 +
                  note.length.quarters * 4 +
                  note.length.sixteenths) *
                barWidth
              }
              barWidth={barWidth}
              pitch={(note.octave - 1) * 12 + note.notationIndex}
              trackHeight={projectData?.trackHeight}
            />
          );
        })}
      </MidiRegion>
    </>
  );
};

export default TrackNotes;
