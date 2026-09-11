"use client";
import React from "react";
import { BoardAction } from "../../lib/learning/page-lesson-runtime";
const palette = {
  white: "#f8fafc",
  yellow: "#fde68a",
  green: "#6ee7b7",
  blue: "#93c5fd",
};
export function GuruScene({
  scene,
  progress = 1,
}: {
  scene: NonNullable<BoardAction["scene"]>;
  progress?: number;
}) {
  return (
    <svg
      viewBox="0 0 1000 1000"
      role="img"
      aria-label="Guru explanation diagram"
      className="w-full max-h-[480px]"
    >
      {scene.map((s, i) => {
        const portion = Math.max(0, Math.min(1, progress * scene.length - i));
        if (!portion) return null;
        const color = palette[s.color];
        const stroke = {
          stroke: color,
          strokeWidth: 4,
          fill: "none",
          pathLength: 1,
          strokeDasharray: 1,
          strokeDashoffset: 1 - portion,
        };
        if (s.type === "line")
          return (
            <line
              key={s.id}
              x1={s.x}
              y1={s.y}
              x2={s.x2}
              y2={s.y2}
              {...stroke}
            />
          );
        if (s.type === "rect")
          return (
            <rect
              key={s.id}
              x={s.x}
              y={s.y}
              width={s.width}
              height={s.height}
              rx={8}
              {...stroke}
            />
          );
        if (s.type === "circle")
          return (
            <circle key={s.id} cx={s.x} cy={s.y} r={s.radius} {...stroke} />
          );
        return (
          <text key={s.id} x={s.x} y={s.y} fill={color} fontSize={26}>
            {s.text?.slice(0, Math.ceil(s.text.length * portion))}
          </text>
        );
      })}
    </svg>
  );
}
