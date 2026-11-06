import { forwardRef } from "react";
import * as THREE from "three";

// A soap bubble, physically: thin-film iridescence (three.js's built-in
// `iridescence` extension on MeshPhysicalMaterial) plus real refraction
// (`transmission`) so it actually bends the scene behind it, not a faked
// rainbow gradient. `side={DoubleSide}` renders the far inner wall too, so
// it reads as a hollow sphere rather than a solid ball.
const Bubble = forwardRef(function Bubble(
  { radius = 1, tint = "#ffffff", opacity = 0.55, segments = 48, position = [0, 0, 0], ...props },
  ref
) {
  return (
    <mesh ref={ref} position={position} {...props}>
      <sphereGeometry args={[radius, segments, segments]} />
      <meshPhysicalMaterial
        color={tint}
        transmission={1}
        roughness={0.04}
        thickness={radius * 0.6}
        ior={1.15}
        iridescence={1}
        iridescenceIOR={1.3}
        iridescenceThicknessRange={[100, 400]}
        transparent
        opacity={opacity}
        envMapIntensity={1.5}
        clearcoat={1}
        clearcoatRoughness={0.08}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
});

export default Bubble;
