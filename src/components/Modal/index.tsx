import React, { Dispatch, ReactNode, SetStateAction } from "react";
// import classes from "./Modal.module.css";
import styled from "styled-components";

// Imported ReactDom
import ReactDom from "react-dom";

const BackdropWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 20;
  background-color: rgba(0, 0, 0, 0.75);
`;

const ModalOverlayWrapper = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: gray;
  padding: 20px;
  border-radius: 14px;
  z-index: 30;
  animation: slide-down 300ms ease-out forwards;
`;

interface BackdropProps {
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
}

const Backdrop = (props: BackdropProps) => {
  return (
    <BackdropWrapper
      onClick={() => {
        props.setIsModalOpen(false);
      }}
    ></BackdropWrapper>
  );
};

interface ModalOverlayProps {
  children: ReactNode;
}

const ModalOverlay = (props: ModalOverlayProps) => {
  return (
    <ModalOverlayWrapper>
      <div>{props.children}</div>
    </ModalOverlayWrapper>
  );
};

interface ModalProps {
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  children: ReactNode;
}

const Modal = (props: ModalProps) => {
  const modalPlaceholderElement = document.getElementById(
    "modal-root"
  ) as HTMLElement;

  return (
    <>
      {ReactDom.createPortal(
        <Backdrop setIsModalOpen={props.setIsModalOpen} />,
        modalPlaceholderElement
      )}

      {ReactDom.createPortal(
        <ModalOverlay>{props.children}</ModalOverlay>,
        modalPlaceholderElement
      )}
    </>
  );
};

export default Modal;
