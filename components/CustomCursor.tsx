"use client";

import { useEffect, useState } from "react";

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [hover, setHover] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isPointerFine = window.matchMedia("(pointer: fine)").matches;
    if (!isPointerFine) return;

    setVisible(true);

    const handleMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };

    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive =
        target?.closest("a") ||
        target?.closest("button") ||
        target?.closest("[role='button']") ||
        target?.closest("input") ||
        target?.closest("select") ||
        target?.closest("textarea");
      setHover(!!interactive);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseover", handleOver);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseover", handleOver);
    };
  }, []);

  useEffect(() => {
    if (visible) document.body.classList.add("custom-cursor-active");
    return () => document.body.classList.remove("custom-cursor-active");
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="custom-cursor-wrap" aria-hidden>
      <div
        className={`custom-cursor-ring ${hover ? "hover" : ""}`}
        style={{ left: pos.x, top: pos.y }}
      />
      <div
        className={`custom-cursor-dot ${hover ? "hover" : ""}`}
        style={{ left: pos.x, top: pos.y }}
      />
    </div>
  );
}
