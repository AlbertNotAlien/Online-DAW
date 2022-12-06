import styled, { keyframes } from "styled-components";

const LoaderKeyframes = keyframes`
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
`;

const LoaderAnimation = styled.div`
  border: 5px solid #f3f3f3;
  border-radius: 50%;
  border-top: 5px solid #3498db;
  width: 50px;
  height: 50px;
  animation-name: ${LoaderKeyframes};
  animation-duration: 1.5s;
  animation-iteration-count: infinite;
`;

const Loader = () => {
  return <LoaderAnimation />;
};

export default Loader;
