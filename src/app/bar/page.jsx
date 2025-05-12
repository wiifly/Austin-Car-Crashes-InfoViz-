'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import PageLayout from '../../components/PageLayout';

export default function BarChartPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch('/data/bar_chart_speed_bins.json');
      const json = await res.json();
      setData(json);
    }

    fetchData();
  }, []);

  return (
    <PageLayout title="Crashes by Speed Limit Zone (Grouped)">
      <div style={{ padding: '1rem', height: '500px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="speed_bin" angle={-45} textAnchor="end" height={80} />
            <YAxis label={{ value: 'Crash Count', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="crash_count" fill="#8884d8" name="Crash Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </PageLayout>
  );
}
