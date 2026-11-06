// Lays out community bubbles around a fixed center (the summary bubble) in
// 3D so pairwise distance reflects overlap between two communities: higher
// overlap pulls bubbles closer together (and their spheres visually
// intersect), low/no overlap pushes them apart. It's a plain spring
// relaxation, not real physics, and it runs once when the data loads (see
// useMemo in DashboardScene) — not every frame.

function fibonacciSphere(count, radius) {
  const points = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(count - 1, 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    points.push([Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius]);
  }
  return points;
}

export function bubbleRadius(community) {
  const base = 0.5;
  const bySubs = community.subscribers ? Math.log10(community.subscribers + 10) * 0.13 : 0;
  return Math.min(1.5, base + bySubs);
}

export function solveLayout(
  communities,
  overlaps,
  { spacing = 3.2, centerRadius = 1.8, iterations = 220 } = {}
) {
  const n = communities.length;
  if (n === 0) return {};

  const idToIndex = new Map(communities.map((c, i) => [c.id, i]));
  const positions = fibonacciSphere(n, centerRadius + spacing * 1.4).map((p) => [...p]);
  const radii = communities.map((c) => bubbleRadius(c));

  const pairs = overlaps
    .filter((o) => idToIndex.has(o.a) && idToIndex.has(o.b))
    .map((o) => ({
      i: idToIndex.get(o.a),
      j: idToIndex.get(o.b),
      // more overlap -> smaller target distance, floored so bubbles never
      // fully coincide
      target: Math.max(0.35, spacing * (1 - o.overlap)),
    }));

  for (let iter = 0; iter < iterations; iter++) {
    // springs: pull/push each overlapping pair toward its target distance
    for (const { i, j, target } of pairs) {
      const pi = positions[i];
      const pj = positions[j];
      const dx = pj[0] - pi[0];
      const dy = pj[1] - pi[1];
      const dz = pj[2] - pi[2];
      const dist = Math.max(0.001, Math.sqrt(dx * dx + dy * dy + dz * dz));
      const diff = ((dist - target) / dist) * 0.03;
      const mx = dx * diff;
      const my = dy * diff;
      const mz = dz * diff;
      pi[0] += mx;
      pi[1] += my;
      pi[2] += mz;
      pj[0] -= mx;
      pj[1] -= my;
      pj[2] -= mz;
    }

    // gentle repulsion so unrelated bubbles don't collapse into each other
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const pi = positions[i];
        const pj = positions[j];
        const dx = pj[0] - pi[0];
        const dy = pj[1] - pi[1];
        const dz = pj[2] - pi[2];
        const dist = Math.max(0.001, Math.sqrt(dx * dx + dy * dy + dz * dz));
        const minDist = radii[i] + radii[j] + 0.15;
        if (dist < minDist) {
          const push = ((minDist - dist) / dist) * 0.5;
          const mx = dx * push;
          const my = dy * push;
          const mz = dz * push;
          pi[0] -= mx;
          pi[1] -= my;
          pi[2] -= mz;
          pj[0] += mx;
          pj[1] += my;
          pj[2] += mz;
        }
      }
    }

    // keep the whole cluster orbiting the center bubble at a sane radius
    for (let i = 0; i < n; i++) {
      const p = positions[i];
      const dist = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]);
      const maxDist = centerRadius + spacing * 2.2;
      if (dist > maxDist) {
        const scale = maxDist / dist;
        p[0] *= scale;
        p[1] *= scale;
        p[2] *= scale;
      }
      const minDist = centerRadius + radii[i] + 0.4;
      if (dist < minDist && dist > 0.001) {
        const scale = minDist / dist;
        p[0] *= scale;
        p[1] *= scale;
        p[2] *= scale;
      }
    }
  }

  const result = {};
  communities.forEach((c, i) => {
    result[c.id] = positions[i];
  });
  return result;
}
