'use client';

/**
 * Analytics Charts Component
 * 
 * Separated to enable dynamic import and reduce initial bundle size.
 * Recharts adds ~500KB to bundle - only load when needed.
 */

import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart as RePieChart, Pie, Cell
} from 'recharts';

interface EntityDistributionChartProps {
    data: { name: string; value: number }[];
    colors: string[];
}

interface StatusChartProps {
    data: { name: string; value: number }[];
}

export function EntityDistributionChart({ data, colors }: EntityDistributionChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) => 
                        `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                >
                    {data.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                />
                <Legend />
            </RePieChart>
        </ResponsiveContainer>
    );
}

export function StatusBarChart({ data }: StatusChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                    cursor={{ fill: '#334155', opacity: 0.2 }}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
