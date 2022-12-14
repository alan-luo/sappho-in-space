import { KEYS } from "../Engine/InputManager";
import { Direction, Position, TextAlign } from "./types";

// numbers
export const clamp = (num: number, min: number, max: number): number =>
  Math.min(Math.max(num, min), max);

export const toN = (n: number) => Array.from(Array(n).keys());

// random
export const randomRange = (min: number, max: number): number =>
  min + Math.random() * (max - min);

// https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
export const randIntRange = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export function randEl<T>(list: T[]): T {
  return list[randIntRange(0, list.length - 1)];
}

// position
export const getPositionKey = ({ x, y }: Position): string => `${x}-${y}`;

export const addPos = (
  { x: x1, y: y1 }: Position,
  { x: x2, y: y2 }: Position
): Position => ({ x: x1 + x2, y: y1 + y2 });

// Direction
export const directionFromKey = (key: string) => {
  if (key === KEYS.Down) return Direction.Down;
  else if (key === KEYS.Up) return Direction.Up;
  else if (key === KEYS.Left) return Direction.Left;
  else if (key === KEYS.Right) return Direction.Right;
  else console.error("invalid key!");
};
export const directionKeys = [KEYS.Down, KEYS.Up, KEYS.Left, KEYS.Right];

export function rotateByDirection(
  { x, y }: Position,
  dir: Direction
): Position {
  if (dir === Direction.Up) return { x, y };
  else if (dir === Direction.Down) {
    return {
      x: -x,
      y: -y,
    };
  } else if (dir === Direction.Left) {
    return {
      x: y,
      y: x,
    };
  } else if (dir === Direction.Right) {
    return {
      x: -y,
      y: -x,
    };
  }
}

// strings
export function getAlign(len: number, align: TextAlign): number {
  if (align === TextAlign.Center) return -Math.floor(len / 2);
  if (align === TextAlign.Right) return -len;
  else return 0;
}

// random
type Rand = { f: () => number; i: (max: number) => number };
export function seededRandom(s: number): Rand {
  let seed = s * 7719;

  const rand = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  return { f: rand, i: (max: number) => Math.floor(rand() * max) };
}
