import { useState, useEffect, useRef } from "react";

// Update time in stopwatch periodically - every 25ms
const useTimer = () => {
  // const [hour, setHour] = useState(0);
  // const [minute, setMinute] = useState(0);
  // const [second, setSecond] = useState(0);
  // const [millisecond, setMillisecond] = useState(0);
  const intervalRef = useRef(null);

  const startTimer = (
    prev_hours,
    prev_minutes,
    prev_seconds,
    prev_milliseconds
  ) => {
    const startTime = new Date(); // fetch current time

    intervalRef.current = setInterval(() => {
      // calculate the time elapsed in milliseconds
      const timeElapsed = new Date().getTime() - startTime.getTime();

      let hours = parseInt(timeElapsed / 1000 / 60 / 60) + prev_hours;

      let minutes = parseInt(timeElapsed / 1000 / 60) + prev_minutes;
      if (minutes > 60) minutes %= 60;

      let seconds = parseInt(timeElapsed / 1000) + prev_seconds;
      if (seconds > 60) seconds %= 60;

      let milliseconds = timeElapsed + prev_milliseconds;
      if (milliseconds > 1000) milliseconds %= 1000;

      // setHour(hours);
      // setMinute(minutes);
      // setSecond(seconds);
      // setMillisecond(milliseconds);

      console.log(hours, minutes, seconds, milliseconds);
    }, 25); // update time in stopwatch after every 25ms
  };

  const pauseTimer = () => {
    clearInterval(intervalRef.current);
  };

  return [startTimer, pauseTimer];
  // return [hour, minute, second, millisecond, startTimer, pauseTimer];
};

export default useTimer;

// updateTime(0, 0, 0, 0);
