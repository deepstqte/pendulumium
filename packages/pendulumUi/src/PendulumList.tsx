// PendulumList.tsx
import React from "react";
import PendulumItem from "./PendulumItem";
import { Pendulum } from "../../types";

interface PendulumListProps {
  pendulums: Pendulum[];
  onUpdatePendulum: (id: string, updates: Partial<Pendulum>) => void;
  onDeletePendulum: (id: string) => void;
}

const PendulumList: React.FC<PendulumListProps> = ({
  pendulums,
  onUpdatePendulum,
  onDeletePendulum
}) => {
  return (
    <div style={{ marginTop: "1rem", textAlign: "left" }}>
      <h2>All Pendulums</h2>
      {pendulums.map((p) => (
        <PendulumItem
          key={p.id}
          pendulum={p}
          onUpdate={onUpdatePendulum}
          onDelete={onDeletePendulum}
        />
      ))}
      {pendulums.length === 0 && <div>No pendulums yet.</div>}
    </div>
  );
};

export default PendulumList;
