"use client";

import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/** Tiempo visible del overlay antes del fade-out (ms). */
const LOADING_DURATION_MS = 4300;

const LoadingScreenLogo3D = dynamic(() => import("./LoadingScreenLogo3D"), {
  ssr: false,
  loading: () => (
    <div
      className="h-48 w-48 max-w-[192px] mx-auto rounded-lg bg-[rgb(var(--surface)/0.35)] animate-pulse"
      aria-hidden
    />
  ),
});

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, LOADING_DURATION_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgb(var(--bg))]"
        >
          <div className="relative w-full max-w-sm px-4 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.55,
                ease: "easeOut",
              }}
            >
              <div className="relative isolate min-h-[192px] translate-x-1 sm:translate-x-2" aria-hidden>
                <LoadingScreenLogo3D />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.3,
                duration: 0.6,
              }}
              className="mt-8 text-center"
            >
              <h2 className="font-display text-2xl tracking-[0.18em] text-[rgb(var(--text))]">
                THRIVE FORMATIVE
              </h2>
              <p className="mt-2 text-xs tracking-[0.22em] text-[rgb(var(--muted))]">
                WELLNESS FROM WITHIN
              </p>
            </motion.div>

            <motion.div className="mt-8 w-64 h-0.5 bg-[rgb(var(--surface))] rounded-full overflow-hidden mx-auto">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{
                  duration: 3.4,
                  ease: "easeInOut",
                }}
                className="h-full bg-[rgb(var(--primary))]"
              />
            </motion.div>

            <motion.div className="flex justify-center gap-2 mt-6">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="w-2 h-2 rounded-full bg-[rgb(var(--primary))]"
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
