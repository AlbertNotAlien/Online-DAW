import Head from "next/head";
import Image from "next/image";
import { forwardRef, useRef, useImperativeHandle, useState } from "react";

import Timeline from "../src/components/Project";

import { Provider } from "react-redux";

export default function Home() {
  return (
    <>
      <Head>
        <title>Online DAW</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Timeline />
    </>
  );
}
