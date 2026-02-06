"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Palette, ChevronRight } from "lucide-react";
import React from "react";
import { useTheme, useThemes, ThemeId } from "./ThemeProvider";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const themes = useThemes();
  const [open, setOpen] = React.useState(false);

  const currentIndex = themes.findIndex(t => t.id === theme);
  const next = () => {
    const nextTheme = themes[(currentIndex + 1) % themes.length].id as ThemeId;
    setTheme(nextTheme);
  };

  return (
    <div className="fixed right-4 bottom-4 z-50">
      <div className="flex items-end gap-3">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="bg-surface border border-theme shadow-soft rounded-2xl p-3 w-72"
            >
              <div className="font-display text-sm tracking-wide mb-2">Vistas / Paletas</div>
              <div className="space-y-2">
                {themes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as ThemeId)}
                    className={`w-full text-left rounded-xl px-3 py-2 border transition ${
                      t.id === theme ? "border-theme ring-2 ring-theme" : "border-theme"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{t.name}</div>
                        <div className="text-xs text-muted">{t.description}</div>
                      </div>
                      <ChevronRight className="opacity-60" size={18} />
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <button className="btn-outline rounded-xl px-3 py-2 text-sm w-1/2" onClick={next}>
                  Siguiente
                </button>
                <button className="btn-primary rounded-xl px-3 py-2 text-sm w-1/2" onClick={() => setOpen(false)}>
                  Listo
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setOpen(v => !v)}
          className="btn-primary rounded-2xl shadow-soft px-4 py-3 flex items-center gap-2"
        >
          <Palette size={18} />
          <span className="text-sm font-medium">Cambiar vista</span>
        </motion.button>
      </div>
    </div>
  );
}
