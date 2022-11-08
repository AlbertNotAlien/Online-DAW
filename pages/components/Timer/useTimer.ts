import { useState, useEffect, useRef } from "react";

const useTimer = () => {
  const secondsRef = useRef<number>(0);
  const intervalRef = useRef<any>(null);

  const startTimer = (prev_seconds: number) => {
    console.log("startTimer");
    const startTime = new Date();

    intervalRef.current = setInterval(() => {
      const timeElapsed = new Date().getTime() - startTime.getTime(); // milliseconds
      const newMilliseconds = timeElapsed + prev_seconds * 1000;

      secondsRef.current = newMilliseconds / 1000;
      console.log(secondsRef.current);
    }, 25);

    return secondsRef.current;
  };

  const pauseTimer = () => {
    console.log("pauseTimer");
    clearInterval(intervalRef.current);
    console.log("secondsRef.current", secondsRef.current);
  };

  return [secondsRef.current, startTimer, pauseTimer];
};

export default useTimer;
