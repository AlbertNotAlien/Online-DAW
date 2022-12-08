import { useEffect, RefObject } from "react";

export const useOnClickOutside = <T extends HTMLElement = HTMLElement>(
  firstRef: RefObject<T>,
  secondRef: RefObject<T>,
  handler: () => void
) => {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      const element = firstRef?.current;
      const elementOption = secondRef?.current;

      if (
        !element ||
        !elementOption ||
        element.contains(event?.target as Node) ||
        elementOption.contains((event?.target as Node) || null)
      ) {
        return;
      }

      handler(event);
    };

    document.addEventListener("mousedown", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
    };
  }, [firstRef, handler, secondRef]);
};
