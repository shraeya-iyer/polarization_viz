import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, Html } from "@react-three/drei";
import Bubble from "./Bubble.jsx";
import { solveLayout, bubbleRadius } from "./layout.js";

const CENTER_RADIUS = 1.8;

// Faint per-risk tint on top of the iridescent shine — subtle by design, so
// risk is still primarily read via the badge in the detail panel, not color
// alone.
const RISK_TINT = {
  low: "#ffffff",
  medium: "#fff3da",
  high: "#ffe0e0",
};

function IdleBubble({ position, radius, tint, opacity, onClick, selected }) {
  const ref = useRef();
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.set(
      position[0] + Math.sin(t * 0.4 + phase) * 0.06,
      position[1] + Math.sin(t * 0.35 + phase * 1.4) * 0.06,
      position[2] + Math.cos(t * 0.3 + phase * 0.7) * 0.06
    );
  });

  return (
    <Bubble
      ref={ref}
      radius={selected ? radius * 1.1 : radius}
      tint={tint}
      opacity={opacity}
      segments={32}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    />
  );
}

export default function DashboardScene({ summary, communities, overlaps, onSelect, selectedId }) {
  const layout = useMemo(() => solveLayout(communities, overlaps), [communities, overlaps]);

  return (
    <Canvas camera={{ position: [0, 1.5, 13], fov: 50 }} dpr={[1, 1.5]}>
      <color attach="background" args={["#fbf8fb"]} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[6, 10, 6]} intensity={0.85} />
      <Environment preset="city" />
      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={26}
        autoRotate
        autoRotateSpeed={0.35}
      />

      <Bubble radius={CENTER_RADIUS} opacity={0.62} tint="#ffffff" />
      {summary && (
        <Html center distanceFactor={10} position={[0, 0, CENTER_RADIUS + 0.05]} style={{ pointerEvents: "none" }}>
          <div className="bubble-summary-label">
            <strong>{summary.total}</strong> communities
            <br />
            {summary.counts.high} high · {summary.counts.medium} medium · {summary.counts.low} low
          </div>
        </Html>
      )}

      {communities.map((c) => {
        const pos = layout[c.id] ?? [0, 0, 0];
        return (
          <IdleBubble
            key={c.id}
            position={pos}
            radius={bubbleRadius(c)}
            tint={RISK_TINT[c.risk_level]}
            opacity={0.55}
            selected={c.id === selectedId}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(c.id === selectedId ? null : c.id);
            }}
          />
        );
      })}
    </Canvas>
  );
}
