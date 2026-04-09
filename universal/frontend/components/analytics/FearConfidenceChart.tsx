'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChartProps {
    data: any[];
}

export function FearConfidenceChart({ data }: ChartProps) {
    return (
        <div className="h-[300px] w-full bg-gray-800 p-4 rounded-xl border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Emotional Journey: Fear vs. Confidence</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="day" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                        itemStyle={{ color: '#E5E7EB' }}
                    />
                    <Legend />
                    {/* Fear Line - Red decaying */}
                    <Line
                        type="monotone"
                        dataKey="fearIndex"
                        stroke="#EF4444"
                        strokeWidth={3}
                        name="Fear Assessment"
                        dot={{ r: 4 }}
                    />
                    {/* Confidence Line - Green growing */}
                    <Line
                        type="monotone"
                        dataKey="confidence"
                        stroke="#10B981"
                        strokeWidth={3}
                        name="Confidence Level"
                        dot={{ r: 4 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
