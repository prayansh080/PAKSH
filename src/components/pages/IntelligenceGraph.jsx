import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronRight,
  Crosshair,
  GitBranch,
  Layers,
  Maximize2,
  Minus,
  Network,
  Plus,
  RotateCcw,
  ScanSearch,
  Search,
  ShieldAlert,
  Target,
  X
} from 'lucide-react';

import { PageLayout } from '../PageLayout';
import { getActiveStages, getSignalMeta } from '../../lib/signals';

/**
 * Intelligence Graph — the evidence chain of a real investigation.
 *
 * Nodes and edges are derived only from the report the scanner stored
 * (input → signals → scam-pattern stages → verdict → actions). Every edge has
 * a stated reason; nothing is invented, and with no report the page shows an
 * empty state rather than sample data.
 *
 * Views reorganise the same evidence:
 *   Evidence — the full chain
 *   Risk     — high and suspicious signals only
 *   Pattern  — evidence grouped by detected scam-pattern stage
 *   Action   — evidence connected to the recommended safety actions
 */

const REPORT_KEY = 'paksh-last-report';

const ACCENT_VAR = {
  cyan: '--a-cyan',
  electric: '--a-electric',
  violet: '--a-violet',
  danger: '--a-danger',
  safe: '--a-safe',
  amber: '--a-amber'
};

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low'];
const SEVERITY_ACCENT = {
  critical: 'danger',
  high: 'amber',
  medium: 'violet',
  low: 'safe'
};
const SEVERITY_LABEL = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low'
};

const VIEWS = {
  evidence: {
    id: 'evidence',
    label: 'Evidence',
    layers: ['input', 'signal', 'pattern', 'verdict', 'action'],
    hint: 'Full investigation chain from your input to the recommended action.'
  },
  risk: {
    id: 'risk',
    label: 'Risk',
    layers: ['input', 'signal', 'verdict', 'action'],
    hint: 'Only signals at medium severity or above, plus the verdict they produce.'
  },
  pattern: {
    id: 'pattern',
    label: 'Pattern',
    layers: ['input', 'pattern', 'verdict', 'action'],
    hint: 'Evidence grouped by the scam-pattern stage it supports.'
  },
  action: {
    id: 'action',
    label: 'Action',
    layers: ['input', 'signal', 'action'],
    hint: 'Which evidence produces which safety action.'
  }
};

const VIEW_ORDER = ['evidence', 'risk', 'pattern', 'action'];

const COL_W = 214;
const ROW_GAP = 66;
const MAX_ROWS = 6;
const PAD_X = 86;
const PAD_Y = 74;

function verdictAccent(verdict) {
  if (verdict === 'HIGH RISK') return 'danger';
  if (verdict === 'SUSPICIOUS') return 'amber';
  return 'safe';
}

function accentVar(accent) {
  return ACCENT_VAR[accent] || ACCENT_VAR.cyan;
}

