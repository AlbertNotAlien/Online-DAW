import styled from "styled-components";
import { hoverMidiInfo } from "../../store/atoms";

const Container = styled.div`
  height: 720px;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const HoverNoteInfoWrapper = styled.div`
  width: 30px;
  height: 720px;
  display: flex;
  align-items: flex-end;
  font-size: 10px;
  text-align: right;
  display: flex;
`;

interface NoteRulerInfoProps {
  notation: string;
  notationIndex: number;
  octaveIndex: number;
}

const HoverNoteInfo = styled.div<NoteRulerInfoProps>`
  border-bottom: 1px solid black;
  margin-bottom: ${(props) =>
    ((props.octaveIndex - 1) * 12 + props.notationIndex) * 10}px;
`;

const OctaveInfoWrapper = styled(HoverNoteInfoWrapper)`
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

interface NoteRulerProps {
  hoverNote: hoverMidiInfo | null;
}

const NoteRuler = (props: NoteRulerProps) => {
  return (
    <Container>
      <>
        <HoverNoteInfoWrapper>
          {props.hoverNote && (
            <HoverNoteInfo
              notation={props.hoverNote?.notation}
              notationIndex={props.hoverNote?.notationIndex}
              octaveIndex={props.hoverNote?.octaveIndex}
            >
              {props.hoverNote
                ? `${props.hoverNote.notation}${props.hoverNote.octaveIndex}`
                : ""}
            </HoverNoteInfo>
          )}
        </HoverNoteInfoWrapper>

        {new Array(6).fill(0).map((_, octaveIndex) => (
          <OctaveInfoWrapper key={octaveIndex}>
            <OctaveInfo
              octaveIndex={octaveIndex}
              isClosedToOctaveInfo={
                props.hoverNote !== null &&
                Math.abs(
                  props.hoverNote.octaveIndex * 12 +
                    props.hoverNote.notationIndex -
                    octaveIndex * 12
                ) < 2 &&
                props.hoverNote?.octaveIndex === octaveIndex
              }
            >{`C${octaveIndex}`}</OctaveInfo>
          </OctaveInfoWrapper>
        ))}
      </>
    </Container>
  );
};

export default NoteRuler;
