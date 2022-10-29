import styled from "styled-components";

const Measure = styled.div`
  display: flex;
`;

const Bar = styled.div`
  display: flex;
  width: 100px;
  height: 100px;
  justify-content: center;
  background-color: white;
`;

const Track = () => {
  return (
    <>
      <Measure>
        {new Array(4).fill(0).map((_, index) => {
          return <Bar key={index}></Bar>;
        })}
      </Measure>
      <audio controls src="/audio/20220104_test.mp3"></audio>
    </>
  );
};

export default Track;
