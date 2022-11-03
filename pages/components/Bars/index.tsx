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
  projectData: {
    name: string;
    tempo: number;
    tracks: object[];
  };
}) => {
  const barWidthCoefficient = 9.5; // 一個bar長9.5px 9.5:58
  const barQuantities = 500;
  return (
    <Container>
      {new Array(Math.floor(barQuantities / 8)).fill(0).map((_, index) => {
        return (
          <FlexBars key={index}>
            {new Array(4).fill(0).map((_, index) => {
              return (
                <div key={index}>
                  <BarLight
                    width={
                      (120 / props.projectData.tempo) * barWidthCoefficient
                    }
                  />
                </div>
              );
            })}
            {new Array(4).fill(0).map((_, index) => {
              return (
                <div key={index}>
                  <BarDark
                    width={
                      (120 / props.projectData.tempo) * barWidthCoefficient
                    }
                  />
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
