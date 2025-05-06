import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import PageLayout from '../../components/PageLayout';

export default function MapPage() {
  return (
    <PageLayout title="Map View">
      <p>This is the map view. Crash locations will be plotted here soon.</p>
    </PageLayout>
  );
}

const UnitsStackedBarChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('/austin crashes 20000 sample.csv')
      .then(res => res.text())
      .then(csv => {
        const parsed = Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
        });

        const counts = {};

        parsed.data.forEach(row => {
          const unit = row['Units Involved']?.trim();
          const injuries = parseInt(row['Injuries']) || 0;
          const deaths = parseInt(row['Deaths']) || 0;

          if (!unit) return;

          if (!counts[unit]) {
            counts[unit] = { injuries: 0, deaths: 0, count: 0 };
          }

          counts[unit].injuries += injuries;
          counts[unit].deaths += deaths;
          counts[unit].count += 1;
        });

        const filtered = Object.entries(counts)
          .filter(([_, val]) => val.count >= 5)
          .map(([unit, val]) => ({
            unit,
            avgInjuries: +(val.injuries / val.count).toFixed(2),
            avgDeaths: +(val.deaths / val.count).toFixed(2),
          }));

        setData(filtered);
      });
  }, []);

  return (
    <ResponsiveContainer width="100%" height={500}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
        <XAxis dataKey="unit" angle={-45} textAnchor="end" interval={0} height={100} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="avgInjuries" stackId="a" fill="#8884d8" name="Avg Injuries" />
        <Bar dataKey="avgDeaths" stackId="a" fill="#82ca9d" name="Avg Deaths" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default function BarChartPage() {
  return (
    <PageLayout title="Map View">
      <p>This is the map view. Crash locations will be plotted here soon.</p>
      
    </PageLayout>
  );
}
//<UnitsStackedBarChart />