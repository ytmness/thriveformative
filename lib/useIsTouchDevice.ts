"use client";

import { useEffect, useState } from "react";

export function useIsTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(max-width: 1024px), (pointer: coarse)");
    const update = () => setIsTouchDevice(media.matches);
    update();

    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isTouchDevice;
}
