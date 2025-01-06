import { Pendulum } from "../../types";

/**
 * Return the current angle using the small-angle pendulum approximation.
 * @param length Pendulum length (meters)
 * @param initialAngle Initial angle (radians)
 * @param timeMs Time elapsed in milliseconds
 */
export function getCurrentAngle(length: number, initialAngle: number, timeMs: number): number {
  // Convert ms to seconds
  const timeSeconds = timeMs / 1000;

  // Gravitational acceleration in m/s^2
  const g = 9.81;

  // Angular frequency (rad/s)
  const angularFrequency = Math.sqrt(g / length);

  return initialAngle * Math.cos(angularFrequency * timeSeconds);
}

export function computeBobPosition(
  pendulum: Pendulum,
  index: number,
  anchorXOffset: number,
  anchorSpacing: number,
  ceilingY: number,
  lengthScale: number,
  currentTimeMs: number
): { x: number; y: number } {
  // If not moving, angle = 0 => bob straight up at anchor, or you might want to freeze at the last angle
  // but let's assume angle=0 means "straight down" if it's not moving.
  let angle = 0;

  if (pendulum.moving) {
    const elapsedMs = currentTimeMs - pendulum.triggeredAt;
    angle = getCurrentAngle(pendulum.length, pendulum.theta, elapsedMs);
  }

  // Convert length from meters to pixels
  const lengthPx = pendulum.length * lengthScale;

  // Each pendulum's anchor is at (anchorX, ceilingY)
  const anchorX = anchorXOffset + index * anchorSpacing;
  const anchorY = ceilingY; // top, e.g., 40px down from the top of the SVG

  // Bob position: if angle=0 is "straight down"
  const x = anchorX + lengthPx * Math.sin(angle);
  const y = anchorY + lengthPx * Math.cos(angle);

  return { x, y };
}
