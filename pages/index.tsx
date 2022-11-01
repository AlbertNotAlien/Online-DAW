import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import { forwardRef, useRef, useImperativeHandle, useState } from "react";

import Timeline from "./components/Timeline";

import { Provider } from "react-redux";

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Online DAW</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Timeline />
    </div>
  );
}
