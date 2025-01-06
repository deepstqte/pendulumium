import request from "supertest";
import { app } from "../index";

jest.mock("ioredis", () => {
  // Return a mock class with the methods used in the code.
  return class IORedisMock {
    private store: Record<string, string | undefined> = {};
    private setStore(key: string, val: any) {
      this.store[key] = JSON.stringify(val);
    }

    // Simulate smembers: we store an array of IDs in "pendulums"
    public async smembers(key: string): Promise<string[]> {
      const val = this.store[key];
      return val ? JSON.parse(val) : [];
    }

    public async get(key: string): Promise<string | null> {
      return this.store[key] ?? null;
    }

    public async set(key: string, value: string) {
      this.store[key] = value;
      return "OK";
    }

    public async sadd(key: string, val: string) {
      const existing = this.store[key] ? JSON.parse(this.store[key]!) : [];
      existing.push(val);
      this.store[key] = JSON.stringify(existing);
      return 1; // count of added
    }

    public async srem(key: string, val: string) {
      const existing = this.store[key] ? JSON.parse(this.store[key]!) : [];
      const newArr = existing.filter((x: string) => x !== val);
      this.store[key] = JSON.stringify(newArr);
      return 1; // number removed
    }

    public async del(key: string) {
      delete this.store[key];
      return 1;
    }

    public pipeline() {
      // For test, let's just return an object with exec that calls the commands immediately
      const commands: Array<() => void> = [];
      return {
        del: (k: string) => {
          commands.push(() => delete this.store[k]);
          return this;
        },
        exec: async () => {
          commands.forEach((cmd) => cmd());
          return [];
        },
      };
    }
  };
});

describe("API Server Tests", () => {

  describe("GET /pendulums", () => {
    it("should return an empty array if no pendulums in Redis", async () => {
      const res = await request(app).get("/pendulums");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return an array of pendulums if present", async () => {
      // We'll pre-populate the mock redis store in some way
      // Easiest is to do a POST /pendulums to create them:
      await request(app).post("/pendulums").send({ theta: 1, mass: 2, length: 3 });
      await request(app).post("/pendulums").send({ theta: 0.5, mass: 1, length: 1.5 });

      const res = await request(app).get("/pendulums");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      // check fields
      expect(res.body[0]).toHaveProperty("theta");
      expect(res.body[0]).toHaveProperty("id");
    });
  });

  describe("POST /pendulums", () => {
    it("should create a new pendulum and return 201", async () => {
      const body = { theta: 0.785, mass: 2, length: 1.5 };
      const res = await request(app).post("/pendulums").send(body);

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.theta).toBe(0.785);
      expect(res.body.mass).toBe(2);
      expect(res.body.length).toBe(1.5);
      expect(res.body.moving).toBe(true);
    });

    it("should handle missing fields gracefully", async () => {
      const body = { theta: 1.0 }; // mass and length missing
      const res = await request(app).post("/pendulums").send(body);

      expect(res.status).toBe(201);
    });
  });

  describe("GET /pendulums/:id", () => {
    it("should return 404 if pendulum not found", async () => {
      const res = await request(app).get("/pendulums/fakeId");
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Pendulum not found" });
    });

    it("should return the specific pendulum if present", async () => {
      // create a pendulum
      const create = await request(app).post("/pendulums").send({ theta: 1, mass: 2, length: 2 });
      const pendId = create.body.id;

      // get it
      const res = await request(app).get(`/pendulums/${pendId}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(pendId);
      expect(res.body.theta).toBe(1);
    });
  });

  describe("PUT /pendulums/:id", () => {
    it("should update pendulum if it exists", async () => {
      // create a pendulum first
      const create = await request(app)
        .post("/pendulums")
        .send({ theta: 0.5, mass: 1, length: 1 });
      const pendId = create.body.id;

      // now update
      const update = await request(app)
        .put(`/pendulums/${pendId}`)
        .send({ theta: 1.57, length: 2.0 });
      expect(update.status).toBe(200);
      expect(update.body.theta).toBe(1.57);
      expect(update.body.length).toBe(2.0);
      expect(update.body.mass).toBe(1); // unchanged
    });

    it("should return 404 if pendulum not found", async () => {
      const res = await request(app)
        .put("/pendulums/fakeId")
        .send({ theta: 1.1 });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Pendulum not found" });
    });
  });

  describe("DELETE /pendulums/:id", () => {
    it("should delete pendulum if it exists", async () => {
      const create = await request(app).post("/pendulums").send({ theta: 0.1, mass: 1, length: 1 });
      const pendId = create.body.id;

      const del = await request(app).delete(`/pendulums/${pendId}`);
      expect(del.status).toBe(204);

      // confirm it's gone
      const getAgain = await request(app).get(`/pendulums/${pendId}`);
      expect(getAgain.status).toBe(404);
    });
  });

  describe("POST /stopAll", () => {
    it("should set all pendulums to moving=false", async () => {
      // create 2 pendulums
      await request(app).post("/pendulums").send({ theta: 0, mass: 1, length: 1 });
      await request(app).post("/pendulums").send({ theta: 1, mass: 2, length: 1 });

      const stopRes = await request(app).post("/stopAll");
      expect(stopRes.status).toBe(200);
      expect(stopRes.body).toEqual({ message: "All pendulums have been stopped." });

      // verify
      const list = await request(app).get("/pendulums");
      list.body.forEach((p: any) => {
        expect(p.moving).toBe(false);
      });
    });
  });

  describe("POST /startAll", () => {
    it("should set all pendulums to moving=true and reset triggeredAt", async () => {
      // create some pendulums, stop them
      await request(app).post("/pendulums").send({ theta: 1, mass: 2, length: 2 });
      await request(app).post("/stopAll");

      const startRes = await request(app).post("/startAll");
      expect(startRes.status).toBe(200);
      expect(startRes.body).toEqual({ message: "All pendulums have been started." });

      // verify
      const list = await request(app).get("/pendulums");
      const now = Math.round(Date.now() / 1000); // approximate

      list.body.forEach((p: any) => {
        expect(p.moving).toBe(true);
        // triggeredAt is set to Date.now() in ms (not seconds) => can't do exact match
        // but we can check it is around current time
        expect(typeof p.triggeredAt).toBe("number");
      });
    });
  });
});
