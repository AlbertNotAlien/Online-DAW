import styled from "styled-components";

interface StyleProps {
  width: number;
}

const Container = styled.div`
  display: flex;
  flex-direction: row;
  position: absolute;
  z-index: -1;
  top: 0;
  left: 0;
`;

const FlexBars = styled.div`
  display: flex;
  flex-direction: row;
`;

const Bar = styled.div`
  width: 1px;
  height: 150px;
  border-left: 0.1px solid gray;
  cursor: pointer;
  &:hover {
    border-left: 0.1px solid white;
  }
`;

const BarLight = styled(Bar)<StyleProps>`
  width: ${(props) => props.width}px;
  background-color: #2d2d2d;
`;

const BarDark = styled(Bar)<StyleProps>`
  width: ${(props) => props.width}px;
  background-color: #141414;
`;

const Bars = (props: {
  projectInfo: {
    // tracks: object[[]];
    tracks: any;
    tempo: number;
  };
}) => {
  const barWidth = 9.5; // 一個bar長9.5px 9.5:58
  // const barQuantity =
  //   (parseInt(props.projectInfo.tracks[0].clips[0].duration) *
  //     props.projectInfo.tempo) /
  //   60; // 產生的小節數量
  const barQuantity = 500;
  const totalWidth = barWidth * barQuantity; // 總長度
  return (
    <Container>
      {new Array(Math.floor(barQuantity / 8)).fill(0).map((_, index) => {
        return (
          <FlexBars key={index}>
            {new Array(4).fill(0).map((_, index) => {
              return (
                <div key={index}>
                  <BarLight
                    width={(120 / props.projectInfo.tempo) * barWidth}
                  />
                </div>
              );
            })}
            {new Array(4).fill(0).map((_, index) => {
              return (
                <div key={index}>
                  <BarDark width={(120 / props.projectInfo.tempo) * barWidth} />
                </div>
              );
            })}
          </FlexBars>
        );
      })}
    </Container>
  );
};

export default Bars;
