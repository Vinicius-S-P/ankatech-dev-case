import React from "react";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface BarChartProps {
  data: any[];
  xAxisKey: string;
  barKey: string;
  title?: string;
  description?: string;
}

export function BarChart({
  data,
  xAxisKey,
  barKey,
  title,
  description,
}: BarChartProps) {
  return (
    <div className="h-[300px] w-full">
      {title && <h3 className="text-lg font-semibold text-center mb-2">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground text-center mb-4">{description}</p>}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey={barKey} fill="#8884d8" />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}