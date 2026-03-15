"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaCompress, FaExpand, FaPlay, FaRedo, FaTrophy } from "react-icons/fa";
import {
  type Ball,
  type Bumper,
  type Flipper,
  type GameState,
  Vector2D,
} from "./types";

const GRAVITY = 0.15;
const FRICTION = 0.99;
const BOUNCE = 0.7;
const FLIPPER_SPEED = 0.2;
const BALL_RADIUS = 8;
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;

const INITIAL_BUMPERS: Bumper[] = [
  {
    id: "b1",
    pos: { x: 100, y: 150 },
    radius: 25,
    points: 100,
    color: "#3B82F6",
  },
  {
    id: "b2",
    pos: { x: 300, y: 150 },
    radius: 25,
    points: 100,
    color: "#3B82F6",
  },
  {
    id: "b3",
    pos: { x: 200, y: 100 },
    radius: 30,
    points: 250,
    color: "#8B5CF6",
  },
  {
    id: "b4",
    pos: { x: 100, y: 300 },
    radius: 20,
    points: 50,
    color: "#10B981",
  },
  {
    id: "b5",
    pos: { x: 300, y: 300 },
    radius: 20,
    points: 50,
    color: "#10B981",
  },
];

export default function Pinball({
  isExpanded = false,
  onToggleExpand,
}: {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    balls: 3,
    highScore: 0,
    isActive: false,
    isPaused: false,
    isExpanded: isExpanded,
  });

  const ballRef = useRef<Ball>({
    pos: { x: 380, y: 500 },
    vel: { x: 0, y: 0 },
    radius: BALL_RADIUS,
  });

  const flippersRef = useRef<Flipper[]>([
    {
      side: "left",
      pos: { x: 120, y: 550 },
      length: 80,
      width: 12,
      angle: 0.3,
      targetAngle: 0.3,
      baseAngle: 0.3,
      maxAngle: -0.5,
    },
    {
      side: "right",
      pos: { x: 280, y: 550 },
      length: 80,
      width: 12,
      angle: -0.3,
      targetAngle: -0.3,
      baseAngle: -0.3,
      maxAngle: 0.5,
    },
  ]);

  const bumpersRef = useRef<Bumper[]>(INITIAL_BUMPERS.map((b) => ({ ...b })));
  const requestRef = useRef<number>(null);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem("pinball-highscore");
    if (saved) {
      setGameState((prev) => ({ ...prev, highScore: parseInt(saved, 10) }));
    }
  }, []);

  const resetBall = useCallback(() => {
    ballRef.current = {
      pos: { x: 380, y: 550 },
      vel: { x: 0, y: 0 },
      radius: BALL_RADIUS,
    };
  }, []);

  const startGame = () => {
    setGameState((prev) => ({
      ...prev,
      score: 0,
      balls: 3,
      isActive: true,
      isPaused: false,
    }));
    resetBall();
  };

  const update = useCallback(() => {
    if (!gameState.isActive || gameState.isPaused) return;

    const ball = ballRef.current;

    // Apply gravity
    const inPlunger = ball.pos.x > 360 && ball.pos.y > 500;
    if (!inPlunger || Math.abs(ball.vel.y) > 2) {
      ball.vel.y += GRAVITY;
    } else {
      // Hold ball in plunger
      if (ball.pos.y > 580) {
        ball.pos.y = 580;
        ball.vel.y = 0;
      } else if (ball.vel.y >= 0) {
        ball.vel.y += GRAVITY;
      }
    }
    ball.vel.x *= FRICTION;
    ball.vel.y *= FRICTION;

    // Update position
    ball.pos.x += ball.vel.x;
    ball.pos.y += ball.vel.y;

    // Wall collisions
    if (ball.pos.x < ball.radius) {
      ball.pos.x = ball.radius;
      ball.vel.x *= -BOUNCE;
    } else if (ball.pos.x > CANVAS_WIDTH - ball.radius) {
      ball.pos.x = CANVAS_WIDTH - ball.radius;
      ball.vel.x *= -BOUNCE;
    }

    if (ball.pos.y < ball.radius) {
      ball.pos.y = ball.radius;
      ball.vel.y *= -BOUNCE;
    }

    // Out of bounds (bottom)
    if (ball.pos.y > CANVAS_HEIGHT + ball.radius) {
      setGameState((prev) => {
        const nextBalls = prev.balls - 1;
        if (nextBalls <= 0) {
          const isNewHigh = prev.score > prev.highScore;
          if (isNewHigh)
            localStorage.setItem("pinball-highscore", prev.score.toString());
          return {
            ...prev,
            isActive: false,
            highScore: isNewHigh ? prev.score : prev.highScore,
          };
        }
        resetBall();
        return { ...prev, balls: nextBalls };
      });
    }

    // Bumper collisions
    bumpersRef.current.forEach((bumper) => {
      const dx = ball.pos.x - bumper.pos.x;
      const dy = ball.pos.y - bumper.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < ball.radius + bumper.radius) {
        // Collision response
        const nx = dx / dist;
        const ny = dy / dist;

        // Reflect velocity
        const dot = ball.vel.x * nx + ball.vel.y * ny;
        ball.vel.x = (ball.vel.x - 2 * dot * nx) * 1.5; // Boost
        ball.vel.y = (ball.vel.y - 2 * dot * ny) * 1.5;

        // Move ball out of bumper
        const overlap = ball.radius + bumper.radius - dist;
        ball.pos.x += nx * overlap;
        ball.pos.y += ny * overlap;

        // Feedback
        bumper.lastHit = Date.now();
        setGameState((prev) => ({
          ...prev,
          score: prev.score + bumper.points,
        }));
      }
    });

    // Flipper collisions and animation
    flippersRef.current.forEach((flipper) => {
      // Animate flipper
      const diff = flipper.targetAngle - flipper.angle;
      flipper.angle += diff * FLIPPER_SPEED;

      // Simple flipper collision (distance to segment)
      const tipX =
        flipper.pos.x +
        Math.cos(flipper.angle + (flipper.side === "right" ? Math.PI : 0)) *
          flipper.length;
      const tipY =
        flipper.pos.y +
        Math.sin(flipper.angle + (flipper.side === "right" ? Math.PI : 0)) *
          flipper.length;

      // Project ball onto line segment
      const dx = tipX - flipper.pos.x;
      const dy = tipY - flipper.pos.y;
      const l2 = dx * dx + dy * dy;
      let t =
        ((ball.pos.x - flipper.pos.x) * dx +
          (ball.pos.y - flipper.pos.y) * dy) /
        l2;
      t = Math.max(0, Math.min(1, t));

      const projX = flipper.pos.x + t * dx;
      const projY = flipper.pos.y + t * dy;

      const distDx = ball.pos.x - projX;
      const distDy = ball.pos.y - projY;
      const dist = Math.sqrt(distDx * distDx + distDy * distDy);

      if (dist < ball.radius + flipper.width / 2) {
        // Hit!
        const nx = distDx / dist;
        const ny = distDy / dist;

        // Check if flipper is moving up to give boost
        const angularVel = Math.abs(diff);
        const boost = angularVel > 0.05 ? 15 : 1.2;

        const dot = ball.vel.x * nx + ball.vel.y * ny;
        ball.vel.x = (ball.vel.x - 2 * dot * nx) * boost;
        ball.vel.y = (ball.vel.y - 2 * dot * ny) * boost;

        // Constrain velocity
        const speed = Math.sqrt(ball.vel.x ** 2 + ball.vel.y ** 2);
        if (speed > 15) {
          ball.vel.x = (ball.vel.x / speed) * 15;
          ball.vel.y = (ball.vel.y / speed) * 15;
        }

        const overlap = ball.radius + flipper.width / 2 - dist;
        ball.pos.x += nx * overlap;
        ball.pos.y += ny * overlap;
      }
    });

    // Side walls to direct ball to flippers
    const sideWalls = [
      { x1: 0, y1: 500, x2: 120, y2: 600 },
      { x1: 360, y1: 500, x2: 280, y2: 600 }, // Shifted internal wall to clear plunger lane
      { x1: 360, y1: 600, x2: 360, y2: 100 }  // Plunger lane divider
    ];

    sideWalls.forEach((wall) => {
      const dx = wall.x2 - wall.x1;
      const dy = wall.y2 - wall.y1;
      const l2 = dx * dx + dy * dy;
      let t = ((ball.pos.x - wall.x1) * dx + (ball.pos.y - wall.y1) * dy) / l2;
      t = Math.max(0, Math.min(1, t));
      const projX = wall.x1 + t * dx;
      const projY = wall.y1 + t * dy;
      const distDx = ball.pos.x - projX;
      const distDy = ball.pos.y - projY;
      const dist = Math.sqrt(distDx * distDx + distDy * distDy);

      if (dist < ball.radius) {
        const nx = distDx / dist;
        const ny = distDy / dist;
        const dot = ball.vel.x * nx + ball.vel.y * ny;
        ball.vel.x = (ball.vel.x - 2 * dot * nx) * BOUNCE;
        ball.vel.y = (ball.vel.y - 2 * dot * ny) * BOUNCE;
        ball.pos.x += nx * (ball.radius - dist);
        ball.pos.y += ny * (ball.radius - dist);
      }
    });
  }, [gameState.isActive, gameState.isPaused, resetBall]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Board styling
      const grad = ctx.createRadialGradient(200, 300, 0, 200, 300, 400);
      grad.addColorStop(0, "#1e293b");
      grad.addColorStop(1, "#0f172a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Decorative grid
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      for (let i = 0; i < CANVAS_WIDTH; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let i = 0; i < CANVAS_HEIGHT; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_WIDTH, i);
        ctx.stroke();
      }

      // Walls
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 4;
    ctx.beginPath();
    // Border
    ctx.moveTo(120, 600); ctx.lineTo(0, 500); ctx.lineTo(0, 0); ctx.lineTo(400, 0); ctx.lineTo(400, 600);
    // Plunger lane divider
    ctx.moveTo(360, 600); ctx.lineTo(360, 100);
    // Inner right diagonal
    ctx.moveTo(360, 500); ctx.lineTo(280, 600);
    ctx.stroke();

      // Bumpers
      bumpersRef.current.forEach((bumper) => {
        const isHiting = bumper.lastHit && Date.now() - bumper.lastHit < 100;
        ctx.fillStyle = isHiting ? "#fff" : bumper.color;
        ctx.beginPath();
        ctx.arc(
          bumper.pos.x,
          bumper.pos.y,
          isHiting ? bumper.radius + 3 : bumper.radius,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        // Bumper Glow
        if (isHiting) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = bumper.color;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      });

      // Flippers
      ctx.lineCap = "round";
      flippersRef.current.forEach((flipper) => {
        ctx.save();
        ctx.translate(flipper.pos.x, flipper.pos.y);
        ctx.rotate(flipper.angle + (flipper.side === "right" ? Math.PI : 0));

        ctx.strokeStyle = "#f8fafc";
        ctx.lineWidth = flipper.width;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(flipper.length, 0);
        ctx.stroke();

        // Pivot
        ctx.fillStyle = "#94a3b8";
        ctx.beginPath();
        ctx.arc(0, 0, flipper.width / 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // Ball
      const ball = ballRef.current;
      ctx.fillStyle = "#e2e8f0";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#3b82f6";
      ctx.beginPath();
      ctx.arc(ball.pos.x, ball.pos.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Plunger Area
      if (!gameState.isActive || (ball.pos.x > 360 && ball.pos.y > 500)) {
        ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
        ctx.fillRect(360, 500, 40, 100);
      }
    },
    [gameState.isActive],
  );

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    update();
    draw(ctx);
    requestRef.current = requestAnimationFrame(loop);
  }, [update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [loop]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        flippersRef.current[0].targetAngle = flippersRef.current[0].maxAngle;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        flippersRef.current[1].targetAngle = flippersRef.current[1].maxAngle;
      }
      if (e.key === " " && gameState.isActive) {
        // Launch ball if in plunger
        const ball = ballRef.current;
        if (ball.pos.x > 360 && ball.pos.y > 500) {
          ball.vel.y = -15 - Math.random() * 5;
          ball.vel.x = -1 - Math.random() * 2;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        flippersRef.current[0].targetAngle = flippersRef.current[0].baseAngle;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        flippersRef.current[1].targetAngle = flippersRef.current[1].baseAngle;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState.isActive]);

  return (
    <div
      className={`relative flex flex-col items-center bg-slate-900 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ${isExpanded ? "scale-110" : ""}`}
    >
      {/* UI Overlay */}
      <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-start z-10 pointer-events-none">
        <div className="bg-slate-800/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700 pointer-events-auto">
          <div className="text-[10px] uppercase font-black text-slate-500 mb-0.5">
            Score
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono tracking-tighter">
            {gameState.score}
          </div>
        </div>

        <div className="flex gap-3 pointer-events-auto">
          <div className="bg-slate-800/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700">
            <div className="text-[10px] uppercase font-black text-slate-500 mb-0.5">
              Balls
            </div>
            <div className="flex gap-1.5 mt-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${i < gameState.balls ? "bg-blue-500 shadow-[0_0_8px_#3b82f6]" : "bg-slate-700"}`}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleExpand}
            className="p-3 bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            {isExpanded ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="max-w-full h-auto cursor-none touch-none"
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const rect = canvasRef.current!.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x < rect.width / 2) {
            flippersRef.current[0].targetAngle =
              flippersRef.current[0].maxAngle;
          } else {
            flippersRef.current[1].targetAngle =
              flippersRef.current[1].maxAngle;
          }

          // Launch if in plunger
          const ball = ballRef.current;
          if (ball.pos.x > 350 && ball.pos.y > 450) {
            ball.vel.y = -26; // Increased power
            ball.vel.x = -1;
          }
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          e.stopPropagation();
          flippersRef.current[0].targetAngle = flippersRef.current[0].baseAngle;
          flippersRef.current[1].targetAngle = flippersRef.current[1].baseAngle;
        }}
      />

      <AnimatePresence>
        {!gameState.isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-lg flex flex-col items-center justify-center p-8 text-center z-20"
          >
            <div className="mb-6">
              <h2 className="text-4xl font-black text-white italic tracking-tighter mb-2">
                NEON PINBALL
              </h2>
              <p className="text-slate-400 text-sm max-w-[240px]">
                Use arrows or tap sides to flip. Space or tap to launch!
              </p>
            </div>

            {gameState.score > 0 && (
              <div className="mb-8">
                <div className="text-[10px] uppercase font-black text-slate-500 mb-1">
                  Last Score
                </div>
                <div className="text-5xl font-black text-blue-500 mb-2">
                  {gameState.score}
                </div>
                <div className="flex items-center justify-center gap-2 text-yellow-500">
                  <FaTrophy />
                  <span className="font-bold">Best: {gameState.highScore}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={startGame}
              className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-3xl text-xl font-black transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
            >
              <FaPlay /> PLAY NOW
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control hints */}
      <div className="absolute bottom-6 inset-x-0 flex justify-center pointer-events-none opacity-40">
        <div className="bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700 text-[10px] font-black text-slate-500 uppercase tracking-widest">
          [A] Left • [D] Right • [Space] Launch
        </div>
      </div>
    </div>
  );
}
