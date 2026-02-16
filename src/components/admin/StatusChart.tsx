"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#0f7a5d", "#ef6820", "#175cd3", "#b42318"];

type Item = {
  status: string;
  total: number;
};

export function StatusChart({ data }: { data: Item[] }) {
  if (!data.length) {
    return <p className="notice">No booking data yet.</p>;
  }

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="status"
            outerRadius={95}
            innerRadius={45}
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell key={entry.status} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
