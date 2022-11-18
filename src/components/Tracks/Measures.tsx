import { useState, useEffect, useRef, MouseEvent } from "react";

import styled from "styled-components";
import { useRecoilState, useRecoilValue } from "recoil";

import {
  barWidthState,
  projectDataState,
  NoteData,
  progressState,
} from "../../../lib/atoms";

interface StyleProps {
  width: number;
}

const Container = styled.div`
  display: flex;
  flex-direction: row;
  position: absolute;
  z-index: 0;
  top: 0;
  left: 0;
`;

const FlexBars = styled.div`
  display: flex;
  flex-direction: row;
`;

interface BarProps {
  barWidth: number;
  barsIndex: number;
}

const Bar = styled.div<BarProps>`
  width: ${(props) => props.barWidth}px;
  height: 150px;
  border-left: 0.1px solid gray;
  cursor: pointer;
  &:hover {
    border-left: 0.1px solid white;
  }
  background-color: ${(props) =>
    props.barsIndex % 8 <= 3 ? "#141414" : "#2d2d2d"};
`;

// const BarLight = styled(Bar)<StyleProps>`
//   width: ${(props) => props.width}px;
// `;

// const BarDark = styled(Bar)<StyleProps>`
//   width: ${(props) => props.width}px;
//   background-color: #141414;
// `;

const Measures = (props: any) => {
  const projectData = useRecoilValue(projectDataState);
  const [barWidth, setBarWidth] = useRecoilState(barWidthState);

  const [progress, setProgress] = useRecoilState(progressState);

  const handleSetProgressLine = (barsIndex: number) => {
    const currentBar = barsIndex;
    setProgress({
      bars: currentBar,
      quarters: 0,
      sixteenths: 0,
    });
  };

  return (
    <Container>
      {new Array(300).fill(0).map((_, barsIndex) => {
        return (
          <div key={barsIndex}>
            <Bar
              barWidth={barWidth}
              barsIndex={barsIndex}
              onClick={() => {
                handleSetProgressLine(barsIndex);
              }}
            />
          </div>
        );
      })}
    </Container>
  );
};

export default Measures;
