import { useRef, useState, useCallback } from "react";
import type { AnalyzedMove } from "../../storage/models";
import { graphValue } from "../../analysis/evalNormalization";

const CLASSIFICATION_COLORS: Record<string, string> = {
  Blunder: "#e74c3c",
  Mistake: "#e67e22",
  Inaccuracy: "#f1c40f",
  "Missed Win": "#e74c3c",
  Good: "#3498db",
  Excellent: "#2ecc71",
  Best: "#27ae60",
  "Great Move": "#9b59b6",
  "Brilliant Candidate": "#1abc9c",
  Book: "#95a5a6",
  Forced: "#95a5a6",
};

const NOTABLE = new Set(["Blunder", "Mistake", "Inaccuracy", "Missed Win", "Great Move", "Brilliant Candidate"]);

type Point = { move: AnalyzedMove; x: number; y: number };

/**
 * Build a step-style path like chess.com:
 * Each move occupies a horizontal segment, then a vertical step to the next value.
 * This produces the characteristic "skyline" look.
 */
function buildStepPath(points: Point[], w: number): string {
  if (points.length === 0) return "";
  const parts: string[] = [`M${points[0].x},${points[0].y}`];
  for (let i = 1; i < points.length; i++) {
    // Horizontal to the x of the next point, then vertical to its y
    parts.push(`L${points[i].x},${points[i - 1].y}`);
    parts.push(`L${points[i].x},${points[i].y}`);
  }
  // Extend the last point to the right edge
  parts.push(`L${w},${points[points.length - 1].y}`);
  return parts.join(" ");
}

export function EvalGraph({
  moves,
  selectedPly,
  onSelect,
}: {
  moves: AnalyzedMove[];
  selectedPly: number;
  onSelect: (ply: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const W = 1000;
  const H = 200;
  const AXIS = H / 2; // center line

  const points: Point[] = moves.flatMap((move, index) => {
    if (!move.evalAfter) return [];
    const gv = graphValue(move.evalAfter);
    // gv is in [-10, 10]. Map to pixel y: positive = white advantage = above axis
    // Use a compressed sigmoid-like mapping so small advantages show clearly
    // but extreme evals don't blow out the graph
    const normalized = Math.tanh(gv * 0.35) * 0.95; // range ~ [-0.95, 0.95]
    const y = AXIS - normalized * AXIS;
    const x = moves.length === 1 ? W / 2 : (index / (moves.length - 1)) * W;
    return [{ move, x, y: Math.max(1, Math.min(H - 1, y)) }];
  });

  const stepPath = buildStepPath(points, W);

  // White fill: step path closed to the axis, clipped to top half
  const whiteFillPath =
    points.length > 0
      ? `${stepPath} L${W},${AXIS} L${points[0].x},${AXIS} Z`
      : "";

  // Black fill: same path, clipped to bottom half
  const blackFillPath = whiteFillPath;

  const findClosest = useCallback(
    (clientX: number): number | null => {
      if (!svgRef.current || !points.length) return null;
      const rect = svgRef.current.getBoundingClientRect();
      const relX = ((clientX - rect.left) / rect.width) * W;
      let closestIdx = 0;
      let minDist = Math.abs(relX - points[0].x);
      for (let i = 1; i < points.length; i++) {
        const d = Math.abs(relX - points[i].x);
        if (d < minDist) { minDist = d; closestIdx = i; }
      }
      return closestIdx;
    },
    [points],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      setHoverIdx(findClosest(e.clientX));
    },
    [findClosest],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const idx = findClosest(e.clientX);
      if (idx !== null && points[idx]) {
        onSelect(points[idx].move.ply);
      }
    },
    [findClosest, points, onSelect],
  );

  const selectedPoint = points.find((p) => p.move.ply === selectedPly);
  const hoveredPoint = hoverIdx !== null ? points[hoverIdx] : null;

  if (!points.length) {
    return (
      <div className="eval-graph-wrap eval-graph-empty">
        <span className="eval-graph-placeholder">Evaluation graph will appear after analysis</span>
      </div>
    );
  }

  return (
    <div className="eval-graph-wrap">
      <svg
        ref={svgRef}
        className="eval-graph-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Evaluation graph; click a point to navigate to that move"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
        onClick={handleClick}
      >
        <defs>
          <clipPath id="whiteClip">
            <rect x="0" y="0" width={W} height={AXIS} />
          </clipPath>
          <clipPath id="blackClip">
            <rect x="0" y={AXIS} width={W} height={AXIS} />
          </clipPath>
        </defs>

        {/* Uniform grey background */}
        <rect x="0" y="0" width={W} height={H} fill="#5a5a5a" />

        {/* White advantage fill — white area above axis */}
        <path d={whiteFillPath} fill="#ffffff" clipPath="url(#whiteClip)" />

        {/* Black advantage fill — black area below axis */}
        <path d={blackFillPath} fill="#262626" clipPath="url(#blackClip)" />

        {/* Center axis line */}
        <line x1="0" y1={AXIS} x2={W} y2={AXIS} stroke="rgba(128,128,128,0.6)" strokeWidth="1" />

        {/* Selected position indicator */}
        {selectedPoint && (
          <line
            x1={selectedPoint.x}
            y1={0}
            x2={selectedPoint.x}
            y2={H}
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="2"
          />
        )}

        {/* Hover cursor line */}
        {hoveredPoint && (
          <line
            x1={hoveredPoint.x}
            y1={0}
            x2={hoveredPoint.x}
            y2={H}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
          />
        )}

        {/* Classification dots for notable moves — small solid dots, no border */}
        {points
          .filter((p) => NOTABLE.has(p.move.classification ?? ""))
          .map((p) => {
            const color = CLASSIFICATION_COLORS[p.move.classification ?? ""] ?? "#aaa";
            const isSelected = p.move.ply === selectedPly;
            return (
              <circle
                key={p.move.ply}
                cx={p.x}
                cy={p.y}
                r={isSelected ? 6 : 4.5}
                fill={color}
                style={{ cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); onSelect(p.move.ply); }}
              >
                <title>{`${p.move.moveNumber}${p.move.side === "b" ? "..." : "."} ${p.move.san} — ${p.move.classification}`}</title>
              </circle>
            );
          })}

        {/* Hover dot — small solid white dot */}
        {hoveredPoint && (
          <circle
            cx={hoveredPoint.x}
            cy={hoveredPoint.y}
            r="3.5"
            fill="white"
            style={{ pointerEvents: "none" }}
          />
        )}
      </svg>

      {/* Tooltip callout */}
      {hoveredPoint && (
        <div
          className="eval-tooltip"
          style={{
            left: `${Math.min(Math.max((hoveredPoint.x / W) * 100, 8), 92)}%`,
            top: hoveredPoint.y < AXIS ? "auto" : "4px",
            bottom: hoveredPoint.y < AXIS ? "4px" : "auto",
          }}
        >
          <span className="eval-tooltip-move">
            {hoveredPoint.move.moveNumber}{hoveredPoint.move.side === "b" ? "..." : "."} {hoveredPoint.move.san}
          </span>
          {hoveredPoint.move.classification && (
            <span
              className="eval-tooltip-class"
              style={{ color: CLASSIFICATION_COLORS[hoveredPoint.move.classification] ?? "inherit" }}
            >
              {hoveredPoint.move.classification}
            </span>
          )}
          {hoveredPoint.move.accuracy !== undefined && (
            <span className="eval-tooltip-acc">{hoveredPoint.move.accuracy.toFixed(0)}%</span>
          )}
        </div>
      )}
    </div>
  );
}
