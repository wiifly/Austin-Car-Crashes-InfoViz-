'use client';

import { useEffect, useState } from 'react';
import PageLayout from '@/components/PageLayout';
import dynamic from 'next/dynamic';
import { CircleMarker, Tooltip } from 'react-leaflet';
import MapLegend from '@/components/MapLegend';


// 👇 Import MapContainer dynamically to avoid SSR issues
const BaseMap = dynamic(() => import('@/components/MapContainer'), { ssr: false });
const HeatmapLayer = dynamic(() => import('@/components/HeatmapLayer'), { ssr: false });

export default function HeatmapPage() {
    const [heatPoints, setHeatPoints] = useState([]);
    const [topSpots, setTopSpots] = useState([]);
  
    useEffect(() => {
      async function loadData() {
        const res = await fetch('/data/crashes_cleaned.json');
        const data = await res.json();
  
        const points = data
          .filter(d => d.latitude && d.longitude)
          .map(d => [
            parseFloat(d.latitude),
            parseFloat(d.longitude),
            Math.max(1, parseFloat(d['Estimated Total Comprehensive Cost']) / 100000),
          ]);
        setHeatPoints(points);
      }
  
      async function loadTopSpots() {
        const res = await fetch('/data/top_crash_spots.json');
        const spots = await res.json();
        setTopSpots(spots);
      }
  
      loadData();
      loadTopSpots();
    }, []);
  
    return (
      <PageLayout title="Heatmap View">
        <BaseMap>
  <HeatmapLayer points={heatPoints} />
  
  {topSpots.map((spot, idx) => (
    <CircleMarker
      key={idx}
      center={[spot.latitude, spot.longitude]}
      radius={Math.min(spot.crash_count, 12)}
      pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.5 }}
    >
      <Tooltip direction="top" offset={[0, -5]} opacity={1}>
        <div>
          <strong>Crashes:</strong> {spot.crash_count}<br />
          <strong>Avg Cost:</strong> ${Math.round(spot.avg_cost).toLocaleString()}<br />
          <strong>Avg Severity:</strong> {spot.avg_severity.toFixed(1)}
        </div>
      </Tooltip>
    </CircleMarker>
  ))}

  {/* ✅ Add this line */}
  <MapLegend />
</BaseMap>


      </PageLayout>
    );
  }
  