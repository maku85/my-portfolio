"use client";

import { AnimatePresence, easeInOut, motion } from "framer-motion";
import type React from "react";

const fadeVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeInOut } },
  exit: { opacity: 0, y: -24, transition: { duration: 0.4, ease: easeInOut } },
};

export default function MotionContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        variants={fadeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
