'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '@/components/PageLayout';
import { CircleMarker, Tooltip } from 'react-leaflet';
import MapLegend from '@/components/MapLegend';


// Dynamic imports to avoid SSR issues with Leaflet

const BaseMap = dynamic(() => import('@/components/MapContainer'), { ssr: false });
const HeatmapLayer = dynamic(() => import('@/components/HeatmapLayer'), { ssr: false });

export default function HeatmapPage() {
  const [allData, setAllData] = useState([]);
  const [filteredPoints, setFilteredPoints] = useState([]);
  const [topSpots, setTopSpots] = useState([]);
  const [hourlyTopSpots, setHourlyTopSpots] = useState({});
  const [selectedHour, setSelectedHour] = useState('all'); // default to 'all'

  // Load full crash dataset and top/hours spots
  useEffect(() => {
    async function loadData() {
      const res = await fetch('/data/crashes_with_hour.json');
      const data = await res.json();
      setAllData(data);
    }

    async function loadTopSpots() {
      const res = await fetch('/data/top_crash_spots_clustered.json');
      const spots = await res.json();
      setTopSpots(spots);
    }

    async function loadHourlyTopSpots() {
      const res = await fetch('/data/hourly_top_spots.json');
      const spots = await res.json();
      setHourlyTopSpots(spots);
    }

    loadData();
    loadTopSpots();
    loadHourlyTopSpots();
  }, []);

  // Filter heatmap points by selected hour or show all
  useEffect(() => {
    const filtered = allData
      .filter(d => selectedHour === 'all' || d.hour === selectedHour)
      .map(d => [
        parseFloat(d.latitude),
        parseFloat(d.longitude),
        Math.max(1, parseFloat(d['Estimated Total Comprehensive Cost']) / 100000),
      ]);
    setFilteredPoints(filtered);
  }, [allData, selectedHour]);

  return (
    <PageLayout title="Heatmap View">
      {/* Time Filter UI */}
      <div style={{ marginBottom: '1rem', padding: '0 1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          <input
            type="checkbox"
            checked={selectedHour === 'all'}
            onChange={(e) =>
              setSelectedHour(e.target.checked ? 'all' : 8)
            }
          />{' '}
          Show all crashes
        </label>

        {selectedHour !== 'all' && (
          <>
            <label htmlFor="hourRange"><strong>Hour:</strong> {selectedHour}:00</label>
            <input
              id="hourRange"
              type="range"
              min="0"
              max="23"
              value={selectedHour}
              onChange={(e) => setSelectedHour(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </>
        )}
      </div>

      {/* Map Section */}
      <BaseMap>
        <HeatmapLayer points={filteredPoints} />

        {/*  Static top crash spots (always shown) */}
        
        {selectedHour === 'all' && topSpots.map((spot, idx) => {
  const lat = parseFloat(spot.avg_lat);
  const lng = parseFloat(spot.avg_lng);
  const radius = Math.min(spot.count || 1, 12);

  if (isNaN(lat) || isNaN(lng)) return null;

  return (
    <CircleMarker
      key={`agg-${idx}`}
      center={[lat, lng]}
      radius={radius}
      pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.4 }}
    >
      <Tooltip direction="top" offset={[0, -5]} opacity={1}>
        <div>
          <strong>Top Spot (All Time)</strong><br />
          <strong>Crashes:</strong> {spot.count}<br />
          <strong>Avg Cost:</strong> ${Math.round(spot.avg_cost).toLocaleString()}<br />
          <strong>Avg Severity:</strong> {spot.avg_severity.toFixed(1)}
        </div>
      </Tooltip>
    </CircleMarker>
  );
})}


        {/* 🔵 Hourly top spots (only shown when filtering by hour) */}
        {selectedHour !== 'all' &&
          hourlyTopSpots[selectedHour] &&
          hourlyTopSpots[selectedHour].map((spot, idx) => (
            <CircleMarker
              key={`hour-${idx}`}
              center={[spot.avg_lat, spot.avg_lng]}
              radius={Math.min(spot.count, 12)}
              pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.5 }}
            >
              <Tooltip direction="top" offset={[0, -5]} opacity={1}>
                <div>
                  <strong>Top Spot (Hour {selectedHour})</strong><br />
                  <strong>Crashes:</strong> {spot.count}<br />
                  <strong>Avg Cost:</strong> ${Math.round(spot.avg_cost).toLocaleString()}<br />
                  <strong>Avg Severity:</strong> {spot.avg_severity.toFixed(1)}
                </div>
              </Tooltip>
            </CircleMarker>
        ))}

        <MapLegend />
      </BaseMap>
    </PageLayout>
  );
}
