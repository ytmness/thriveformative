"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useTheme } from "./theme/ThemeProvider";

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    // Simular carga inicial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Mapeo de logos según el tema
  const logoMap: Record<string, string> = {
    "golden-sand": "/logos/Recurso-1-2x.png",
    "nocturnal": "/logos/Recurso-2-2x.png",
    "metals": "/logos/Recurso-3-2x.png",
    "earth-modern": "/logos/Recurso-4-5x.png",
  };

  const currentLogo = logoMap[theme] || logoMap["nocturnal"];

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgb(var(--bg))]"
        >
          <div className="relative">
            {/* Logo con animación de fade y scale */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.6,
                ease: "easeOut",
              }}
            >
              <motion.img
                src={currentLogo}
                alt="Thrive Formative"
                className="w-48 h-48 object-contain -translate-x-1 sm:translate-x-0"
                initial={{ x: 0 }}
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>

            {/* Texto animado */}
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

            {/* Barra de progreso */}
            <motion.div
              className="mt-8 w-64 h-0.5 bg-[rgb(var(--surface))] rounded-full overflow-hidden mx-auto"
            >
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{
                  duration: 2,
                  ease: "easeInOut",
                }}
                className="h-full bg-[rgb(var(--primary))]"
              />
            </motion.div>

            {/* Puntos de carga animados */}
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
