import Redis from "ioredis";
import { computeBobPosition } from "./utils";
import { setTimeout } from "timers/promises";
import { Pendulum } from "../../types";

export const redis = new Redis();

const COLLISION_THRESHOLD = 10;

async function stopAllPendulumsInRedis() {
  const pendulumIds = await redis.smembers("pendulums");
  for (const id of pendulumIds) {
    const data = await redis.get(`pendulum:${id}`);
    if (data) {
      const p: Pendulum = JSON.parse(data);
      p.moving = false;
      await redis.set(`pendulum:${id}`, JSON.stringify(p));
    }
  }
  console.log("All pendulums set to moving=false due to collision.");
}

async function restartAllPendulumsInRedis() {
  const pendulumIds = await redis.smembers("pendulums");
  for (const id of pendulumIds) {
    const data = await redis.get(`pendulum:${id}`);
    if (data) {
      const p: Pendulum = JSON.parse(data);
      p.moving = true;
      p.triggeredAt = Date.now();
      await redis.set(`pendulum:${id}`, JSON.stringify(p));
    }
  }
  console.log("All pendulums set to moving=false due to collision.");
}

export async function getAllPendulums(): Promise<Pendulum[]> {
  const pendulumIds = await redis.smembers("pendulums");
  const result: Pendulum[] = [];
  for (const id of pendulumIds) {
    const data = await redis.get(`pendulum:${id}`);
    if (data) {
      result.push(JSON.parse(data));
    }
  }
  return result;
}

export async function checkCollisionsAndStopIfNeeded(allPends: Pendulum[]) {
  // We'll pick the same coordinate system matching the SVG arrangement in the UI
  // TODO: Make these environment variables and have both the UI and WS server get the values from the environment
  const anchorXOffset = 100;    // left margin
  const anchorSpacing = 120;    // spacing between pendulums
  const ceilingY = 40;          // y for the anchor
  const lengthScale = 10;       // 1 meter = 10 pixels, for instance

  // Current time in ms
  const now = Date.now();

  // Compute bob positions for each pendulum
  const positions = allPends.map((pendulum, idx) => {
    const { x, y } = computeBobPosition(
      pendulum,
      idx,
      anchorXOffset,
      anchorSpacing,
      ceilingY,
      lengthScale,
      now
    );
    return { id: pendulum.id, x, y };
  });

  // Check every pair for collisions (O(n^2), fine for small n)
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dx = positions[i].x - positions[j].x;
      const dy = positions[i].y - positions[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < COLLISION_THRESHOLD) {
        console.log(
          `Collision detected between pendulums ${positions[i].id} and ${positions[j].id}. dist=${dist}`
        );
        // Stop all pendulums and restart them after 5 seconds
        await stopAllPendulumsInRedis();
        await setTimeout(5000);
        await restartAllPendulumsInRedis();
        return;
      }
    }
  }
}
