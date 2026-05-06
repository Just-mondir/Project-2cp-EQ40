"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type AnalyticsChartProps = {
  labels: string[];
  members: number[];
  groups: number[];
  visitors: number[];
  posts: number[];
  loading: boolean;
  range: "7d" | "30d" | "90d";
  onRangeChange: (range: "7d" | "30d" | "90d") => void;
};

const rangeOptions: Array<{ label: string; value: "7d" | "30d" | "90d" }> = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
];

export default function AnalyticsChart({ labels, members, groups, visitors, posts, loading, range, onRangeChange }: AnalyticsChartProps) {
  const data = {
    labels,
    datasets: [
      {
        label: "Members",
        data: members,
        borderColor: "#8b5e3c",
        backgroundColor: "#8b5e3c",
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 2,
        fill: false,
      },
      {
        label: "Groups",
        data: groups,
        borderColor: "#c8a87a",
        backgroundColor: "#c8a87a",
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 2,
        borderDash: [6, 4],
        fill: false,
      },
      {
        label: "Visitors",
        data: visitors,
        borderColor: "#d4a35a",
        backgroundColor: "#d4a35a",
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 2,
        fill: false,
      },
      {
        label: "Posts",
        data: posts,
        borderColor: "#5a8a6a",
        backgroundColor: "#5a8a6a",
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 2,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "#3d2e1e",
          boxWidth: 12,
          boxHeight: 12,
          padding: 16,
        },
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#3d2e1e",
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
        grid: {
          display: false,
        },
      },
      y: {
        ticks: {
          color: "#3d2e1e",
          beginAtZero: true,
        },
        grid: {
          color: "rgba(61, 46, 30, 0.1)",
        },
      },
    },
  };

  return (
    <div className="rounded-[28px] border border-[#c8a87a33] bg-[#fff7e4] p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: "#3d2e1e" }}>
            Platform analytics
          </h2>
          <p className="text-sm" style={{ color: "#7f674f" }}>
            Recent platform snapshot history over the selected range.
          </p>
        </div>
        <div className="flex gap-2 rounded-full bg-[#3d2e1e] p-1">
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onRangeChange(option.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${range === option.value ? "bg-[#c8a87a] text-[#3d2e1e]" : "text-[#f5ede0] hover:bg-[#2f2318]/60"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[320px] min-h-[320px]">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-[#8b6a46]">
            Loading analytics...
          </div>
        ) : labels.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-[#8b6a46]">
            No analytics data available for the selected range.
          </div>
        ) : (
          <Line data={data} options={options} />
        )}
      </div>
    </div>
  );
}
