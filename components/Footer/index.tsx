import styled from "styled-components";

const Container = styled.div`
  color: #f6ddcd;
  min-height: 100px;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Footer = () => {
  return (
    <>
      <Container>Copyright © 2022 KK</Container>
    </>
  );
};

export default Footer;
