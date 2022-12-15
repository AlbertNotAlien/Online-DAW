import styled from "styled-components";

const Container = styled.div`
  min-width: 200px;
  height: 100%;
  background-color: gray;
  border-radius: 10px;
  /* transition: box-shadow 0.2s ease-in-out;
  &:hover {
    box-shadow: 0 0 10px #00000050;
    transition: box-shadow 0.2s ease-in-out;
  } */
  display: flex;
  padding: 20px;
`;

const Instruments = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 10px;
`;

const Instrument = styled.p`
  color: #f6ddcd;
`;

const Library = () => {
  return (
    <>
      <Container>
        <Instruments>
          <Instrument>synth</Instrument>
          <Instrument>piano</Instrument>
          <Instrument>strings</Instrument>
        </Instruments>
      </Container>
    </>
  );
};

export default Library;
