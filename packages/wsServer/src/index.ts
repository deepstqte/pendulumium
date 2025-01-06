import express, { Express, Request, Application } from "express";
import { getCurrentAngle } from "./utils";
import { checkCollisionsAndStopIfNeeded, redis, getAllPendulums } from "./redisUtils";
import { Pendulum } from "../../types";
import { WebSocket, WebSocketServer } from "ws";
import dotenv from "dotenv";

dotenv.config();

const wsPort = 3001;

const wss = new WebSocketServer({ port: wsPort });

wss.on('connection', function connection(ws) {
  ws.on("message", async (pendulumId: string) => {
    // Check that pendulum exists
    const pendData = await redis.get(`pendulum:${pendulumId}`);
    if (!pendData) {
      ws.send("No pendulum found for that ID");
      return;
    }

    // Do collision detection among all pendulums
    const allPendulums = await getAllPendulums();
    await checkCollisionsAndStopIfNeeded(allPendulums);

    // Re-fetch the specific pendulum after collision check,
    //    because we may have just set all to moving=false
    const updatedData = await redis.get(`pendulum:${pendulumId}`);
    if (!updatedData) {
      ws.send("Pendulum vanished unexpectedly");
      return;
    }
    const pendulum: Pendulum = JSON.parse(updatedData);

    // Compute angle for that specific pendulum
    const now = Date.now();
    const elapsedMs = now - pendulum.triggeredAt;
    const angle = pendulum.moving
      ? getCurrentAngle(pendulum.length, pendulum.theta, elapsedMs)
      : 0;

    ws.send(angle.toString());
  });
});

console.log(`[wsServer]: WebSocket server running at ws://localhost:${wsPort}`);
