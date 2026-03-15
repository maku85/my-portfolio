"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import Card from "@/components/Card";
import Pinball from "../games/Pinball/Pinball";

export default function PinballCard() {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <Card
        title="Arcade Pinball"
        subtitle="Neon Lights Edition"
        className="bg-slate-900 border-none shadow-none"
      >
        <div className="mt-2 w-full">
          {/* In-card preview/mini-game */}
          <div className="relative group">
            <Pinball onToggleExpand={toggleExpand} />

            {!isExpanded && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={toggleExpand}
                  className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold border border-white/20 hover:bg-white/20 transition-colors"
                >
                  EXPAND TO PLAY
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Expanded View Overlays */}
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 h-screen w-screen overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleExpand}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-2xl max-h-full flex items-center justify-center"
            >
              <Pinball isExpanded={true} onToggleExpand={toggleExpand} />

              {/* Close helper for mobile if needed */}
              <button
                type="button"
                onClick={toggleExpand}
                className="absolute -top-12 right-0 text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-widest"
              >
                CLOSE [ESC]
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
