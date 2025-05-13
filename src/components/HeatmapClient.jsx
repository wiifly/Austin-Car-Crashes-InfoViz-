'use client';
import { CircleMarker, Tooltip } from 'react-leaflet';
import MapLegend from '@/components/MapLegend';

export default function HeatmapClient({ points, topSpots, hourlyTopSpots, selectedHour }) {
  return (
    <>
      <HeatmapLayer points={points} />

      {selectedHour === 'all' && topSpots.map((spot, idx) => {
        const lat = parseFloat(spot.avg_lat);
        const lng = parseFloat(spot.avg_lng);
        const radius = Math.min(spot.count || 1, 12);
        if (isNaN(lat) || isNaN(lng)) return null;
        return (
          <CircleMarker key={`agg-${idx}`} center={[lat, lng]} radius={radius} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.4 }}>
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

      {selectedHour !== 'all' &&
        hourlyTopSpots[selectedHour]?.map((spot, idx) => (
          <CircleMarker key={`hour-${idx}`} center={[spot.avg_lat, spot.avg_lng]} radius={Math.min(spot.count, 12)} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.5 }}>
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
    </>
  );
}
