import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import Bubble from "./Bubble.jsx";

const BUBBLE_COUNT = 24;
const BOUNDS = { x: 8.5, y: 5, z: 4.5 };

function makeBubbles() {
  return Array.from({ length: BUBBLE_COUNT }, (_, i) => ({
    id: i,
    radius: 0.3 + Math.random() * 1.05,
    basePos: [
      (Math.random() * 2 - 1) * BOUNDS.x,
      (Math.random() * 2 - 1) * BOUNDS.y,
      (Math.random() * 2 - 1) * BOUNDS.z,
    ],
    speed: 0.12 + Math.random() * 0.22,
    phase: Math.random() * Math.PI * 2,
    ampX: 0.6 + Math.random() * 0.6,
    ampY: 0.5 + Math.random() * 0.5,
    ampZ: 0.4 + Math.random() * 0.4,
  }));
}

function FloatingBubble({ data }) {
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * data.speed + data.phase;
    const [bx, by, bz] = data.basePos;
    ref.current.position.set(
      bx + Math.sin(t) * data.ampX,
      by + Math.sin(t * 0.8 + 1.3) * data.ampY,
      bz + Math.cos(t * 0.6) * data.ampZ
    );
    ref.current.rotation.x += 0.0012;
    ref.current.rotation.y += 0.0018;
  });

  return (
    <Bubble
      ref={ref}
      radius={data.radius}
      position={data.basePos}
      opacity={0.48}
      segments={24}
    />
  );
}

export default function LandingScene() {
  const bubbles = useMemo(() => makeBubbles(), []);

  return (
    <Canvas camera={{ position: [0, 0, 11], fov: 50 }} dpr={[1, 1.5]}>
      <color attach="background" args={["#fbf8fb"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 5]} intensity={0.7} />
      <Environment preset="city" />
      {bubbles.map((b) => (
        <FloatingBubble key={b.id} data={b} />
      ))}
    </Canvas>
  );
}
