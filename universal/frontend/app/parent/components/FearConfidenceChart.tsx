"use client";

import React from 'react';
import { WeeklyStat } from '@/lib/types/analytics';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

interface Props {
  data: WeeklyStat[];
}

export default function FearConfidenceChart({ data }: Props) {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis domain={[0, 10]} />
          <Tooltip formatter={(value: any) => String(value)} />
          <Legend />
          <Line type="monotone" dataKey="fearIndex" stroke="#e55353" strokeWidth={2} name="Fear Index" />
          <Line type="monotone" dataKey="confidence" stroke="#3aa76d" strokeWidth={2} name="Confidence" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
