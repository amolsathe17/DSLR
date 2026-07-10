import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#3b82f6'];

export default function StatsCharts({ dailyStats = [], categoryStats = [] }) {
  
  // Custom tooltips for nice styling
  const CustomComposedTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-xl text-xs">
          <p className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">{label}</p>
          <p className="text-indigo-600 dark:text-indigo-400 font-semibold">
            Revenue: ₹{payload[0].value.toLocaleString()}
          </p>
          <p className="text-amber-500 dark:text-amber-400 font-semibold">
            Registrations: {payload[1].value}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg shadow-xl text-xs">
          <p className="font-bold text-slate-800 dark:text-slate-200">
            {payload[0].name}: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{payload[0].value} photos</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Registrations & Revenue Line/Bar Chart */}
      <div className="lg:col-span-2 glass-panel border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 flex flex-col gap-4">
        <div>
          <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">
            Registration & Revenue Trends
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daily overview of participants signups and transaction volume over the last 7 days
          </p>
        </div>
        
        <div className="w-full h-80">
          {dailyStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={dailyStats}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800/50" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="left" 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v}`}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomComposedTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  iconType="circle"
                />
                <Bar 
                  yAxisId="left" 
                  name="Revenue (INR)" 
                  dataKey="revenue" 
                  fill="#4f46e5" 
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  name="Registrations" 
                  dataKey="registrations" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
              No daily metrics logged yet.
            </div>
          )}
        </div>
      </div>

      {/* Category distribution Pie Chart */}
      <div className="glass-panel border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">
            Category Distribution
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Breakdown of uploaded submissions across event categories
          </p>
        </div>

        <div className="w-full h-64 flex items-center justify-center">
          {categoryStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-slate-400 text-sm">No photo uploads found yet.</div>
          )}
        </div>

        {/* Legend labels grid */}
        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-400 font-medium">
          {categoryStats.slice(0, 8).map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-1.5 line-clamp-1">
              <span 
                className="w-2.5 h-2.5 rounded-full shrink-0" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></span>
              <span className="truncate">{entry.name} ({entry.value})</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
