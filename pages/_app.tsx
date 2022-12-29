import * as React from "react";
import { Reset } from "styled-reset";
import { AuthContextProvider } from "../src/context/AuthContext";
import type { AppProps } from "next/app";

import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthContextProvider>
      <Reset />
      <Component {...pageProps} />
    </AuthContextProvider>
  );
}
