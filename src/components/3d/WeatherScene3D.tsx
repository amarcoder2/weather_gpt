'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { WeatherVisualConfig, QualityLevel } from '../../types/visualWeather';

interface WeatherScene3DProps {
  config: WeatherVisualConfig;
  quality?: QualityLevel;
  interactive?: boolean;
}

export const WeatherScene3D: React.FC<WeatherScene3DProps> = ({
  config,
  quality = 'high',
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let animFrameId: number;

    // Meshes and Particle Groups
    let globeMesh: THREE.Mesh;
    let cloudInnerMesh: THREE.Mesh;
    let cloudOuterMesh: THREE.Mesh;
    let rainParticles: THREE.Points | null = null;
    let windStreamlines: THREE.LineSegments | null = null;
    let heatParticles: THREE.Points | null = null;
    let cycloneParticles: THREE.Points | null = null;

    // Lighting
    let sunLight: THREE.DirectionalLight;
    let ambientLight: THREE.AmbientLight;
    let lightningLight: THREE.PointLight;
    let atmosphereGlow: THREE.Mesh;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    try {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.z = 2.9;

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: quality !== 'low',
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === 'high' ? 2 : 1.5));
      container.appendChild(renderer.domElement);

      // Fog setup
      if (config.fogDensity > 0) {
        scene.fog = new THREE.FogExp2(config.fogColor, config.fogDensity);
      }

      // Base Lighting
      ambientLight = new THREE.AmbientLight(config.ambientColor, config.ambientIntensity);
      scene.add(ambientLight);

      sunLight = new THREE.DirectionalLight(config.sunColor, config.sunIntensity);
      sunLight.position.set(4, 3, 5);
      scene.add(sunLight);

      // Lightning Light (dormant by default)
      lightningLight = new THREE.PointLight(0xa5b4fc, 0, 10);
      lightningLight.position.set(0, 1.2, 1.5);
      scene.add(lightningLight);

      // --- 1. Earth Globe Core ---
      const globeGeometry = new THREE.SphereGeometry(1, 48, 48);
      const globeMaterial = new THREE.MeshPhongMaterial({
        color: config.globeColor,
        emissive: 0x030814,
        specular: 0x38bdf8,
        shininess: 30,
      });
      globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
      scene.add(globeMesh);

      // Atmosphere rim glow
      const glowGeo = new THREE.SphereGeometry(1.16, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({
        color: config.sunColor,
        transparent: true,
        opacity: 0.12,
        side: THREE.BackSide,
      });
      atmosphereGlow = new THREE.Mesh(glowGeo, glowMat);
      scene.add(atmosphereGlow);

      // --- 2. Procedural Layered Clouds ---
      // Inner low-to-mid cloud layer
      const cloudInnerGeo = new THREE.SphereGeometry(1.028, 48, 48);
      const cloudInnerMat = new THREE.MeshStandardMaterial({
        color: config.cloudColor,
        transparent: true,
        opacity: Math.max(0.1, config.cloudDensity * 0.65),
        roughness: 0.9,
        wireframe: config.cloudDensity > 0.4,
      });
      cloudInnerMesh = new THREE.Mesh(cloudInnerGeo, cloudInnerMat);
      scene.add(cloudInnerMesh);

      // Outer high-altitude cloud shell
      const cloudOuterGeo = new THREE.SphereGeometry(1.055, 36, 36);
      const cloudOuterMat = new THREE.MeshStandardMaterial({
        color: config.cloudColor,
        transparent: true,
        opacity: Math.max(0.05, config.cloudDensity * 0.35),
        roughness: 0.8,
        wireframe: true,
      });
      cloudOuterMesh = new THREE.Mesh(cloudOuterGeo, cloudOuterMat);
      scene.add(cloudOuterMesh);

      // --- 3. 3D Rain Particle System ---
      let rainPositions: Float32Array;
      if (config.rainCount > 0) {
        const count = config.rainCount;
        const rainGeo = new THREE.BufferGeometry();
        rainPositions = new Float32Array(count * 3);

        for (let i = 0; i < count * 3; i += 3) {
          rainPositions[i] = (Math.random() - 0.5) * 2.8;
          rainPositions[i + 1] = Math.random() * 2.4 - 1.2;
          rainPositions[i + 2] = (Math.random() - 0.5) * 2.8;
        }

        rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
        const rainMat = new THREE.PointsMaterial({
          color: 0x93c5fd,
          size: 0.035,
          transparent: true,
          opacity: 0.75,
        });
        rainParticles = new THREE.Points(rainGeo, rainMat);
        scene.add(rainParticles);
      }

      // --- 4. Wind Streamlines System ---
      if (config.windSpeed > 10) {
        const lineCount = Math.min(Math.round(config.windSpeed * 1.5), 120);
        const lineGeo = new THREE.BufferGeometry();
        const linePositions = new Float32Array(lineCount * 6); // 2 vertices per line

        for (let i = 0; i < lineCount; i++) {
          const idx = i * 6;
          const theta = Math.random() * Math.PI * 2;
          const phi = (Math.random() - 0.5) * Math.PI * 0.7;
          const r = 1.08 + Math.random() * 0.25;

          const x1 = r * Math.cos(phi) * Math.sin(theta);
          const y1 = r * Math.sin(phi);
          const z1 = r * Math.cos(phi) * Math.cos(theta);

          // Vector offset according to wind angle
          const angle = config.windDirectionAngle;
          const len = 0.12 + (config.windSpeed / 100) * 0.15;
          const x2 = x1 + Math.cos(angle) * len;
          const y2 = y1 + Math.sin(angle) * (len * 0.3);
          const z2 = z1 + Math.sin(angle) * len;

          linePositions[idx] = x1;
          linePositions[idx + 1] = y1;
          linePositions[idx + 2] = z1;
          linePositions[idx + 3] = x2;
          linePositions[idx + 4] = y2;
          linePositions[idx + 5] = z2;
        }

        lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x818cf8,
          transparent: true,
          opacity: 0.45,
        });
        windStreamlines = new THREE.LineSegments(lineGeo, lineMat);
        scene.add(windStreamlines);
      }

      // --- 5. Heat Convection Particles ---
      let heatPositions: Float32Array;
      if (config.hasHeatHaze) {
        const heatCount = 160;
        const heatGeo = new THREE.BufferGeometry();
        heatPositions = new Float32Array(heatCount * 3);

        for (let i = 0; i < heatCount * 3; i += 3) {
          heatPositions[i] = (Math.random() - 0.5) * 2.2;
          heatPositions[i + 1] = Math.random() * 2.0 - 1.0;
          heatPositions[i + 2] = (Math.random() - 0.5) * 2.2;
        }

        heatGeo.setAttribute('position', new THREE.BufferAttribute(heatPositions, 3));
        const heatMat = new THREE.PointsMaterial({
          color: 0xf59e0b,
          size: 0.045,
          transparent: true,
          opacity: 0.6,
        });
        heatParticles = new THREE.Points(heatGeo, heatMat);
        scene.add(heatParticles);
      }

      // --- 6. Cyclone Spiral Vortex System ---
      let cyclonePositions: Float32Array;
      if (config.hasCycloneVortex) {
        const armsCount = 4;
        const ptsPerArm = 80;
        const totalPts = armsCount * ptsPerArm;
        const cycloneGeo = new THREE.BufferGeometry();
        cyclonePositions = new Float32Array(totalPts * 3);

        let pIdx = 0;
        for (let arm = 0; arm < armsCount; arm++) {
          const armAngle = (arm * 2 * Math.PI) / armsCount;
          for (let p = 0; p < ptsPerArm; p++) {
            const t = p / ptsPerArm; // 0 to 1
            const spiralAngle = armAngle + t * 4.5;
            const r = 0.25 + t * 0.95; // Eye to outer band

            cyclonePositions[pIdx * 3] = r * Math.cos(spiralAngle);
            cyclonePositions[pIdx * 3 + 1] = (Math.random() - 0.5) * 0.15; // flat vortex disk
            cyclonePositions[pIdx * 3 + 2] = r * Math.sin(spiralAngle) + 0.95;
            pIdx++;
          }
        }

        cycloneGeo.setAttribute('position', new THREE.BufferAttribute(cyclonePositions, 3));
        const cycloneMat = new THREE.PointsMaterial({
          color: 0xc084fc,
          size: 0.04,
          transparent: true,
          opacity: 0.85,
        });
        cycloneParticles = new THREE.Points(cycloneGeo, cycloneMat);
        scene.add(cycloneParticles);
      }

      // --- Interaction handlers ---
      let isDragging = false;
      let prevMouseX = 0;
      let prevMouseY = 0;
      let rotVelocityX = 0;
      let rotVelocityY = 0;

      const onMouseDown = (e: MouseEvent) => {
        if (!interactive) return;
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!interactive || !isDragging) return;
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        rotVelocityY = deltaX * 0.005;
        rotVelocityX = deltaY * 0.005;
      };

      const onMouseUp = () => {
        isDragging = false;
      };

      container.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);

      // Lightning timing generator
      let nextLightningTime = performance.now() + 2500;
      let lightningFade = 0;

      // --- Animation Loop ---
      const animate = (time: number) => {
        animFrameId = requestAnimationFrame(animate);

        // Natural Earth & Cloud rotation
        globeMesh.rotation.y += 0.0018 + rotVelocityY;
        cloudInnerMesh.rotation.y += config.cloudSpeed + rotVelocityY * 1.2;
        cloudOuterMesh.rotation.y += config.cloudSpeed * 0.7 + rotVelocityY * 0.9;
        cloudOuterMesh.rotation.x += 0.0003;

        // Damping interactive rotation
        rotVelocityX *= 0.92;
        rotVelocityY *= 0.92;
        globeMesh.rotation.x += rotVelocityX;

        // Animate Rain Particles
        if (rainParticles && rainPositions) {
          const count = config.rainCount;
          const posAttr = rainParticles.geometry.attributes.position as THREE.BufferAttribute;
          const array = posAttr.array as Float32Array;

          for (let i = 0; i < count * 3; i += 3) {
            array[i + 1] -= config.rainSpeed; // fall
            array[i] += Math.cos(config.windDirectionAngle) * 0.01; // drift

            // Recycle to top
            if (array[i + 1] < -1.3) {
              array[i + 1] = 1.3;
              array[i] = (Math.random() - 0.5) * 2.8;
              array[i + 2] = (Math.random() - 0.5) * 2.8;
            }
          }
          posAttr.needsUpdate = true;
        }

        // Animate Wind Streamlines
        if (windStreamlines) {
          windStreamlines.rotation.y += 0.0035;
        }

        // Animate Heat Convection Particles (Rising)
        if (heatParticles && heatPositions) {
          const posAttr = heatParticles.geometry.attributes.position as THREE.BufferAttribute;
          const array = posAttr.array as Float32Array;
          const count = 160;

          for (let i = 0; i < count * 3; i += 3) {
            array[i + 1] += 0.008; // rise
            if (array[i + 1] > 1.2) {
              array[i + 1] = -1.0;
              array[i] = (Math.random() - 0.5) * 2.2;
            }
          }
          posAttr.needsUpdate = true;
        }

        // Animate Cyclone Spiral Vortex
        if (cycloneParticles) {
          cycloneParticles.rotation.y -= 0.018; // cyclonic anticlockwise spin
          cycloneParticles.rotation.z += 0.002;
        }

        // Thunderstorm Lightning Flash Logic
        if (config.hasLightning) {
          if (time > nextLightningTime) {
            // Flash on
            lightningLight.intensity = 3.5;
            lightningFade = 1.0;
            const [minMs, maxMs] = config.lightningIntervalRange;
            nextLightningTime = time + minMs + Math.random() * (maxMs - minMs);
          } else if (lightningFade > 0) {
            lightningFade -= 0.08;
            lightningLight.intensity = Math.max(0, lightningFade * 3.5);
          }
        }

        renderer.render(scene, camera);
      };

      animFrameId = requestAnimationFrame(animate);

      // Responsive resize
      const handleResize = () => {
        if (!container) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        cancelAnimationFrame(animFrameId);
        container.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('resize', handleResize);

        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    } catch (err) {
      console.warn('WeatherScene3D initialization error:', err);
    }
  }, [config, quality, interactive]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[360px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      aria-label={`Atmospheric 3D Weather Simulation (${config.state})`}
      role="img"
    />
  );
};
