import React, { useEffect, useState } from "react";
import TopBar from "./TopBar";
import AddPendulumModal from "./AddPendulumModal";
import PendulumList from "./PendulumList";
import { Pendulum } from "../../types";

/** Map of pendulumId -> current angle */
interface AngleMap {
  [id: string]: number;
}

const API_BASE = "http://localhost:3002";  // The API Server
const WS_BASE  = "ws://localhost:3001";    // The WebSocket Server

function App() {
  const [pendulums, setPendulums] = useState<Pendulum[]>([]);
  const [angles, setAngles] = useState<AngleMap>({});
  const [showModal, setShowModal] = useState(false);

  // Fetch the list of pendulums on mount
  useEffect(() => {
    fetch(`${API_BASE}/pendulums`)
      .then((res) => res.json())
      .then((data: Pendulum[]) => {
        setPendulums(data);
        // Initialize angles with each pendulum's original theta
        const initialAngles: AngleMap = {};
        data.forEach((p) => {
          initialAngles[p.id] = p.theta;
        });
        setAngles(initialAngles);
      })
      .catch((err) => console.error("Error fetching pendulums:", err));
  }, []);

  // For each pendulum, open a WebSocket and periodically request its angle
  useEffect(() => {
    if (pendulums.length === 0) return;

    // We'll keep an array of sockets (and intervals) to clean them up on unmount
    const sockets: WebSocket[] = [];
    const intervals: NodeJS.Timeout[] = [];

    pendulums.forEach((pendulum) => {
      // Create a WebSocket for this pendulum
      const ws = new WebSocket(WS_BASE);

      ws.onopen = () => {
        // Periodically re-send the pendulum ID to get the latest angle
        const intervalId = setInterval(() => {
          ws.send(pendulum.id);
        }, 10); // request angle every 10 milliseconds

        // Keep track so we can clear later
        intervals.push(intervalId);
      };

      ws.onmessage = (event) => {
        // The server sends back the current angle (as a string)
        const currentAngle = parseFloat(event.data);
        setAngles((prev) => ({
          ...prev,
          [pendulum.id]: currentAngle,
        }));
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      ws.onclose = () => {
        console.log(`WebSocket closed for pendulum ${pendulum.id}`);
      };

      sockets.push(ws);
    });

    // Cleanup when this effect re-runs or when unmounting:
    return () => {
      sockets.forEach((socket) => socket.close());
      intervals.forEach((id) => clearInterval(id));
    };
  }, [pendulums]);

  const stopAll = async () => {
    try {
      await fetch(`${API_BASE}/stopAll`, {
        method: "POST",
      });
      console.log("All pendulums stopped");
    } catch (error) {
      console.error("Error stopping pendulums:", error);
    }
  };

  const startAll = async () => {
    try {
      await fetch(`${API_BASE}/startAll`, {
        method: "POST",
      });
      console.log("All pendulums started");
    } catch (error) {
      console.error("Error starting pendulums:", error);
    }
  };

  const addPendulum = async (theta: number, mass: number, length: number) => {
    try {
      const resp = await fetch(`${API_BASE}/pendulums`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theta, mass, length }),
      });
      if (!resp.ok) {
        throw new Error("Failed to create pendulum");
      }
      const newPendulum = (await resp.json()) as Pendulum;

      // Update local state
      setPendulums((prev) => [...prev, newPendulum]);
      setAngles((prev) => ({
        ...prev,
        [newPendulum.id]: newPendulum.theta,
      }));
      setShowModal(false);
    } catch (err) {
      console.error("Error adding pendulum:", err);
    }
  };

  const updatePendulum = async (id: string, updates: Partial<Pendulum>) => {
    const resp = await fetch(`${API_BASE}/pendulums/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!resp.ok) throw new Error("Failed to update pendulum");
    const updated = (await resp.json()) as Pendulum;
    setPendulums((prev) =>
      prev.map((p) => (p.id === id ? updated : p))
    );
  };

  const deletePendulum = async (id: string) => {
    const resp = await fetch(`${API_BASE}/pendulums/${id}`, {
      method: "DELETE",
    });
    if (!resp.ok) throw new Error("Failed to delete pendulum");
    setPendulums((prev) => prev.filter((p) => p.id !== id));
  };

  // Render the pendulums in an SVG
  // These need to be in sync with the values in the collision detection logic in the WS server
  // TODO: Make these environment variables and have both the UI and WS server get the values from the environment
  const width = 800;
  const height = 600;

  const ceilingHeight = 40;
  const anchorY = ceilingHeight;
  const anchorSpacing = 120;
  const xOffset = 100;

  // Scale: e.g. for 1 meter = 10 pixels, set lengthScale=10
  const lengthScale = 10;

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Pendulum Visualization</h1>
      <svg width={width} height={height} style={{ border: "1px solid #ccc" }}>
      <TopBar
        onStopAll={stopAll}
        onStartAll={startAll}
        onAddPendulum={() => setShowModal(true)}
      />

        {pendulums.map((pendulum, idx) => {
          const anchorX = xOffset + idx * anchorSpacing;
          const angle   = angles[pendulum.id] ?? pendulum.theta;

          // Convert length in meters -> pixels
          const lengthPx = pendulum.length * lengthScale;

          // The bob’s position using angle from vertical
          // (angle=0 means "straight down")
          const bobX = anchorX + lengthPx * Math.sin(angle);
          const bobY = anchorY + lengthPx * Math.cos(angle);

          return (
            <g key={pendulum.id}>
              {/* String from anchor to bob */}
              <line
                x1={anchorX}
                y1={anchorY}
                x2={bobX}
                y2={bobY}
                stroke="#333"
                strokeWidth={2}
              />
              {/* Bob */}
              <circle
                cx={bobX}
                cy={bobY}
                r={15}
                fill="cornflowerblue"
              />
            </g>
          );
        })}
      </svg>
      <AddPendulumModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={addPendulum}
      />
      <PendulumList
        pendulums={pendulums}
        onUpdatePendulum={updatePendulum}
        onDeletePendulum={deletePendulum}
      />
    </div>
  );
}

export default App;
