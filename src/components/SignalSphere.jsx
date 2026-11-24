import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

import { useTheme } from '../lib/theme';

/**
 * SignalSphere — projected 3D signal globe.
 *
 * Pure canvas (no WebGL, no extra dependency): a Fibonacci-distributed node
 * cloud rotated on two axes, perspective-projected, depth-sorted, with a
 * neighbour mesh, orbital rings and mouse parallax. Colours come from the
 * active theme's accent tokens, so it stays legible on both the dark and the
 * light background.
 *
 * No React state is written per frame; the animation loop owns its own data.
 */

const NODE_COUNT = 150;
const LINK_DISTANCE_SQ = 0.052;

function buildSphere() {
  const nodes = [];
  for (let i = 0; i < NODE_COUNT; i += 1) {
    const y = 1 - (i / (NODE_COUNT - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * 2.399963229728653; // golden angle
    nodes.push({
      x: Math.cos(theta) * radius,
      y,
      z: Math.sin(theta) * radius,
      tone: i % 13 === 0 ? 'violet' : i % 19 === 0 ? 'danger' : 'cyan'
    });
  }

  const links = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dz = nodes[i].z - nodes[j].z;
      if (dx * dx + dy * dy + dz * dz < LINK_DISTANCE_SQ) links.push([i, j]);
    }
  }

  return { nodes, links };
}

const SPHERE = buildSphere();

function hexToRgba(hex, alpha) {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function SignalSphere({ prefersReduced = false, mouseX = 0, mouseY = 0 }) {
  const canvasRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const reduced = prefersReduced || Boolean(prefersReducedMotion);
  const { theme } = useTheme();

  const pointer = useRef({ x: 0, y: 0 });
  pointer.current = { x: mouseX, y: mouseY };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const styles = window.getComputedStyle(document.documentElement);
    const read = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
    const palette = {
      cyan: read('--a-cyan', '#22d3ee'),
      violet: read('--a-violet', '#8b5cf6'),
      danger: read('--a-danger', '#f43f5e'),
      blue: read('--a-electric', '#3b82f6'),
      muted: read('--a-muted', '#94a3b8')
    };

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let angleY = 0;
    let angleX = 0;
    let smoothX = 0;
    let smoothY = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const draw = (timestamp) => {
      const time = timestamp || 0;
      if (!reduced) {
        angleY += 0.0028;
        smoothX += (pointer.current.x - smoothX) * 0.06;
        smoothY += (pointer.current.y - smoothY) * 0.06;
      }
      angleX = -0.26 + smoothY * 0.5;

      const cosY = Math.cos(angleY + smoothX * 0.6);
      const sinY = Math.sin(angleY + smoothX * 0.6);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const R = Math.min(width, height) * 0.36;

      // Ambient bloom
      const glow = ctx.createRadialGradient(cx, cy, R * 0.15, cx, cy, R * 1.7);
      glow.addColorStop(0, hexToRgba(palette.cyan, 0.14));
      glow.addColorStop(0.55, hexToRgba(palette.blue, 0.05));
      glow.addColorStop(1, hexToRgba(palette.blue, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Orbital rings
      for (let ring = 0; ring < 3; ring += 1) {
        const tilt = 0.32 + ring * 0.16;
        const radius = R * (1.08 + ring * 0.1);
        ctx.beginPath();
        ctx.ellipse(cx, cy, radius, radius * tilt, angleY * (ring % 2 === 0 ? 0.5 : -0.35), 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(palette.cyan, 0.1 - ring * 0.02);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const projected = SPHERE.nodes.map((node) => {
        // Rotate around Y, then X.
        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.x * sinY + node.z * cosY;
        const y1 = node.y * cosX - z1 * sinX;
        const z2 = node.y * sinX + z1 * cosX;

        const perspective = 2.05 / (2.05 - z2 * 0.85);
        return {
          x: cx + x1 * R * perspective,
          y: cy + y1 * R * perspective,
          z: z2,
          scale: perspective
        };
      });

      // Neighbour mesh — back-to-front, depth-scaled opacity
      const sortedLinks = SPHERE.links
        .map(([i, j]) => ({
          i,
          j,
          depth: (projected[i].z + projected[j].z) / 2
        }))
        .sort((a, b) => a.depth - b.depth);

      for (const link of sortedLinks) {
        const a = projected[link.i];
        const b = projected[link.j];
        const depth = (link.depth + 1) / 2;
        if (depth < 0.18) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = hexToRgba(palette.cyan, 0.04 + depth * 0.2);
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Nodes — depth sorted so near nodes sit on top
      const order = projected
        .map((point, index) => ({ point, index }))
        .sort((a, b) => a.point.z - b.point.z);

      for (const { point, index } of order) {
        const depth = (point.z + 1) / 2;
        const tone = SPHERE.nodes[index].tone;
        const color = palette[tone] || palette.cyan;
        const pulse = 0.5 + 0.5 * Math.sin(time * 0.0018 + index * 0.7);
        const radius = (1.1 + depth * 2.1 + pulse * 0.7) * point.scale;

        if (depth > 0.62) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, radius * 3.6, 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(color, 0.07 + depth * 0.07);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(point.x, point.y, Math.max(0.6, radius), 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(color, 0.2 + depth * 0.72);
        ctx.fill();
      }

      if (!reduced) frame = requestAnimationFrame(draw);
    };

    if (reduced) draw(0);
    else frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [reduced, theme]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      role="img"
      aria-label="Animated projection of signal nodes connected in a sphere"
    />
  );
}
