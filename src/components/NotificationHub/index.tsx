import React, { useState, useMemo, useEffect, MouseEvent } from "react";
import { X } from "react-feather";
import { useTransition, animated } from "@react-spring/web";
import styled from "styled-components";

export const Main = styled.div`
  cursor: pointer;
  color: #676767;
  -webkit-user-select: none;
  user-select: none;
  display: flex;
  align-items: center;
  height: 100%;
  justify-content: center;
`;

export const Container = styled.div`
  position: fixed;
  z-index: 1000;
  width: 0 auto;
  bottom: 30px;
  margin: 0 auto;
  left: 30px;
  right: 30px;
  display: flex;
  flex-direction: column;
  pointer-events: none;
  align-items: flex-end;
  @media (max-width: 680px) {
    align-items: center;
  }
`;

export const Message = styled(animated.div)`
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  width: 40ch;
  @media (max-width: 680px) {
    width: 100%;
  }
`;

export const Content = styled.div`
  color: white;
  background: #445159;
  opacity: 0.9;
  padding: 12px 22px;
  font-size: 1em;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-gap: 10px;
  overflow: hidden;
  height: auto;
  border-radius: 3px;
  margin-top: 10px;
`;

export const Button = styled.button`
  cursor: pointer;
  pointer-events: all;
  outline: 0;
  border: none;
  background: transparent;
  display: flex;
  align-self: flex-end;
  overflow: hidden;
  margin: 0;
  padding: 0;
  padding-bottom: 14px;
  color: rgba(255, 255, 255, 0.5);
  :hover {
    color: rgba(255, 255, 255, 0.6);
  }
`;

export const Life = styled(animated.div)`
  position: absolute;
  bottom: 0;
  left: 0px;
  width: auto;
  background-image: linear-gradient(130deg, #00b4e6, #00f0e0);
  height: 5px;
`;

let id = 0;

// export type AddFunction = (msg: string) => void;
export type AddFunction = Function;

export interface MessageHubProps {
  config?: {
    tension: number;
    friction: number;
    precision: number;
  };
  timeout?: number;
  // notificationChildren: (add: AddFunction) => void;
  notificationChildren: Function;
}

interface Item {
  key: number;
  msg: string;
}

export default function MessageHub({
  config = { tension: 125, friction: 20, precision: 0.1 },
  timeout = 3000,
  notificationChildren,
}: MessageHubProps) {
  const refMap = useMemo(() => new WeakMap(), []);
  const cancelMap = useMemo(() => new WeakMap(), []);
  const [items, setItems] = useState<Item[]>([]);

  const transitions = useTransition(items, {
    from: { opacity: 0, height: 0, life: "100%" },
    keys: (item) => item.key,
    enter: (item) => async (next, cancel) => {
      cancelMap.set(item, cancel);
      await next({ opacity: 1, height: refMap.get(item).offsetHeight });
      await next({ life: "0%" });
    },
    leave: [{ opacity: 0 }, { height: 0 }],
    onRest: (result, ctrl, item) => {
      setItems((state) =>
        state.filter((i) => {
          return i.key !== item.key;
        })
      );
    },
    config: (item, index, phase) => (key) =>
      phase === "enter" && key === "life" ? { duration: timeout } : config,
  });

  useEffect(() => {
    notificationChildren((msg: string) => {
      setItems((state) => [...state, { key: id++, msg }]);
    });
  }, [notificationChildren]);

  return (
    <Container>
      {transitions(({ life, ...style }, item) => (
        <Message style={style}>
          <Content ref={(ref: HTMLDivElement) => ref && refMap.set(item, ref)}>
            <Life style={{ right: life }} />
            <p>{item.msg}</p>
            <Button
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                if (cancelMap.has(item) && life.get() !== "0%")
                  cancelMap.get(item)();
              }}
            >
              <X size={18} />
            </Button>
          </Content>
        </Message>
      ))}
    </Container>
  );
}
