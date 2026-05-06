import * as THREE from "three";
import {
  createPerspectiveCamera,
  createRenderer,
  disposeObject,
  easeToward,
} from "./shared";
import type { PointerState, Visual } from "./types";

export function createFogVisual(canvas: HTMLCanvasElement): Visual {
  const renderer = createRenderer(canvas);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050607, 0.09);
  const camera = createPerspectiveCamera(9.8);
  const group = new THREE.Group();
  scene.add(group);

  const rows = 24;
  const columns = 34;
  const segmentCount = rows * (columns - 1) + columns * (rows - 1);
  const positions = new Float32Array(segmentCount * 2 * 3);
  const points = Array.from({ length: rows * columns }, (_, index) => {
    const x = (index % columns) - columns / 2;
    const y = Math.floor(index / columns) - rows / 2;
    const normalizedY = y / rows;
    const perspective = 1 + Math.max(0, normalizedY + 0.12) * 1.65;

    return new THREE.Vector3(
      x * 0.35 * perspective,
      y * 0.23 - 0.62,
      Math.sin(x * 0.42) * 0.12 + Math.cos(y * 0.5) * 0.08,
    );
  });

  let cursor = 0;
  const writeSegment = (from: THREE.Vector3, to: THREE.Vector3) => {
    positions[cursor++] = from.x;
    positions[cursor++] = from.y;
    positions[cursor++] = from.z;
    positions[cursor++] = to.x;
    positions[cursor++] = to.y;
    positions[cursor++] = to.z;
  };

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns - 1; x += 1) {
      writeSegment(points[y * columns + x], points[y * columns + x + 1]);
    }
  }
  for (let x = 0; x < columns; x += 1) {
    for (let y = 0; y < rows - 1; y += 1) {
      writeSegment(points[y * columns + x], points[(y + 1) * columns + x]);
    }
  }

  const lattice = new THREE.LineSegments(
    new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(positions, 3)),
    new THREE.LineBasicMaterial({
      color: 0xe8efff,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
    }),
  );
  group.add(lattice);

  const horizonGeometry = new THREE.BufferGeometry();
  const horizonPositions = new Float32Array(96 * 3);
  for (let index = 0; index < 96; index += 1) {
    const t = index / 95;
    const x = (t - 0.5) * 11.5;
    const mountain =
      Math.sin(t * Math.PI * 5.2) * 0.23 +
      Math.sin(t * Math.PI * 13.7) * 0.08;
    horizonPositions[index * 3] = x;
    horizonPositions[index * 3 + 1] = 1.16 + mountain;
    horizonPositions[index * 3 + 2] = 0.08;
  }
  horizonGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(horizonPositions, 3),
  );
  const horizon = new THREE.Line(
    horizonGeometry,
    new THREE.LineBasicMaterial({
      color: 0xfff0c9,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
    }),
  );
  group.add(horizon);

  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(360 * 3);
  for (let index = 0; index < particlePositions.length; index += 3) {
    particlePositions[index] = (Math.random() - 0.5) * 9;
    particlePositions[index + 1] = (Math.random() - 0.5) * 6;
    particlePositions[index + 2] = (Math.random() - 0.5) * 5;
  }
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.018,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  group.add(particles);

  let width = 1;
  let height = 1;
  let dpr = 1;
  let targetOpacity = 0.16;

  return {
    resize(nextWidth, nextHeight, nextDpr) {
      width = nextWidth;
      height = nextHeight;
      dpr = nextDpr;
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    render(time, _delta, pointer: PointerState) {
      targetOpacity = easeToward(
        targetOpacity,
        pointer.active ? 0.32 + Math.abs(pointer.normalizedX) * 0.1 : 0.2,
        0.04,
      );
      (lattice.material as THREE.LineBasicMaterial).opacity =
        targetOpacity + Math.sin(time * 0.8) * 0.035;
      (horizon.material as THREE.LineBasicMaterial).opacity =
        0.18 + Math.sin(time * 0.5) * 0.04;
      (particles.material as THREE.PointsMaterial).opacity =
        pointer.active ? 0.42 : 0.26 + Math.sin(time * 0.6) * 0.06;

      group.rotation.x = 0.04 + pointer.normalizedY * 0.03;
      group.rotation.y = pointer.normalizedX * 0.035;
      group.position.x = pointer.normalizedX * 0.28;
      group.position.y = -pointer.normalizedY * 0.18;
      particles.rotation.z = time * 0.025;
      renderer.render(scene, camera);
    },
    destroy() {
      disposeObject(group);
      renderer.dispose();
    },
  };
}
