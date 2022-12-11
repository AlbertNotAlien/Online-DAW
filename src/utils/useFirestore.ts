import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";
import {
  doc,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import ReactTooltip from "react-tooltip";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import styled from "styled-components";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { db, storage } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";

const uploadFileInfo = async (
  projectId: string, //
  trackId: string, //
  data: Object // interface
) => {
  console.log("uploadFileInfo");
  try {
    const docRef = doc(db, "projects", projectId, "tracks", trackId);
    const newData = data;
    // const newData = {
    //   id: trackId,
    //   name: name,
    //   type: type,
    //   clips: [
    //     {
    //       clipName: clipName,
    //       startPoint: startPoint,
    //       url: url,
    //     },
    //   ],
    //   isMuted: isMuted,
    //   isSolo: isSolo,
    //   volume: volume,
    //   pan: pan,
    //   selectedBy: selectedBy,
    //   createdTime: createdTime,
    // };
    // updateDoc(docRef, newData)
    setDoc(docRef, newData);
  } catch (err) {
    console.log(err);
  }
};
