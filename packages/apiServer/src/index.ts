import express, { Request, Response } from "express";
import dotenv from "dotenv";
import Redis from "ioredis";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { Pendulum } from "../../types";

dotenv.config();

// Create the Express app
export const app = express();
const port = process.env.API_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Redis client (defaults to localhost:6379)
const redis = new Redis();

/**
 * Helper function to set the `moving` property of all existing pendulums
 * @param isMoving - The boolean value to set for `moving`
 */
async function setAllMoving(isMoving: boolean): Promise<void> {
  const pendulumIds = await redis.smembers("pendulums");
  for (const id of pendulumIds) {
    const data = await redis.get(`pendulum:${id}`);
    if (data) {
      const pendulum: Pendulum = JSON.parse(data);
      pendulum.moving = isMoving;
      // Overwrite in Redis
      await redis.set(`pendulum:${id}`, JSON.stringify(pendulum));
    }
  }
}

/**
 * Helper function to set the `moving` property of all existing pendulums
 * @param isMoving - The boolean value to set for `moving`
 */
async function resetTriggeredAt(): Promise<void> {
  const pendulumIds = await redis.smembers("pendulums");
  for (const id of pendulumIds) {
    const data = await redis.get(`pendulum:${id}`);
    if (data) {
      const pendulum: Pendulum = JSON.parse(data);
      pendulum.triggeredAt = Math.round(Date.now());
      // Overwrite in Redis
      await redis.set(`pendulum:${id}`, JSON.stringify(pendulum));
    }
  }
}

// API Endpoints
// List all pendulums
app.get("/pendulums", async (req: Request, res: Response) => {
  try {
    const pendulumIds = await redis.smembers("pendulums");
    const pendulums: Pendulum[] = [];

    for (const id of pendulumIds) {
      const data = await redis.get(`pendulum:${id}`);
      if (data) {
        pendulums.push(JSON.parse(data));
      }
    }
    return res.json(pendulums);
  } catch (error) {
    console.error("Error listing pendulums:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET a single pendulum by ID
app.get("/pendulums/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await redis.get(`pendulum:${id}`);

    if (!data) {
      return res.status(404).json({ error: "Pendulum not found" });
    }

    const pendulum: Pendulum = JSON.parse(data);
    return res.json(pendulum);
  } catch (error) {
    console.error("Error retrieving pendulum:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Create a new pendulum
app.post("/pendulums", async (req: Request, res: Response) => {
  try {
    const { theta, mass, length } = req.body;
    const id = uuidv4();
    const triggeredAt: number = Math.round(Date.now());
    const newPendulum: Pendulum = { id, theta, mass, length, triggeredAt, moving:true };

    await redis.sadd("pendulums", id);
    await redis.set(`pendulum:${id}`, JSON.stringify(newPendulum));
    return res.status(201).json(newPendulum);
  } catch (error) {
    console.error("Error creating pendulum:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update an existing pendulum
app.put("/pendulums/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await redis.get(`pendulum:${id}`);
    if (!data) {
      return res.status(404).json({ error: "Pendulum not found" });
    }

    // The existing pendulum
    const pendulumToUpdate = JSON.parse(data) as Pendulum;

    // Merge any new values from the request body
    const { theta, mass, length } = req.body;
    if (theta !== undefined) pendulumToUpdate.theta = theta;
    if (mass !== undefined) pendulumToUpdate.mass = mass;
    if (length !== undefined) pendulumToUpdate.length = length;

    // Save updated pendulum back to Redis
    await redis.set(`pendulum:${id}`, JSON.stringify(pendulumToUpdate));

    return res.json(pendulumToUpdate);
  } catch (error) {
    console.error("Error updating pendulum:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a single pendulum
app.delete("/pendulums/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await redis.srem("pendulums", id);
    await redis.del(`pendulum:${id}`);
    return res.sendStatus(204);
  } catch (error) {
    console.error("Error deleting pendulum:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete all pendulums
app.delete("/pendulums", async (req: Request, res: Response) => {
  try {
    const pendulumIds = await redis.smembers("pendulums");
    const pipeline = redis.pipeline();
    for (const id of pendulumIds) {
      pipeline.del(`pendulum:${id}`);
    }
    pipeline.del("pendulums");
    await pipeline.exec();
    return res.sendStatus(204);
  } catch (error) {
    console.error("Error deleting all pendulums:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Stop all pendulums
app.post("/stopAll", async (req: Request, res: Response) => {
  try {
    await setAllMoving(false);
    return res.json({ message: "All pendulums have been stopped." });
  } catch (error) {
    console.error("Error stopping all pendulums:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start all pendulums
app.post("/startAll", async (req: Request, res: Response) => {
  try {
    await resetTriggeredAt();
    await setAllMoving(true);
    return res.json({ message: "All pendulums have been started." });
  } catch (error) {
    console.error("Error starting all pendulums:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the API server
if (require.main === module) {
  app.listen(port, () => {
    console.log(`[apiServer]: REST server running on http://localhost:${port}`);
  });
}
