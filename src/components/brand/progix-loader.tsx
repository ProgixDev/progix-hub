"use client";

/**
 * ProgixLoader — the animated 3D Progix logo, for loading screens only. The glb (the
 * "Assemble" clip) lives in /public/models. WebGL + three are heavy, so this is always
 * reached through a `next/dynamic(..., { ssr: false })` import (see loading-screen.tsx)
 * — three never enters the main bundle. The flat, static logo is in logo.tsx.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type Props = {
  /** Canvas height in px; width follows the logo's 2.4:1 ratio. */
  size?: number;
  /** Loop the assemble animation (true) or play it once (false). */
  loop?: boolean;
};

export function ProgixLoader({ size = 200, loop = true }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = Math.round(size * 2.4);
    const height = size;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0.05, 3.3);

    // Simple studio: soft key + brand-cyan rim.
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(-2, 3, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x1ec8e6, 1.8);
    rim.position.set(2, 1, -3);
    scene.add(rim);

    let mixer: THREE.AnimationMixer | undefined;
    const clock = new THREE.Clock();
    let raf = 0;
    let disposed = false;

    new GLTFLoader().load("/models/progix-logo-loader.glb", (gltf) => {
      if (disposed) return;
      // The glb bakes the wordmark in near-black navy (PROGIX_Navy*) which disappears on a
      // dark background, and a deep cyan swoosh. Recolour to a white logo + a lighter cyan
      // so it reads in dark mode (mirrors the flat logo's colours).
      gltf.scene.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((raw) => {
          const mat = raw as THREE.MeshStandardMaterial;
          if (mat.name?.includes("Cyan")) {
            mat.color.set("#4fd6f2");
            mat.emissive?.set("#1fb4d8");
          } else {
            mat.color.set(mat.name?.includes("Dark") ? "#c9d4e6" : "#f4f7fc");
            mat.emissive?.set("#000000");
          }
        });
      });
      scene.add(gltf.scene);
      const clip = gltf.animations[0]; // "Assemble"
      if (clip) {
        mixer = new THREE.AnimationMixer(gltf.scene);
        const action = mixer.clipAction(clip);
        if (loop) {
          action.setLoop(THREE.LoopRepeat, Infinity);
        } else {
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = true;
        }
        action.play();
      }
    });

    const tick = () => {
      raf = requestAnimationFrame(tick);
      mixer?.update(clock.getDelta());
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m: THREE.Material) => m.dispose());
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [size, loop]);

  return <div ref={mountRef} style={{ display: "grid", placeItems: "center" }} />;
}
