import * as THREE from "three";
import { createPerspectiveCamera, createRenderer, disposeObject, easeToward } from "./shared";
import type { PointerState, Visual } from "./types";

export function createMapVisual(canvas: HTMLCanvasElement): Visual {
  const renderer = createRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = createPerspectiveCamera(10);
  const group = new THREE.Group();
  scene.add(group);

  const panelGeometry = new THREE.PlaneGeometry(0.74, 0.42);
  const panelMaterial = new THREE.MeshBasicMaterial({
    color: 0xf4f6ff,
    transparent: true,
    opacity: 0.08,
    side: THREE.DoubleSide,
  });
  const panels = new THREE.InstancedMesh(panelGeometry, panelMaterial, 18);
  group.add(panels);

  const panelPositions = Array.from({ length: 18 }, (_, index) => {
    const ring = index < 7 ? 2.1 : index < 13 ? 3.35 : 4.35;
    const angle = index * 1.77;
    return new THREE.Vector3(
      Math.cos(angle) * ring,
      Math.sin(angle * 1.1) * ring * 0.45,
      Math.sin(angle) * 2.25,
    );
  });

  const linePositions = new Float32Array(panelPositions.length * 2 * 3);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
  const lines = new THREE.LineSegments(
    lineGeometry,
    new THREE.LineBasicMaterial({
      color: 0xeef2ff,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
    }),
  );
  group.add(lines);

  const dummy = new THREE.Object3D();
  let width = 1;
  let height = 1;
  let dpr = 1;
  let rotationX = 0;
  let rotationY = 0;

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
      panelPositions.forEach((position, index) => {
        const orbit = time * (0.08 + index * 0.002) + index * 0.5;
        const current = position.clone();
        current.x += Math.sin(orbit) * 0.24;
        current.y += Math.cos(orbit * 0.8) * 0.16;
        current.z += Math.sin(orbit * 0.7) * 0.28;

        dummy.position.copy(current);
        dummy.rotation.set(
          Math.sin(time * 0.2 + index) * 0.2,
          time * 0.12 + index,
          Math.cos(time * 0.15 + index) * 0.1,
        );
        const scale = 0.82 + Math.sin(time * 0.7 + index) * 0.08;
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        panels.setMatrixAt(index, dummy.matrix);

        const next = panelPositions[(index + 5) % panelPositions.length];
        const offset = index * 6;
        linePositions[offset] = current.x;
        linePositions[offset + 1] = current.y;
        linePositions[offset + 2] = current.z;
        linePositions[offset + 3] = next.x;
        linePositions[offset + 4] = next.y;
        linePositions[offset + 5] = next.z;
      });

      panels.instanceMatrix.needsUpdate = true;
      lineGeometry.attributes.position.needsUpdate = true;
      (lines.material as THREE.LineBasicMaterial).opacity =
        pointer.active ? 0.34 : 0.18 + Math.sin(time * 0.6) * 0.05;
      rotationX = easeToward(rotationX, -pointer.normalizedY * 0.42, 0.05);
      rotationY = easeToward(rotationY, pointer.normalizedX * 0.72, 0.05);
      group.rotation.x = rotationX;
      group.rotation.y = time * 0.06 + rotationY;
      renderer.render(scene, camera);
    },
    destroy() {
      disposeObject(group);
      panelGeometry.dispose();
      panelMaterial.dispose();
      renderer.dispose();
    },
  };
}
