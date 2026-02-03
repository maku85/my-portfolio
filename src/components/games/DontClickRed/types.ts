export type CircleColor =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "orange";

export interface CircleData {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  color: CircleColor;
  size: number; // pixels
  createdAt: number;
}

export interface GameState {
  score: number;
  lives: number;
  timeLeft: number;
  isActive: boolean;
  circles: CircleData[];
  highScore: number;
  difficulty: number; // multiplier for spawn rate
}
