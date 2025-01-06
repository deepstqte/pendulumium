// PendulumItem.tsx
import React, { useState } from "react";
import { Pendulum } from "../../types";

interface PendulumItemProps {
  pendulum: Pendulum;
  onUpdate: (id: string, updates: Partial<Pendulum>) => void;
  onDelete: (id: string) => void;
}

const PendulumItem: React.FC<PendulumItemProps> = ({
  pendulum,
  onUpdate,
  onDelete
}) => {
  const [editing, setEditing] = useState(false);
  const [theta, setTheta] = useState(pendulum.theta.toString());
  const [mass, setMass] = useState(pendulum.mass.toString());
  const [length, setLength] = useState(pendulum.length.toString());

  const handleSave = () => {
    onUpdate(pendulum.id, {
      theta: parseFloat(theta),
      mass: parseFloat(mass),
      length: parseFloat(length)
    });
    setEditing(false);
  };

  if (!editing) {
    return (
      <div style={itemStyle}>
        <div><strong>ID:</strong> {pendulum.id}</div>
        <div>Angle: {pendulum.theta}</div>
        <div>Mass: {pendulum.mass}</div>
        <div>Length: {pendulum.length}</div>
        <button onClick={() => setEditing(true)}>Edit</button>
        <button onClick={() => onDelete(pendulum.id)}>Delete</button>
      </div>
    );
  }

  // Edit mode
  return (
    <div style={itemStyle}>
      <div><strong>ID:</strong> {pendulum.id}</div>
      <label>
        Theta:{" "}
        <input
          type="number"
          step="0.01"
          value={theta}
          onChange={(e) => setTheta(e.target.value)}
        />
      </label>
      <label>
        Mass:{" "}
        <input
          type="number"
          step="0.01"
          value={mass}
          onChange={(e) => setMass(e.target.value)}
        />
      </label>
      <label>
        Length:{" "}
        <input
          type="number"
          step="0.01"
          value={length}
          onChange={(e) => setLength(e.target.value)}
        />
      </label>
      <button onClick={handleSave}>Save</button>
      <button onClick={() => setEditing(false)}>Cancel</button>
    </div>
  );
};

const itemStyle: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: "0.5rem",
  marginBottom: "0.5rem"
};

export default PendulumItem;
