'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '@/components/PageLayout';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from 'recharts';

export default function TrendPage() {
  const [trendData, setTrendData] = useState([]);

  useEffect(() => {
    async function fetchTrend() {
      const res = await fetch('/data/hourly_crash_trend.json');
      const data = await res.json();
      setTrendData(data);
    }
    fetchTrend();
  }, []);

  return (
    <PageLayout title="Crash Trends by Hour">
      <div style={{ padding: '1rem', height: '500px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" label={{ value: 'Hour of Day', position: 'insideBottomRight', offset: -5 }} />
            <YAxis yAxisId="left" label={{ value: 'Crashes', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Avg Cost ($)', angle: -90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="total_crashes" stroke="#ff7300" name="Total Crashes" />
            <Line yAxisId="right" type="monotone" dataKey="avg_cost" stroke="#387908" name="Avg Cost" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </PageLayout>
  );
}
