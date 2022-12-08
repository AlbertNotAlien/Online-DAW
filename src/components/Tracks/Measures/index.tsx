import {
  barWidthState,
  progressState,
  inputProgressState,
} from "../../../store/atoms";
import { memo } from "react";

import styled from "styled-components";
import { useRecoilValue, useSetRecoilState } from "recoil";

interface BarProps {
  barWidth: number;
  quartersIndex: number;
}

const Container = styled.div`
  height: 130px;
  transform: translateY(20px);
  mix-blend-mode: screen;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: flex-end;
  z-index: 10;
  bottom: 0;
  left: 0;
`;

const Bar = styled.div<BarProps>`
  width: ${(props) => props.barWidth}px;
  height: 130px;
  border-left: 0.1px solid gray;
  cursor: pointer;
  &:hover {
    border-left: 0.1px solid white;
  }
  background-color: ${(props) =>
    props.quartersIndex % 8 <= 3 ? "#141414" : "#2d2d2d"};
`;

const Measures = () => {
  const barWidth = useRecoilValue(barWidthState);

  const setProgress = useSetRecoilState(progressState);
  const setInputProgress = useSetRecoilState(inputProgressState);

  const handleSetProgressLine = (quartersIndex: number) => {
    const currentBars = Math.floor(quartersIndex / 4);
    const currentQuarters = quartersIndex % 4;
    setProgress({
      bars: currentBars,
      quarters: currentQuarters,
      sixteenths: 0,
    });
    setInputProgress({
      bars: currentBars,
      quarters: currentQuarters,
      sixteenths: 0,
    });
  };

  return (
    <Container>
      {new Array(500).fill(0).map((_, quartersIndex) => {
        return (
          <div key={quartersIndex}>
            <Bar
              barWidth={barWidth}
              quartersIndex={quartersIndex}
              onClick={() => {
                handleSetProgressLine(quartersIndex);
              }}
            />
          </div>
        );
      })}
    </Container>
  );
};

export default memo(Measures);
