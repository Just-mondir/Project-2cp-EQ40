"use client";

import React from "react";

type StatCardsProps = {
  members: number;
  groups: number;
  visitors: number;
  posts: number;
  loading?: boolean;
};

function formatValue(value: number) {
  if (!Number.isFinite(value)) return "0";
  if (value >= 1000) {
    const compact = value / 1000;
    return `${Number.isInteger(compact) ? compact.toFixed(0) : compact.toFixed(1)}k`;
  }
  return String(value);
}

export default function StatCards({ members, groups, visitors, posts, loading = false }: StatCardsProps) {
  const cards = [
    { label: "Members", value: members, color: "#8b5e3c" },
    { label: "Groups", value: groups, color: "#c8a87a" },
    { label: "Visitors", value: visitors, color: "#d4a35a" },
    { label: "Posts", value: posts, color: "#5a8a6a" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-[28px] border px-5 py-6 shadow-sm"
          style={{
            backgroundColor: "#3d2e1e",
            borderColor: "rgba(200, 168, 122, 0.2)",
          }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.24em]" style={{ color: "#c8a87a" }}>
            {card.label}
          </p>
          <p className="mt-4 text-3xl font-black" style={{ color: "#f5ede0" }}>
            {loading ? "..." : formatValue(card.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