function truncate(text, max) {
  const value = String(text || '');
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/* -------------------------------------------------------------------------- */
/* Graph model — built strictly from the stored report                         */
/* -------------------------------------------------------------------------- */

function buildGraph(report) {
  const signals = Array.isArray(report.signals) ? report.signals.filter(Boolean) : [];
  const stages = getActiveStages(signals);
  const message = report.originalMessage || '';
  const nodes = [];

  const signalNodes = signals.map((signal) => {
    const meta = getSignalMeta(signal.id);
    const weight = Number(signal.weight ?? meta.weight ?? 0);
    const stage = stages.find((candidate) => candidate.signalIds.includes(signal.id));
    const accent = SEVERITY_ACCENT[meta.severity] || 'violet';
    return {
      id: `signal:${signal.id}`,
      signalId: signal.id,
      kind: 'signal',
      label: meta.short,
      title: meta.label,
      accent,
      severity: meta.severity,
      weight,
      stageId: stage ? stage.id : null,
      detail: {
        category: 'Risk signal',
        subtitle: `${meta.label} · rule weight +${weight}`,
        rows: [
          ['Weight', `+${weight}`],
          ['Severity', SEVERITY_LABEL[meta.severity] || meta.severity],
          ['Pattern stage', stage ? stage.label : 'No stage matched'],
          ['Score source', report.source || 'rules']
        ],
        evidence: signal.evidence || 'The rule matched the message as a whole.',
        why: meta.why,
        action: meta.action
      }
    };
  });

  const stageNodes = stages.map((stage) => {
    const supporting = signals.filter((signal) => stage.signalIds.includes(signal.id));
    return {
      id: `stage:${stage.id}`,
      stageId: stage.id,
      kind: 'pattern',
      label: stage.label,
      title: stage.label,
      accent: stage.accent,
      severity: null,
      weight: supporting.reduce(
        (total, signal) => total + Number(signal.weight ?? getSignalMeta(signal.id).weight ?? 0),
        0
      ),
      detail: {
        category: 'Scam pattern stage',
        subtitle: `${supporting.length} supporting signal${supporting.length === 1 ? '' : 's'}`,
        rows: [
          ['Stage', stage.label],
          ['Supporting signals', String(supporting.length)],
          ['Combined weight', `+${supporting.reduce(
            (total, signal) => total + Number(signal.weight ?? getSignalMeta(signal.id).weight ?? 0),
            0
          )}`]
        ],
        evidence: stage.description,
        why: 'This stage describes a step in the deception pattern the message appears to follow.',
        action: null
      }
    };
  });

  const actionNodes = [];
  signals.forEach((signal) => {
    const meta = getSignalMeta(signal.id);
    if (!meta.action) return;
    const accent = SEVERITY_ACCENT[meta.severity] || 'violet';
    actionNodes.push({
      id: `action:${signal.id}`,
      signalId: signal.id,
      kind: 'action',
      label: meta.short,
      title: 'Recommended action',
      accent,
      severity: null,
      weight: 0,
      detail: {
        category: 'Safety action',
        subtitle: `Recommended because of: ${meta.label}`,
        rows: [['Triggered by', meta.label]],
        evidence: meta.action,
        why: 'This action addresses the specific risk the signal represents.',
        action: null
      }
    });
  });

  if (actionNodes.length === 0) {
    actionNodes.push({
      id: 'action:verify',
      signalId: 'verify',
      kind: 'action',
      label: 'Verify independently',
      title: 'Recommended action',
      accent: 'safe',
      severity: null,
      weight: 0,
      detail: {
        category: 'Safety action',
        subtitle: 'Default guidance when no rule-specific action applies',
        rows: [['Triggered by', 'No specific rule action']],
        evidence:
          'Verify the sender through an official channel before sharing details or paying.',
        why: 'Absence of detected signals is not proof of safety.',
        action: null
      }
    });
  }

  nodes.push(
    {
      id: 'input',
      kind: 'input',
      label: 'Your input',
      title: 'Your input',
      accent: 'cyan',
      severity: null,
      weight: 0,
      detail: {
        category: 'Input',
        subtitle: `${message.length} characters analysed locally`,
        rows: [
          ['Characters', String(message.length)],
          ['Analysed', new Date(report.analyzedAt || Date.now()).toLocaleString()],
          ['Verdict', report.verdict],
          ['Score', `${report.riskScore}/100`]
        ],
        evidence: message || 'No message text was stored with this report.',
        why: 'Every signal below was matched against this exact text.',
        action: null
      }
    },
    ...signalNodes,
    ...stageNodes,
    {
      id: 'verdict',
      kind: 'verdict',
      label: report.verdict,
      title: report.verdict,
      accent: verdictAccent(report.verdict),
      severity: null,
      weight: Number(report.riskScore) || 0,
      detail: {
        category: 'Verdict',
        subtitle: `Risk indicator ${report.riskScore}/100`,
        rows: [
          ['Score', `${report.riskScore}/100`],
          ['Rule confidence', `${report.confidence}%`],
          ['Score source', report.source || 'rules'],
          ['AI adjusted score', report.aiAdjusted ? 'yes' : 'no']
        ],
        evidence: report.riskLabel || 'Risk indicator score — not a probability of fraud.',
        why: 'The score is the sum of deterministic rule weights. AI context never changes it.',
        action: null
      }
    },
    ...actionNodes
  );

  return { nodes, signals, stages, actions: actionNodes };
}

/* -------------------------------------------------------------------------- */
/* View projection + filtering                                                 */
/* -------------------------------------------------------------------------- */

function projectNodes(graph, view, { severities, kindFilter, topOnly }) {
  const layerKeys = VIEWS[view].layers;

  return graph.nodes.filter((node) => {
    if (!layerKeys.includes(node.kind)) return false;

    if (node.kind === 'signal') {
      if (!severities.has(node.severity)) return false;
      if (topOnly && (node.severity === 'medium' || node.severity === 'low')) return false;
      if (kindFilter === 'pattern' || kindFilter === 'action') return false;
    }

    if (node.kind === 'pattern' && kindFilter !== 'all' && kindFilter !== 'pattern') return false;
    if (node.kind === 'action' && kindFilter !== 'all' && kindFilter !== 'action') return false;

    return true;
  });
}

function buildLinks(view, nodes, graph) {
  const present = new Set(nodes.map((node) => node.id));
  const has = (id) => present.has(id);
  const links = [];
  const add = (from, to, accent, reason) => {
    if (!has(from) || !has(to)) return;
    if (links.some((link) => link.from === from && link.to === to)) return;
    links.push({ from, to, accent, reason });
  };

  const signalNodes = nodes.filter((node) => node.kind === 'signal');
  const stageNodes = nodes.filter((node) => node.kind === 'pattern');
  const actionNodes = nodes.filter((node) => node.kind === 'action');
  const verdictNode = nodes.find((node) => node.kind === 'verdict');
  const verdictTone = verdictNode ? verdictNode.accent : 'safe';

  if (view === 'pattern') {
    stageNodes.forEach((stage) =>
      add('input', stage.id, stage.accent, 'Signals in your input activate this pattern stage')
    );
    stageNodes.forEach((stage) =>
      add(stage.id, 'verdict', verdictTone, 'This stage contributes to the verdict')
    );
    if (stageNodes.length === 0) {
      add('input', 'verdict', verdictTone, 'No pattern stage was triggered by this input');
    }
    actionNodes.forEach((action) =>
      add('verdict', action.id, action.accent, 'The verdict leads to this action')
    );
    return links;
  }

  if (view === 'action') {
    signalNodes.forEach((signal) => add('input', signal.id, signal.accent, 'This rule matched your text'));
    signalNodes.forEach((signal) => {
      actionNodes
        .filter((action) => action.signalId === signal.signalId)
        .forEach((action) => add(signal.id, action.id, signal.accent, 'This signal recommends the action'));
    });
    if (signalNodes.length === 0) {
      actionNodes.forEach((action) =>
        add('input', action.id, action.accent, 'Default guidance when no signal fired')
      );
    }
    return links;
  }

  signalNodes.forEach((signal) => add('input', signal.id, signal.accent, 'This rule matched your text'));

  if (view === 'risk') {
    signalNodes.forEach((signal) =>
      add(signal.id, 'verdict', verdictTone, `Weight +${signal.weight} counts toward the score`)
    );
    if (signalNodes.length === 0) {
      add('input', 'verdict', verdictTone, 'No signal met the focus threshold');
    }
  } else {
    stageNodes.forEach((stage) => {
      const supporting = signalNodes.filter((signal) => signal.stageId === stage.stageId);
      if (supporting.length === 0) {
        add('input', stage.id, stage.accent, 'Stage active from your input');
      } else {
        supporting.forEach((signal) =>
          add(signal.id, stage.id, stage.accent, 'This signal supports the stage')
        );
      }
    });
    stageNodes.forEach((stage) =>
      add(stage.id, 'verdict', verdictTone, 'This stage contributes to the verdict')
    );
    const stageIds = new Set(stageNodes.map((stage) => stage.stageId));
    signalNodes
      .filter((signal) => !signal.stageId || !stageIds.has(signal.stageId))
      .forEach((signal) =>
        add(signal.id, 'verdict', verdictTone, `Weight +${signal.weight} counts toward the score`)
      );
    if (stageNodes.length === 0 && signalNodes.length === 0) {
      add('input', 'verdict', verdictTone, 'No rule signal fired for this input');
    }
  }

  actionNodes.forEach((action) =>
    add('verdict', action.id, action.accent, 'The verdict leads to this action')
  );

  return links;
}

/** Layered layout: one column per stage, sub-columns when a stage is crowded. */
function layoutNodes(nodes, layerKeys, density) {
  const compact = density === 'compact';
  const radius = compact ? 15 : 20;
  const verdictRadius = compact ? 23 : 28;

  const groups = layerKeys.map((kind) => nodes.filter((node) => node.kind === kind));
  const tallest = Math.max(1, ...groups.map((group) => Math.min(group.length, MAX_ROWS)));
  const height = Math.max(340, tallest * ROW_GAP + PAD_Y * 2);
  const width = PAD_X * 2 + (layerKeys.length - 1) * COL_W + 80;

  const positioned = [];

  groups.forEach((group, layerIndex) => {
    const count = group.length;
    const subColumns = Math.max(1, Math.ceil(count / MAX_ROWS));
    group.forEach((node, index) => {
      const sub = Math.floor(index / MAX_ROWS);
      const row = index % MAX_ROWS;
      const rowsInSub = Math.min(MAX_ROWS, count - sub * MAX_ROWS);
      const x = PAD_X + layerIndex * COL_W + sub * (subColumns > 1 ? 58 : 0);
      const y = height / 2 + (row - (rowsInSub - 1) / 2) * ROW_GAP;
      positioned.push({
        ...node,
        x,
        y,
        radius: node.kind === 'verdict' ? verdictRadius : radius
      });
    });
  });

  return { nodes: positioned, width, height, layerKeys };
}

function edgePath(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy) || 1;
  const ux = dx / distance;
  const uy = dy / distance;
  const startX = from.x + ux * (from.radius + 5);
  const startY = from.y + uy * (from.radius + 5);
  const endX = to.x - ux * (to.radius + 7);
  const endY = to.y - uy * (to.radius + 7);
  const midX = (startX + endX) / 2;
  return `M${startX},${startY} C${midX},${startY} ${midX},${endY} ${endX},${endY}`;
}

