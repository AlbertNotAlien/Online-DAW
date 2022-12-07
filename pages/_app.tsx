import * as React from "react";
import type { AppProps } from "next/app";
import { Reset } from "styled-reset";
import { RecoilRoot } from "recoil";

import { AuthContextProvider } from "../src/context/AuthContext";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthContextProvider>
      <RecoilRoot>
        <Reset />
        <Component {...pageProps} />
      </RecoilRoot>
    </AuthContextProvider>
  );
}
