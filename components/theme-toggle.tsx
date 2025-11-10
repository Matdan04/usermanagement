"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <Button type="button" variant="secondary" size="sm" className="w-[100px]" disabled>
        <span className="opacity-0">Loading</span>
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="w-10 p-0 transition-colors cursor-pointer"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title="Toggle theme"
      asChild
    >
      <motion.span whileTap={{ scale: 0.96 }} className="inline-flex h-9 w-10 items-center justify-center">
        <AnimatePresence mode="popLayout" initial={false}>
          {isDark ? (
            <motion.span
              key="moon"
              initial={{ opacity: 0, y: 6, rotate: -10 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, y: -6, rotate: 10 }}
              transition={{ duration: 0.15 }}
              className="inline-flex items-center"
            >
              <Moon className="h-4 w-4" />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ opacity: 0, y: 6, rotate: 10 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, y: -6, rotate: -10 }}
              transition={{ duration: 0.15 }}
              className="inline-flex items-center"
            >
              <Sun className="h-4 w-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>
    </Button>
  );
}
