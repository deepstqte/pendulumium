import React, { useState, useEffect } from "react";

interface AddPendulumModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (theta: number, mass: number, length: number) => void;
}

const AddPendulumModal: React.FC<AddPendulumModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [theta, setTheta] = useState<string>("");
  const [mass, setMass] = useState<string>("");
  const [length, setLength] = useState<string>("");

  useEffect(() => {
    if (visible) {
      setTheta("");
      setMass("");
      setLength("");
    }
  }, [visible]);

  if (!visible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const thetaVal = parseFloat(theta);
    const massVal = parseFloat(mass);
    const lengthVal = parseFloat(length);

    onSubmit(thetaVal, massVal, lengthVal);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Modal content */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "1rem",
          borderRadius: "4px",
          minWidth: "300px",
        }}
      >
        <h2>Add a Pendulum</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label>Theta (radians): </label>
            <input
              type="number"
              step="0.01"
              value={theta}
              onChange={(e) => setTheta(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label>Mass (kg): </label>
            <input
              type="number"
              step="0.01"
              value={mass}
              onChange={(e) => setMass(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label>Length (m): </label>
            <input
              type="number"
              step="0.01"
              value={length}
              onChange={(e) => setLength(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPendulumModal;
