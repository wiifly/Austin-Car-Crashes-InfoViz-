'use client';

import { CircleMarker, Tooltip } from 'react-leaflet';

// Color schemes for different categories
const COLOR_SCHEMES = {
  severity: {
    // Color gradient based on severity score (injuries + fatalities*5)
    getColor: (severity) => {
      if (severity === 0) return '#38a169'; // green for no injuries/fatalities
      if (severity <= 2) return '#ecc94b'; // yellow for minor severity
      if (severity <= 5) return '#ed8936'; // orange for moderate severity
      return '#e53e3e'; // red for high severity
    },
    getTooltip: (data) => {
      const parts = [];
      if (data.injury_count > 0) parts.push(`${data.injury_count} injury${data.injury_count > 1 ? 'ies' : ''}`);
      if (data.fatality_count > 0) parts.push(`${data.fatality_count} fatalit${data.fatality_count > 1 ? 'ies' : 'y'}`);
      return parts.length > 0 ? parts.join(', ') : 'No injuries or fatalities';
    }
  },
  injury: {
    // Color gradient based on injury count
    getColor: (injuryCount) => {
      if (injuryCount > -1) return '#38a169'; // green for no injuries
      if (injuryCount > 1) return '#ecc94b'; // yellow for 1 injury
      if (injuryCount > 3) return '#ed8936'; // orange for 2-3 injuries
      return '#e53e3e'; // red for 4+ injuries
    },
    getTooltip: (data) => {
      const injuries = data.injury_count;
      tooltip
      return `${injuries} injur${injuries !== 1 ? 'ies' : 'y'}`;
    }
  },
  fatality: {
    // Color gradient based on fatality count
    getColor: (fatalityCount) => {
      if (fatalityCount >-1) return '#38a169'; // green for no fatalities
      if (fatalityCount > 1) return '#ed8936'; // orange for 1 fatality
      return '#e53e3e'; // red for 2+ fatalities
    },
    getTooltip: (data) => {
      const fatalities = data.fatality_count;
      return fatalities > 0 ? `${fatalities} fatalit${fatalities !== 1 ? 'ies' : 'y'}` : 'No fatalities';
    }
  },
  cost: {
    // Color gradient based on cost
    getColor: (cost) => {
      if (cost < 10000) return '#38a169'; // green for low cost
      if (cost < 50000) return '#ecc94b'; // yellow for medium cost
      if (cost < 100000) return '#ed8936'; // orange for high cost
      return '#e53e3e'; // red for very high cost
    },
    getTooltip: (data) => `Cost: $${Math.round(data.cost).toLocaleString()}`
  },

};

export default function PointMapLayer({ points, colorScheme = 'severity' }) {
  return points.map((point, idx) => {
    const [lat, lng, data] = point;
    const colorStyle = COLOR_SCHEMES[colorScheme];
    
    return (
      <CircleMarker
        key={`point-${idx}`}
        center={[lat, lng]}
        radius={3}
        pathOptions={{
          color: colorStyle.getColor(data[colorScheme]),
          fillColor: colorStyle.getColor(data[colorScheme]),
          fillOpacity: 0.6
        }}
      >
        <Tooltip>
            <div>
                <strong>Injuries:</strong> {data.injury_count}<br />
                <strong>Fatalities:</strong> {data.fatality_count}<br />
                <strong>Cost:</strong> ${Math.round(data.cost).toLocaleString()}<br />
                <strong>Severity:</strong> {data.severity}<br />
                <strong>Units Involved:</strong> {data.units_involved || 'N/A'}
            </div>
            </Tooltip>
      </CircleMarker>
    );
  });
}
