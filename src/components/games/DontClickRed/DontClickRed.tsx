"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaHeart, FaTrophy, FaRedo, FaPlay } from "react-icons/fa";

import Card from "@/components/Card";
import { Circle } from "./Circle";
import { CircleData, CircleColor, GameState } from "./types";

const GAME_DURATION = 60;
const INITIAL_SPEED = 1500;
const MIN_SPEED = 500;
const SPAWN_DECREMENT = 45;
const INITIAL_LIVES = 3;
const INITIAL_LIFESPAN = 3000;
const MIN_LIFESPAN = 800;

const COLORS: CircleColor[] = ["blue", "green", "yellow", "purple", "orange"];

export default function DontClickRed() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: INITIAL_LIVES,
    timeLeft: GAME_DURATION,
    isActive: false,
    circles: [],
    highScore: 0,
    difficulty: INITIAL_SPEED,
  });

  const [gameOver, setGameOver] = useState(false);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnRef = useRef<NodeJS.Timeout | null>(null);
  const difficultyRef = useRef(INITIAL_SPEED);
  const isActiveRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("dont-click-red-highscore");
    if (saved) {
      setGameState((prev) => ({ ...prev, highScore: parseInt(saved) }));
    }
  }, []);

  const spawnCircle = React.useCallback(() => {
    if (!isActiveRef.current) return;

    const id = Math.random().toString(36).substr(2, 9);
    const isRed = Math.random() < 0.2;
    const color = isRed
      ? "red"
      : COLORS[Math.floor(Math.random() * COLORS.length)];
    const size = Math.floor(Math.random() * 25) + 30; // 30-55px

    const newCircle: CircleData = {
      id,
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      color,
      size,
      createdAt: Date.now(),
    };

    setGameState((prev) => {
      const nextDifficulty = Math.max(
        MIN_SPEED,
        prev.difficulty - SPAWN_DECREMENT,
      );
      difficultyRef.current = nextDifficulty;
      return {
        ...prev,
        circles: [...prev.circles, newCircle],
        difficulty: nextDifficulty,
      };
    });

    const progress =
      (INITIAL_SPEED - difficultyRef.current) / (INITIAL_SPEED - MIN_SPEED);
    const currentLifespan =
      INITIAL_LIFESPAN - progress * (INITIAL_LIFESPAN - MIN_LIFESPAN);

    setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        circles: prev.circles.filter((c) => c.id !== id),
      }));
    }, currentLifespan);

    spawnRef.current = setTimeout(spawnCircle, difficultyRef.current);
  }, []);

  const startGame = useCallback(() => {
    setGameState({
      score: 0,
      lives: INITIAL_LIVES,
      timeLeft: GAME_DURATION,
      isActive: true,
      circles: [],
      highScore: gameState.highScore,
      difficulty: INITIAL_SPEED,
    });
    difficultyRef.current = INITIAL_SPEED;
    isActiveRef.current = true;
    setGameOver(false);
  }, [gameState.highScore]);

  const endGame = useCallback(() => {
    setGameState((prev) => {
      const isNewHighScore = prev.score > prev.highScore;
      if (isNewHighScore) {
        localStorage.setItem("dont-click-red-highscore", prev.score.toString());
      }
      isActiveRef.current = false;
      return {
        ...prev,
        isActive: false,
        highScore: isNewHighScore ? prev.score : prev.highScore,
      };
    });
    setGameOver(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnRef.current) clearTimeout(spawnRef.current);
  }, []);

  useEffect(() => {
    if (gameState.isActive && gameState.timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setGameState((prev) => {
          if (prev.timeLeft <= 1) {
            endGame();
            return { ...prev, timeLeft: 0 };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.isActive, endGame]);

  useEffect(() => {
    if (gameState.isActive) {
      spawnCircle();
    }
    return () => {
      if (spawnRef.current) clearTimeout(spawnRef.current);
    };
  }, [gameState.isActive]);

  const handleCircleClick = (id: string, color: string) => {
    if (!gameState.isActive) return;

    if (color === "red") {
      setGameState((prev) => {
        const newLives = prev.lives - 1;
        if (newLives <= 0) {
          endGame();
        }
        return {
          ...prev,
          lives: newLives,
          circles: prev.circles.filter((c) => c.id !== id),
        };
      });
    } else {
      setGameState((prev) => ({
        ...prev,
        score: prev.score + 1,
        circles: prev.circles.filter((c) => c.id !== id),
      }));
    }
  };

  return (
    <Card
      title="Don't Click Red"
      subtitle="Survival Mission"
      className="bg-white dark:bg-slate-900 border-none shadow-none"
    >
      <div className="flex flex-col items-center justify-center w-full font-sans text-slate-800 dark:text-slate-100 p-1">
        <div className="flex justify-between items-center w-full mb-4 bg-slate-100/50 dark:bg-slate-800/40 backdrop-blur-md p-3 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500">
                Score
              </span>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400 leading-none">
                {gameState.score}
              </span>
            </div>
            <div className="flex flex-col px-4 border-l border-slate-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500">
                Best
              </span>
              <div className="flex items-center gap-1">
                <FaTrophy className="text-yellow-500 text-sm" />
                <span className="text-lg font-bold leading-none">
                  {gameState.highScore}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500">
                Time
              </span>
              <span
                className={`text-2xl font-mono font-black italic leading-none ${gameState.timeLeft < 10 ? "text-red-500 animate-pulse" : "text-slate-700 dark:text-white"}`}
              >
                {gameState.timeLeft}s
              </span>
            </div>
            <div className="flex gap-1 bg-slate-200/50 dark:bg-slate-700/50 p-1.5 rounded-full">
              {[...Array(INITIAL_LIVES)].map((_, i) => (
                <FaHeart
                  key={i}
                  className={`text-sm transition-all duration-300 ${
                    i < gameState.lives
                      ? "text-red-500 scale-110 drop-shadow-sm"
                      : "text-slate-300 dark:text-slate-600 scale-90"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div
          ref={gameAreaRef}
          onPointerDown={(e) => e.stopPropagation()}
          className="relative w-full aspect-square bg-slate-50 dark:bg-slate-950 rounded-[2rem] overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-xl inner-shadow touch-none flex items-center justify-center group"
        >
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          <AnimatePresence>
            {!gameState.isActive && !gameOver && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center text-center z-10 p-8"
              >
                <div className="mb-4 relative">
                  <h1 className="text-4xl font-black bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-purple-500 bg-clip-text text-transparent italic tracking-tighter">
                    DON'T CLICK RED
                  </h1>
                  <div className="absolute -bottom-1 left-0 w-full h-1 bg-linear-to-r from-blue-600/20 to-indigo-600/20 rounded-full blur-xs" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-8 max-w-[220px] leading-relaxed">
                  Test your reflexes! Hit all targets but{" "}
                  <span className="text-red-500 font-black underline decoration-red-200 underline-offset-2">
                    AVOID RED
                  </span>{" "}
                  ones at all costs.
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startGame();
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="group relative flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3.5 rounded-2xl text-lg font-black transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/10"
                >
                  <FaPlay className="text-sm group-hover:translate-x-0.5 transition-transform" />{" "}
                  START MISSION
                </button>
              </motion.div>
            )}

            {gameOver && (
              <motion.div
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                className="absolute inset-0 z-20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
              >
                <span className="text-[10px] font-black tracking-[0.3em] text-slate-400 dark:text-slate-500 uppercase mb-2">
                  Mission Result
                </span>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2 italic">
                  GAME OVER
                </h2>
                <div className="text-7xl font-black text-blue-600 dark:text-blue-400 mb-4 drop-shadow-2xl">
                  {gameState.score}
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-10">
                  {gameState.score >= gameState.highScore && gameState.score > 0
                    ? "👑 NEW WORLD RECORD!"
                    : `Personal Best: ${gameState.highScore}`}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startGame();
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="flex items-center gap-3 bg-blue-600 text-white hover:bg-blue-700 px-10 py-4 rounded-2xl text-lg font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/30"
                >
                  <FaRedo className="text-sm" /> TRY AGAIN
                </button>
              </motion.div>
            )}

            {gameState.isActive &&
              gameState.circles.map((circle) => (
                <Circle
                  key={circle.id}
                  circle={circle}
                  onClick={handleCircleClick}
                />
              ))}
          </AnimatePresence>

          <div className="absolute inset-0 pointer-events-none opacity-[0.08] dark:opacity-[0.15] bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.3),transparent_70%)]" />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 w-full font-black">
          <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-2xl flex items-center justify-between border border-blue-100 dark:border-blue-500/20">
            <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              OTHERS
            </span>
            <span className="text-xs text-blue-700 dark:text-blue-300">
              +1 Point
            </span>
          </div>
          <div className="bg-red-50 dark:bg-red-500/10 p-3 rounded-2xl flex items-center justify-between border border-red-100 dark:border-red-500/20">
            <span className="text-[10px] text-red-600 dark:text-red-400 uppercase tracking-widest">
              RED
            </span>
            <span className="text-xs text-red-700 dark:text-red-300">
              -1 Life
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
