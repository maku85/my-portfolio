export interface Vector2D {
  x: number;
  y: number;
}

export interface GameObject {
  pos: Vector2D;
  radius: number;
}

export interface Ball extends GameObject {
  vel: Vector2D;
}

export interface Bumper extends GameObject {
  id: string;
  points: number;
  color: string;
  lastHit?: number;
}

export interface Flipper {
  side: "left" | "right";
  pos: Vector2D;
  length: number;
  width: number;
  angle: number;
  targetAngle: number;
  baseAngle: number;
  maxAngle: number;
}

export interface GameState {
  score: number;
  balls: number;
  highScore: number;
  isActive: boolean;
  isPaused: boolean;
  isExpanded: boolean;
}
