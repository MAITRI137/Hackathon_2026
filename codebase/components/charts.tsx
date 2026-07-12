"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const chartPalette = [
  "#5D7052",
  "#C18C5D",
  "#A85448",
  "#78786C",
  "#DED8CF",
];

const tooltipStyle = {
  borderRadius: 16,
  border: "1px solid #DED8CF",
  background: "#FEFEFA",
  fontSize: 12,
  color: "#2C2C24",
};

export function TrendLine({
  data,
  suffix = "",
}: {
  data: { label: string; value: number }[];
  suffix?: string;
}) {
  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="4 6"
            stroke="currentColor"
            opacity={0.12}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v: number) => [`${v}${suffix}`, ""]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#5D7052"
            strokeWidth={3}
            dot={{ r: 4, fill: "#5D7052" }}
            animationDuration={700}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CountBars({
  data,
  color = "#5D7052",
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  return (
    <div style={{ width: "100%", height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 12, left: -22, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="4 6"
            stroke="currentColor"
            opacity={0.12}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#5D705218" }} />
          <Bar
            dataKey="value"
            fill={color}
            radius={[4, 4, 0, 0]}
            animationDuration={700}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Donut({
  data,
  centerLabel,
  centerValue,
}: {
  data: { name: string; value: number }[];
  centerLabel?: string;
  centerValue?: string;
}) {
  const filled = data.filter((d) => d.value > 0);
  return (
    <div className="relative">
      <div style={{ width: "100%", height: 210 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip contentStyle={tooltipStyle} />
            <Pie
              data={filled}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={3}
              strokeWidth={0}
              animationDuration={700}
            >
              {filled.map((_, i) => (
                <Cell key={i} fill={chartPalette[i % chartPalette.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      {centerValue && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-heading text-3xl font-semibold tabular-nums">
              {centerValue}
            </p>
            {centerLabel && (
              <p className="text-xs text-muted-foreground">{centerLabel}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function HalfDonut({
  data,
  centerValue,
  centerLabel,
}: {
  data: { name: string; value: number; color?: string }[];
  centerValue?: string;
  centerLabel?: string;
}) {
  const filled = data.filter((d) => d.value > 0);
  return (
    <div className="relative">
      <div style={{ width: "100%", height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip contentStyle={tooltipStyle} />
            <Pie
              data={filled}
              dataKey="value"
              nameKey="name"
              startAngle={180}
              endAngle={0}
              cy={100}
              innerRadius={62}
              outerRadius={88}
              paddingAngle={3}
              strokeWidth={0}
              animationDuration={700}
            >
              {filled.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.color || chartPalette[i % chartPalette.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      {centerValue && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 pb-2 text-center">
          <p className="font-heading text-3xl font-semibold tabular-nums text-primary">
            {centerValue}
          </p>
          {centerLabel && (
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {centerLabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function DonutLegend({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <ul className="grid gap-2 text-sm">
      {data.map((d, i) => (
        <li key={d.name} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: chartPalette[i % chartPalette.length] }}
            />
            {d.name}
          </span>
          <strong className="tabular-nums">{d.value}</strong>
        </li>
      ))}
    </ul>
  );
}