/** Shortest path between two nodes, following edges in either direction. */
function findPath(links, start, goal) {
  if (!start || !goal) return [];
  if (start === goal) return [start];
  const adjacency = new Map();
  links.forEach((link) => {
    if (!adjacency.has(link.from)) adjacency.set(link.from, []);
    if (!adjacency.has(link.to)) adjacency.set(link.to, []);
    adjacency.get(link.from).push(link.to);
    adjacency.get(link.to).push(link.from);
  });

  const queue = [start];
  const previous = new Map([[start, null]]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === goal) break;
    (adjacency.get(current) || []).forEach((next) => {
      if (!previous.has(next)) {
        previous.set(next, current);
        queue.push(next);
      }
    });
  }

  if (!previous.has(goal)) return [];
  const path = [];
  let cursor = goal;
  while (cursor) {
    path.unshift(cursor);
    cursor = previous.get(cursor);
  }
  return path;
}

/* -------------------------------------------------------------------------- */
/* Canvas                                                                     */
/* -------------------------------------------------------------------------- */

function GraphCanvas({
  nodes,
  links,
  selected,
  hovered,
  onSelect,
  onHover,
  trace,
  zoom,
  pan,
  onPan,
  onZoom,
  width,
  height,
  density,
  query,
  reducedMotion
}) {
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const byId = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const traceSet = useMemo(() => new Set(trace), [trace]);

  const vbWidth = width / zoom;
  const vbHeight = height / zoom;
  const vbX = (width - vbWidth) / 2 - pan.x;
  const vbY = (height - vbHeight) / 2 - pan.y;

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return null;
    const set = new Set();
    nodes.forEach((node) => {
      const haystack = [
        node.label,
        node.title,
        node.detail.evidence,
        node.detail.why,
        node.detail.subtitle,
        ...(node.detail.rows || []).flat()
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (haystack.includes(needle)) set.add(node.id);
    });
    return set;
  }, [nodes, query]);

  const handlePointerDown = (event) => {
    if (event.pointerType !== 'mouse') return;
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y
    };
    setDragging(true);
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current || event.pointerType !== 'mouse') return;
    const rect = svgRef.current?.getBoundingClientRect();
    const scale = rect && rect.width > 0 ? vbWidth / rect.width : 1;
    onPan({
      x: dragRef.current.panX - (event.clientX - dragRef.current.startX) * scale,
      y: dragRef.current.panY - (event.clientY - dragRef.current.startY) * scale
    });
  };

  const endDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  // Native listener so the wheel can be non-passive and zoom without
  // scrolling the page underneath the graph.
  useEffect(() => {
    const element = svgRef.current;
    if (!element) return undefined;
    const handleWheel = (event) => {
      event.preventDefault();
      const factor = event.deltaY > 0 ? 0.88 : 1.14;
      onZoom(zoom * factor);
    };
    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [onZoom, zoom]);

  const labelEvery = density === 'compact';

  return (
    <svg
      ref={svgRef}
      viewBox={`${vbX} ${vbY} ${vbWidth} ${vbHeight}`}
      role="group"
      aria-label="Evidence chain graph. Use Tab to move between nodes and Enter to inspect."
      className={`h-full w-full ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      style={{ touchAction: 'manipulation' }}
    >
      {/* Stage columns */}
      {nodes.length > 0
        ? Array.from(new Set(nodes.map((node) => node.kind))).map((kind) => {
            const inColumn = nodes.filter((node) => node.kind === kind);
            const x = inColumn[0].x;
            return (
              <g key={`column-${kind}`} aria-hidden="true">
                <line
                  x1={x}
                  x2={x}
                  y1={34}
                  y2={height - 26}
                  stroke="var(--graph-edge)"
                  strokeWidth="1"
                  strokeDasharray="2 8"
                  opacity="0.5"
                />
                <text
                  x={x}
                  y={22}
                  textAnchor="middle"
                  fontSize="9"
                  letterSpacing="0.18em"
                  style={{ fill: 'var(--graph-stage-label)' }}
                >
                  {kind.toUpperCase()}
                </text>
              </g>
            );
          })
        : null}

      {/* Edges */}
      {links.map((link, index) => {
        const from = byId.get(link.from);
        const to = byId.get(link.to);
        if (!from || !to) return null;

        const isTrace = traceSet.has(link.from) && traceSet.has(link.to);
        const isSelected = selected === link.from || selected === link.to;
        const isHovered = hovered === link.from || hovered === link.to;
        const dimmed =
          (matches && !matches.has(link.from) && !matches.has(link.to)) ||
          (traceSet.size > 1 && !isTrace);

        const color = isTrace
          ? 'var(--a-cyan)'
          : isSelected || isHovered
            ? `var(${accentVar(link.accent)})`
            : 'var(--graph-edge)';

        return (
          <g key={`${link.from}->${link.to}-${index}`}>
            <title>{link.reason}</title>
            <path
              d={edgePath(from, to)}
              fill="none"
              stroke={color}
              strokeWidth={isTrace || isSelected ? 2 : 1.2}
              strokeLinecap="round"
              opacity={dimmed ? 0.22 : isTrace || isSelected ? 0.95 : 0.6}
              strokeDasharray={isTrace ? '6 7' : isSelected ? '7 9' : undefined}
              className={
                reducedMotion
                  ? undefined
                  : isTrace
                    ? 'trace-path'
                    : isSelected
                      ? 'edge-flow'
                      : undefined
              }
            />
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((node, index) => {
        const active = selected === node.id;
        const isHovered = hovered === node.id;
        const isTrace = traceSet.has(node.id);
        const dimmed = matches ? !matches.has(node.id) : false;
        const color = `var(${accentVar(node.accent)})`;
        const showLabel = !labelEvery || active || isHovered || isTrace || node.kind === 'verdict';

        return (
          <g
            key={node.id}
            role="button"
            tabIndex={0}
            aria-label={`${node.detail.category}: ${node.title}`}
            aria-pressed={active}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(node.id);
            }}
            onMouseEnter={() => onHover(node.id)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(node.id)}
            onBlur={() => onHover(null)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect(node.id);
              }
            }}
            className="cursor-pointer outline-none"
            opacity={dimmed ? 0.28 : 1}
            style={{
              animation: reducedMotion ? 'none' : 'fade-in 380ms ease-out both',
              animationDelay: reducedMotion ? undefined : `${Math.min(index, 18) * 34}ms`
            }}
          >
            <title>{node.title}</title>

            {active ? (
              <circle cx={node.x} cy={node.y} r={node.radius + 11} fill={color} opacity="0.12" />
            ) : null}
            {isTrace && !active ? (
              <circle cx={node.x} cy={node.y} r={node.radius + 7} fill="none" stroke="var(--a-cyan)" strokeWidth="1" opacity="0.5" />
            ) : null}

            <circle
              cx={node.x}
              cy={node.y}
              r={node.radius}
              style={{ fill: 'var(--graph-node-bg)' }}
              stroke={color}
              strokeWidth={active ? 2.6 : isHovered ? 2 : 1.4}
              opacity={active || isHovered ? 1 : 0.92}
            />
            <circle
              cx={node.x}
              cy={node.y}
              r={node.radius * 0.36}
              fill={color}
              opacity={active ? 1 : 0.75}
            />

            {node.kind === 'signal' && density === 'detailed' ? (
              <text
                x={node.x}
                y={node.y + 3.2}
                textAnchor="middle"
                fontSize="8"
                fontWeight="600"
                style={{ fill: 'var(--graph-node-bg)' }}
              >
                {node.weight}
              </text>
            ) : null}

            {showLabel ? (
              <text
                x={node.x}
                y={node.y + node.radius + 15}
                textAnchor="middle"
                fontSize="9.5"
                style={{ fill: active ? 'var(--graph-label-active)' : 'var(--graph-label)' }}
              >
                {truncate(node.label, 24)}
              </text>
            ) : null}

            {active ? (
              <text
                x={node.x}
                y={node.y + node.radius + 27}
                textAnchor="middle"
                fontSize="8"
                letterSpacing="0.1em"
                style={{ fill: 'var(--graph-stage-label)' }}
              >
                {node.detail.category.toUpperCase()}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Inspector                                                                  */
/* -------------------------------------------------------------------------- */

function Inspector({ node, links, nodesById, onSelect, onTrace, traceActive, onClear }) {
  if (!node) {
    return (
      <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 text-center">
        <Target className="h-5 w-5 text-faint" />
        <p className="text-sm text-slate-400">Select a node to inspect its evidence.</p>
        <p className="max-w-[240px] text-[11px] text-faint">
          Every node below was produced by this scan only.
        </p>
      </div>
    );
  }

  const related = links
    .filter((link) => link.from === node.id || link.to === node.id)
    .map((link) => {
      const otherId = link.from === node.id ? link.to : link.from;
      return { node: nodesById.get(otherId), reason: link.reason, direction: link.from === node.id ? 'out' : 'in' };
    })
    .filter((item) => item.node);

  return (
    <div className="space-y-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="eyebrow-cyan">{node.detail.category}</p>
          <h2 className="mt-1 break-words text-base font-semibold text-white">{node.title}</h2>
          {node.detail.subtitle ? (
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{node.detail.subtitle}</p>
          ) : null}
        </div>
        <button type="button" onClick={onClear} className="tool-btn" aria-label="Clear selection">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {node.severity ? (
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em]"
          style={{
            borderColor: `color-mix(in srgb, var(${accentVar(node.accent)}) 40%, transparent)`,
            color: `var(${accentVar(node.accent)})`,
            backgroundColor: `color-mix(in srgb, var(${accentVar(node.accent)}) 10%, transparent)`
          }}
        >
          <ShieldAlert className="h-3 w-3" />
          {SEVERITY_LABEL[node.severity] || node.severity} severity
        </span>
      ) : null}

      {node.detail.rows?.length ? (
        <dl className="grid gap-1.5">
          {node.detail.rows.map(([key, value]) => (
            <div
              key={key}
              className="flex items-start justify-between gap-3 rounded-lg border border-line bg-white/[0.02] px-2.5 py-1.5"
            >
              <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">{key}</dt>
              <dd className="text-right text-[11px] text-slate-300">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {node.detail.evidence ? (
        <div className="rounded-lg border border-line bg-ink/40 p-2.5">
          <p className="label mb-1">{node.kind === 'action' ? 'Do this' : 'Evidence'}</p>
          <p className="whitespace-pre-line break-words text-[11px] leading-relaxed text-slate-300">
            {node.detail.evidence}
          </p>
        </div>
      ) : null}

      {node.detail.why ? (
        <div>
          <p className="label mb-1">Why it matters</p>
          <p className="text-[11px] leading-relaxed text-slate-400">{node.detail.why}</p>
        </div>
      ) : null}

      {node.detail.action ? (
        <div>
          <p className="label mb-1">Recommended action</p>
          <p className="text-[11px] leading-relaxed text-slate-300">{node.detail.action}</p>
        </div>
      ) : null}

      {node.id !== 'verdict' ? (
        <button
          type="button"
          onClick={onTrace}
          className={`btn-ghost w-full text-xs !px-3 !py-2 ${traceActive ? 'border-cyan/40 text-cyan' : ''}`}
          aria-pressed={traceActive}
        >
          <GitBranch className="h-3.5 w-3.5" />
          {traceActive ? 'Tracing to verdict' : 'Trace to verdict'}
        </button>
      ) : null}

      {related.length > 0 ? (
        <div>
          <p className="label mb-1.5">Related evidence</p>
          <ul className="space-y-1">
            {related.map(({ node: relatedNode, reason, direction }) => (
              <li key={`${direction}-${relatedNode.id}`}>
                <button
                  type="button"
                  onClick={() => onSelect(relatedNode.id)}
                  className="group flex w-full items-start gap-2 rounded-lg border border-line bg-white/[0.02] px-2.5 py-1.5 text-left transition-colors hover:border-cyan/35 hover:bg-white/[0.04]"
                >
                  <span
                    className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: `var(${accentVar(relatedNode.accent)})` }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-medium text-slate-200">
                      {direction === 'out' ? '→ ' : '← '}
                      {relatedNode.title}
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-faint">{reason}</span>
                  </span>
                  <ChevronRight className="mt-0.5 ml-auto h-3 w-3 shrink-0 text-faint transition-transform group-hover:translate-x-0.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function IntelligenceGraph() {
  const [payload, setPayload] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const [view, setView] = useState('evidence');
  const [density, setDensity] = useState('detailed');
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [query, setQuery] = useState('');
  const [severities, setSeverities] = useState(() => new Set(SEVERITY_ORDER));
  const [kindFilter, setKindFilter] = useState('all');
  const [topOnly, setTopOnly] = useState(false);
  const [trace, setTrace] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    try {
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch {
      setReducedMotion(false);
    }
  }, []);

  const load = useCallback(() => {
    setError('');
    try {
      const raw = sessionStorage.getItem(REPORT_KEY);
      if (!raw) {
        setPayload(null);
      } else {
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.report) {
          setError('The stored investigation could not be read. Run a new scan to rebuild the graph.');
          setPayload(null);
        } else {
          setPayload(parsed);
        }
      }
    } catch {
      setError('The stored investigation is corrupted or unreadable.');
      setPayload(null);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const report = payload?.report || null;
  const graph = useMemo(() => (report ? buildGraph(report) : null), [report]);

  const visibleNodes = useMemo(() => {
    if (!graph) return [];
    return projectNodes(graph, view, { severities, kindFilter, topOnly });
  }, [graph, view, severities, kindFilter, topOnly]);

  const visibleLinks = useMemo(() => {
    if (!graph) return [];
    return buildLinks(view, visibleNodes, graph);
  }, [graph, view, visibleNodes]);

  const layout = useMemo(
    () => layoutNodes(visibleNodes, VIEWS[view].layers, density),
    [visibleNodes, view, density]
  );

  const nodesById = useMemo(
    () => new Map(layout.nodes.map((node) => [node.id, node])),
    [layout.nodes]
  );

  // Select the input node on first load only, so "Clear selection" stays clear.
  const initialisedRef = useRef(false);
  useEffect(() => {
    if (initialisedRef.current) return;
    if (layout.nodes.length === 0) return;
    initialisedRef.current = true;
    setSelected(layout.nodes[0].id);
  }, [layout.nodes]);

  // Drop a selection that the current view or filters hide.
  useEffect(() => {
    if (selected && !layout.nodes.some((node) => node.id === selected)) {
      setSelected(null);
      setTrace([]);
    }
  }, [layout.nodes, selected]);

  const selectedNode = selected ? nodesById.get(selected) || null : null;

  const resetViewport = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const clampZoom = (value) => Math.min(2.4, Math.max(0.55, value));

  const handleZoom = useCallback((value) => {
    setZoom(clampZoom(value));
  }, []);

  const handleSelect = useCallback((id) => {
    setSelected(id);
    setTrace([]);
  }, []);

  const handleTrace = useCallback(() => {
    if (!selected) return;
    const path = findPath(visibleLinks, selected, 'verdict');
    setTrace(path);
  }, [selected, visibleLinks]);

  const toggleSeverity = (severity) => {
    setSeverities((previous) => {
      const next = new Set(previous);
      if (next.has(severity)) {
        if (next.size === 1) return previous; // never hide everything
        next.delete(severity);
      } else {
        next.add(severity);
      }
      return next;
    });
  };

  const resetFilters = () => {
    setSeverities(new Set(SEVERITY_ORDER));
    setKindFilter('all');
    setTopOnly(false);
    setQuery('');
    setView('evidence');
    setDensity('detailed');
    setTrace([]);
    setSelected('input');
    resetViewport();
  };

  const signalCount = graph ? graph.signals.length : 0;
  const activeFilterCount =
    (severities.size !== SEVERITY_ORDER.length ? 1 : 0) +
    (kindFilter !== 'all' ? 1 : 0) +
    (topOnly ? 1 : 0) +
    (query.trim() ? 1 : 0);

  const traceReason = trace.length > 1
    ? trace
        .map((id) => nodesById.get(id)?.label)
        .filter(Boolean)
        .join(' → ')
    : '';

  return (
    <PageLayout
      title="Intelligence Graph"
      subtitle="The evidence chain of your last investigation: input, detected signals, scam pattern, verdict, and next action."
      breadcrumb="Graph"
    >
      {!loaded ? (
        <div className="panel flex items-center justify-center px-6 py-20">
          <p className="text-sm text-slate-400">Loading graph…</p>
        </div>
      ) : error ? (
        <div className="panel flex flex-col items-center px-6 py-16 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-danger/30 bg-danger/[0.06] text-danger">
            <ShieldAlert className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold text-white">This graph cannot be loaded</h2>
          <p className="mt-2 max-w-md text-sm text-slate-400">{error}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                try {
                  sessionStorage.removeItem(REPORT_KEY);
                } catch {
                  // Storage unavailable — nothing to clear.
                }
                load();
              }}
              className="btn-ghost"
            >
              Clear stored investigation
            </button>
            <Link to="/scanner" className="btn-primary">
              <ScanSearch className="h-4 w-4" />
              Run a new investigation
            </Link>
          </div>
        </div>
      ) : !report ? (
        <div className="panel flex flex-col items-center px-6 py-16 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-line bg-white/[0.02] text-faint">
            <Network className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold text-white">No investigation to visualise yet</h2>
          <p className="mt-2 max-w-md text-sm text-slate-400">
            The graph is built from a real scan. Run an investigation and its evidence chain appears
            here — nothing is pre-filled with sample data.
          </p>
          <Link to="/scanner" className="btn-primary mt-6">
            <ScanSearch className="h-4 w-4" />
            Run an investigation
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Summary */}
          <section className="panel flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${
                  report.verdict === 'HIGH RISK'
                    ? 'border-danger/30 bg-danger/10 text-danger'
                    : report.verdict === 'SUSPICIOUS'
                      ? 'border-amber/30 bg-amber/10 text-amber'
                      : 'border-safe/30 bg-safe/10 text-safe'
                }`}
              >
                {report.verdict}
              </span>
              <span className="chip">Score {report.riskScore}/100</span>
              <span className="chip">{signalCount} signals</span>
              <span className="chip">{graph.stages.length} stages</span>
              <span className="chip">{report.source || 'rules'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={resetFilters} className="btn-ghost text-xs !px-3 !py-2">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset view
              </button>
              <Link to="/report" className="btn-ghost text-xs !px-3 !py-2">
                Full report
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link to="/scanner" className="btn-primary text-xs !px-3 !py-2">
                <ScanSearch className="h-3.5 w-3.5" />
                Back to investigation
              </Link>
            </div>
          </section>

          {/* Controls */}
          <section className="panel space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="seg" role="group" aria-label="Graph view">
                {VIEW_ORDER.map((viewId) => (
                  <button
                    key={viewId}
                    type="button"
                    className="seg-btn"
                    aria-pressed={view === viewId}
                    onClick={() => {
                      setView(viewId);
                      setTrace([]);
                      resetViewport();
                    }}
                  >
                    {VIEWS[viewId].label}
                  </button>
                ))}
              </div>

              <div className="seg" role="group" aria-label="Node density">
                <button
                  type="button"
                  className="seg-btn"
                  aria-pressed={density === 'compact'}
                  onClick={() => setDensity('compact')}
                >
                  Compact
                </button>
                <button
                  type="button"
                  className="seg-btn"
                  aria-pressed={density === 'detailed'}
                  onClick={() => setDensity('detailed')}
                >
                  Detailed
                </button>
              </div>

              <label className="relative ml-auto min-w-[180px] flex-1 sm:max-w-[280px]">
                <span className="sr-only">Search nodes and evidence</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      const needle = query.trim().toLowerCase();
                      if (!needle) return;
                      const hit = layout.nodes.find((node) =>
                        `${node.label} ${node.title} ${node.detail.evidence}`
                          .toLowerCase()
                          .includes(needle)
                      );
                      if (hit) setSelected(hit.id);
                    }
                    if (event.key === 'Escape') setQuery('');
                  }}
                  placeholder="Search nodes and evidence"
                  className="input-field !py-2 !pl-9 !pr-8 text-xs"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-faint hover:text-white"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-1.5">
                <span className="label">Severity</span>
                {SEVERITY_ORDER.map((severity) => {
                  const on = severities.has(severity);
                  return (
                    <button
                      key={severity}
                      type="button"
                      onClick={() => toggleSeverity(severity)}
                      aria-pressed={on}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors ${
                        on
                          ? 'border-line-strong bg-white/[0.05] text-slate-200'
                          : 'border-line bg-transparent text-faint opacity-60'
                      }`}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor: on
                            ? `var(${accentVar(SEVERITY_ACCENT[severity])})`
                            : 'var(--graph-edge-strong)'
                        }}
                      />
                      {SEVERITY_LABEL[severity]}
                    </button>
                  );
                })}
              </div>

              <label className="flex items-center gap-1.5">
                <span className="label">Type</span>
                <select
                  value={kindFilter}
                  onChange={(event) => setKindFilter(event.target.value)}
                  className="select-field"
                  aria-label="Filter by evidence type"
                >
                  <option value="all">All evidence</option>
                  <option value="signal">Signals only</option>
                  <option value="pattern">Pattern stages</option>
                  <option value="action">Actions</option>
                </select>
              </label>

              <button
                type="button"
                onClick={() => setTopOnly((value) => !value)}
                aria-pressed={topOnly}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors ${
                  topOnly
                    ? 'border-cyan/40 bg-cyan/[0.08] text-cyan'
                    : 'border-line bg-white/[0.02] text-faint hover:text-slate-300'
                }`}
              >
                <Layers className="h-3 w-3" />
                {topOnly ? 'Top evidence only' : 'All evidence'}
              </button>

              {activeFilterCount > 0 ? (
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                  {activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'} active
                </span>
              ) : null}
            </div>

            <p className="text-[11px] leading-relaxed text-faint">{VIEWS[view].hint}</p>
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,370px)]">
            {/* Canvas */}
            <section className="panel overflow-hidden">
              <div className="relative">
                <div className="graph-surface h-[380px] w-full overflow-x-auto sm:h-[460px] lg:h-[520px]">
                  <div className="h-full min-w-[680px] sm:min-w-0">
                  {layout.nodes.length > 0 ? (
                    <GraphCanvas
                      nodes={layout.nodes}
                      links={visibleLinks}
                      selected={selected}
                      hovered={hovered}
                      onSelect={handleSelect}
                      onHover={setHovered}
                      trace={trace}
                      zoom={zoom}
                      pan={pan}
                      onPan={setPan}
                      onZoom={handleZoom}
                      width={layout.width}
                      height={layout.height}
                      density={density}
                      query={query}
                      reducedMotion={reducedMotion}
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                      <FilterIcon />
                      <p className="text-sm font-medium text-white">No evidence matches these filters</p>
                      <p className="max-w-xs text-[11px] text-slate-400">
                        Every signal in this scan is hidden by the current severity or type filter.
                      </p>
                      <button type="button" onClick={resetFilters} className="btn-ghost mt-2 text-xs !px-3 !py-2">
                        Reset filters
                      </button>
                    </div>
                  )}
                  </div>
                </div>

                {/* Zoom controls */}
                <div className="absolute right-3 top-3 flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleZoom(zoom * 1.25)}
                    className="tool-btn bg-ink/80 backdrop-blur"
                    aria-label="Zoom in"
                    disabled={zoom >= 2.4}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleZoom(zoom / 1.25)}
                    className="tool-btn bg-ink/80 backdrop-blur"
                    aria-label="Zoom out"
                    disabled={zoom <= 0.55}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={resetViewport}
                    className="tool-btn bg-ink/80 backdrop-blur"
                    aria-label="Fit graph to screen"
                    title="Fit graph to screen"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPan({ x: 0, y: 0 });
                      setZoom(1);
                      setSelected('input');
                    }}
                    className="tool-btn bg-ink/80 backdrop-blur"
                    aria-label="Reset view and selection"
                    title="Reset view"
                  >
                    <Crosshair className="h-3.5 w-3.5" />
                  </button>
                </div>

                <span className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-line bg-ink/80 px-2 py-0.5 font-mono text-[9px] text-faint backdrop-blur">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-[10px] text-faint sm:px-6">
                <span className="flex items-center gap-1.5">
                  <GitBranch className="h-3 w-3" />
                  Tap a node to inspect · drag to pan · scroll to zoom
                </span>
                <span>Built only from this scan · no sample data</span>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line px-4 py-2.5 text-[10px] text-faint sm:px-6">
                {[
                  ['danger', 'High-risk evidence'],
                  ['amber', 'Suspicious evidence'],
                  ['safe', 'Low-risk / action'],
                  ['cyan', 'Input & neutral'],
                  ['violet', 'Context']
                ].map(([accent, label]) => (
                  <span key={accent} className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: `var(${accentVar(accent)})` }}
                    />
                    {label}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-px w-4 border-t border-dashed border-cyan" />
                  Traced path
                </span>
              </div>
            </section>

            {/* Inspector */}
            <aside className="panel p-4 sm:p-5" aria-live="polite">
              <Inspector
                node={selectedNode}
                links={visibleLinks}
                nodesById={nodesById}
                onSelect={handleSelect}
                onTrace={handleTrace}
                traceActive={trace.length > 0}
                onClear={() => {
                  setSelected(null);
                  setTrace([]);
                }}
              />
            </aside>
          </div>

          {traceReason ? (
            <p className="flex flex-wrap items-center gap-1.5 rounded-lg border border-cyan/25 bg-cyan/[0.05] px-3 py-2 text-[11px] leading-relaxed text-slate-300">
              <Target className="h-3.5 w-3.5 shrink-0 text-cyan" />
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-cyan">Path</span>
              {traceReason}
            </p>
          ) : null}

          {/* Accessible trace of the same relationships */}
          <section className="panel p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="eyebrow-cyan">Evidence trace</p>
                <h2 className="mt-0.5 text-sm font-semibold text-white">
                  Input → signal → pattern → verdict → action
                </h2>
              </div>
              <span className="chip">{signalCount} signals traced</span>
            </div>

            {graph.signals.length === 0 ? (
              <p className="mt-3 rounded-lg border border-line bg-white/[0.02] p-3 text-[11px] leading-relaxed text-slate-400">
                No rule signals fired for this input, so the graph goes straight from the message to
                the verdict. Absence of signals is not proof of safety.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {graph.signals.map((signal) => {
                  const meta = getSignalMeta(signal.id);
                  const stage = graph.stages.find((candidate) => candidate.signalIds.includes(signal.id));
                  const isSelected = selected === `signal:${signal.id}`;
                  return (
                    <li key={signal.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(`signal:${signal.id}`)}
                        className={`w-full rounded-lg border p-2.5 text-left transition-colors ${
                          isSelected
                            ? 'border-cyan/40 bg-cyan/[0.06]'
                            : 'border-line bg-white/[0.02] hover:border-line-strong'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-medium text-slate-200">{meta.label}</span>
                          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                            +{signal.weight ?? meta.weight} · {stage ? stage.label : 'no stage'}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                          {signal.evidence}
                        </p>
                        <p className="mt-1 text-[10px] leading-relaxed text-faint">{meta.action}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </PageLayout>
  );
}

function FilterIcon() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/[0.02] text-faint">
      <Layers className="h-4 w-4" />
    </span>
  );
}
