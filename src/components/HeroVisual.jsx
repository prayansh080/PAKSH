import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * HeroVisual — lightweight projected 3D signal sphere.
 *
 * Pure canvas: no Three.js dependency, no network, no external assets.
 * Renders a rotating threat-signal graph with depth-scaled nodes and links.
 * Pauses to a static frame when reduced motion is requested.
 */

const NODE_COUNT = 44;

function buildGraph() {
  const nodes = [];
  for (let i = 0; i < NODE_COUNT; i += 1) {
    const y = 1 - (i / (NODE_COUNT - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * 2.399963229728653; // golden angle
    nodes.push({
      x: Math.cos(theta) * radius,
      y,
      z: Math.sin(theta) * radius,
      tone: i % 9 === 0 ? 'violet' : i % 13 === 0 ? 'danger' : 'cyan'
    });
  }

  const edges = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dz = nodes[i].z - nodes[j].z;
      if (dx * dx + dy * dy + dz * dz < 0.11) edges.push([i, j]);
    }
  }

  return { nodes, edges };
}

const GRAPH = buildGraph();

export function HeroVisual() {
  const canvasRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let frame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

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
      const time = reducedMotion ? 0.6 : timestamp * 0.00016;
      const cos = Math.cos(time);
      const sin = Math.sin(time);
      const tilt = -0.34;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const R = Math.min(width, height) * 0.33;

      // Ambient glow
      const glow = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.55);
      glow.addColorStop(0, 'rgba(34, 211, 238, 0.11)');
      glow.addColorStop(0.55, 'rgba(59, 130, 246, 0.045)');
      glow.addColorStop(1, 'rgba(5, 7, 13, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      const project = (point) => {
        const x = point.x * cos - point.z * sin;
        const z = point.x * sin + point.z * cos;
        const y = point.y * cosT - z * sinT;
        const zz = point.y * sinT + z * cosT;
        const scale = 1 / (1.95 - zz * 0.5);
        return {
          x: cx + x * R * scale,
          y: cy + y * R * scale,
          z: zz,
          scale
        };
      };

      // Wireframe latitude rings
      for (let ring = 1; ring <= 3; ring += 1) {
        const ratio = ring / 4;
        const ringR = Math.sqrt(1 - ratio * ratio);
        ctx.beginPath();
        ctx.ellipse(cx, cy + ratio * R * 0.98, R * ringR * 1.02, R * ringR * 0.28, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.09)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(cx, cy - ratio * R * 0.98, R * ringR * 1.02, R * ringR * 0.28, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
        ctx.stroke();
      }

      // Outer orbit
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 1.18, R * 0.4, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.13)';
      ctx.lineWidth = 1;
      ctx.stroke();

      const projected = GRAPH.nodes.map(project);

      // Links
      for (const [i, j] of GRAPH.edges) {
        const a = projected[i];
        const b = projected[j];
        const depth = (a.z + b.z) / 2;
        if (depth < -0.35) continue;
        const alpha = 0.035 + ((depth + 1) / 2) * 0.14;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Nodes
      for (let i = 0; i < GRAPH.nodes.length; i += 1) {
        const point = projected[i];
        const depth = (point.z + 1) / 2;
        const alpha = 0.2 + depth * 0.8;
        const tone = GRAPH.nodes[i].tone;
        const color =
          tone === 'violet'
            ? `rgba(139, 92, 246, ${alpha.toFixed(3)})`
            : tone === 'danger'
              ? `rgba(244, 63, 94, ${alpha.toFixed(3)})`
              : `rgba(34, 211, 238, ${alpha.toFixed(3)})`;

        if (tone !== 'cyan' && depth > 0.55) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 7 + depth * 3, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.globalAlpha = 0.22;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        ctx.beginPath();
        ctx.arc(point.x, point.y, 1.2 + depth * 1.7, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }

      // Radar sweep
      const sweep = reducedMotion ? 2.1 : (timestamp * 0.00045) % (Math.PI * 2);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.18, sweep, sweep + 0.75);
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Center reticle
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(226, 232, 240, 0.7)';
      ctx.fill();

      if (!reducedMotion) frame = requestAnimationFrame(draw);
    };

    if (reducedMotion) draw(0);
    else frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [reducedMotion]);

  return (
    <div className="relative h-[300px] w-full overflow-hidden rounded-2xl border border-line bg-ink/40 sm:h-[360px] lg:h-[430px]">
      <div className="pointer-events-none absolute inset-0 grid-overlay opacity-70" aria-hidden="true" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Signal graph</p>
            <p className="mt-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse-soft" />
              Live projection
            </p>
          </div>
          <span className="chip">6 pattern classes</span>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Threat surface</p>
            <p className="mt-1 text-xs text-slate-400">Evidence-linked, not guesswork</p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Runs locally</p>
            <p className="mt-1 text-xs text-slate-400">0 external calls required</p>
          </div>
        </div>
      </div>

      {/* corner ticks */}
      <span className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l border-t border-cyan/40" aria-hidden="true" />
      <span className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r border-t border-cyan/40" aria-hidden="true" />
      <span className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-cyan/40" aria-hidden="true" />
      <span className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b border-r border-cyan/40" aria-hidden="true" />
    </div>
  );
}
