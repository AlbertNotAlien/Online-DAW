import Image from "next/image";
import { useState, useEffect, useRef, MouseEvent } from "react";
import styled from "styled-components";
import { useRecoilState } from "recoil";
import produce from "immer";

import {
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  DocumentData,
  orderBy,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { storage } from "../../../lib/firebase";
import { listAll, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import {
  tracksDataState,
  projectDataState,
  selectedTrackIdState,
  selectedTrackIndexState,
  barWidthState,
  progressState,
  TrackData,
} from "../../../lib/atoms";

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
