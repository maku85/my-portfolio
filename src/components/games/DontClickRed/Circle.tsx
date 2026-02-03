"use client";

import { motion } from "framer-motion";

import { CircleData } from "./types";

interface CircleProps {
  circle: CircleData;
  onClick: (id: string, color: string) => void;
}

const colorMap: Record<string, string> = {
  red: "bg-linear-to-br from-red-400 to-red-600 shadow-red-500/40 ring-red-400/30",
  blue: "bg-linear-to-br from-blue-400 to-blue-600 shadow-blue-500/40 ring-blue-400/30",
  green:
    "bg-linear-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/40 ring-emerald-400/30",
  yellow:
    "bg-linear-to-br from-yellow-300 to-yellow-500 shadow-yellow-400/40 ring-yellow-300/30",
  purple:
    "bg-linear-to-br from-purple-400 to-purple-600 shadow-purple-500/40 ring-purple-400/30",
  orange:
    "bg-linear-to-br from-orange-400 to-orange-600 shadow-orange-500/40 ring-orange-400/30",
};

export const Circle = ({ circle, onClick }: CircleProps) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(circle.id, circle.color);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={`absolute cursor-pointer rounded-full shadow-lg border-2 border-white/20 ring-4 ${colorMap[circle.color]} transition-transform overflow-hidden`}
      style={{
        left: `${circle.x}%`,
        top: `${circle.y}%`,
        width: `${circle.size}px`,
        height: `${circle.size}px`,
        transform: "translate(-50%, -50%)",
      }}
      layoutId={circle.id}
    >
      <div className="absolute top-1 left-1.5 w-1/3 h-1/3 bg-white/30 rounded-full blur-[1px]" />
    </motion.div>
  );
};
