import React from "react";

interface TopBarProps {
  onStopAll: () => void;
  onStartAll: () => void;
  onAddPendulum: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onStopAll, onStartAll, onAddPendulum }) => {
  return (
    <g>
      {/* The dark rectangle */}
      <rect x={0} y={0} width={800} height={40} fill="#555" />

      {/* embedding HTML buttons in an SVG <foreignObject> so they appear in the bar */}
      <foreignObject x={0} y={0} width={800} height={40}>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <button onClick={onStopAll}>Stop All</button>
          <button onClick={onStartAll}>Start All</button>
          <button onClick={onAddPendulum}>Add Pendulum</button>
        </div>
      </foreignObject>
    </g>
  );
};

export default TopBar;
