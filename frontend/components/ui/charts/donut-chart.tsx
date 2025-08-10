import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface DonutChartProps {
  data: any[];
  dataKey: string;
  nameKey: string;
  title?: string;
  description?: string;
  colors?: string[];
}

const DEFAULT_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28DFF", "#FF6B6B"];

export function DonutChart({
  data,
  dataKey,
  nameKey,
  title,
  description,
  colors = DEFAULT_COLORS,
}: DonutChartProps) {
  return (
    <div className="h-[300px] w-full">
      {title && <h3 className="text-lg font-semibold text-center mb-2">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground text-center mb-4">{description}</p>}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey={dataKey}
            nameKey={nameKey}
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}