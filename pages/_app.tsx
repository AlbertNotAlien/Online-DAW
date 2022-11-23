import "../styles/globals.css";
import * as React from "react";
import { Reset } from "styled-reset";
import type { AppProps } from "next/app";
import { RecoilRoot } from "recoil";

import "../styles/globals.css";

import Head from "next/head";
// import Layout from "../components/layout";
import { AuthContextProvider } from "../context/AuthContext";

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
