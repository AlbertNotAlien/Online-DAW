import "../styles/globals.css";
import * as React from "react";
import { Reset } from "styled-reset";
import type { AppProps } from "next/app";
import { RecoilRoot } from "recoil";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <RecoilRoot>
      <Reset />
      <Component {...pageProps} />
    </RecoilRoot>
  );
}
