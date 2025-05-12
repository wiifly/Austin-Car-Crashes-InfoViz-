'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Color scheme definitions for the legend
const LEGEND_SCHEMES = {
  severity: {
    title: 'Crash Severity',
    type: 'gradient',
    colors: [
      { color: '#38a169', label: 'No injuries/fatalities' },
      { color: '#ecc94b', label: 'Minor severity (1-2)' },
      { color: '#ed8936', label: 'Moderate severity (3-5)' },
      { color: '#e53e3e', label: 'High severity (6+)' }
    ]
  },
  injury: {
    title: 'Injury Count',
    type: 'gradient',
    colors: [
      { color: '#38a169', label: 'No injuries' },
      { color: '#ecc94b', label: '1 injury' },
      { color: '#ed8936', label: '2-3 injuries' },
      { color: '#e53e3e', label: '4+ injuries' }
    ]
  },
  fatality: {
    title: 'Fatality Count',
    type: 'gradient',
    colors: [
      { color: '#38a169', label: 'No fatalities' },
      { color: '#ed8936', label: '1 fatality' },
      { color: '#e53e3e', label: '2+ fatalities' }
    ]
  },
  cost: {
    title: 'Crash Cost',
    type: 'gradient',
    colors: [
      { color: '#38a169', label: '< $10,000' },
      { color: '#ecc94b', label: '$10,000 - $50,000' },
      { color: '#ed8936', label: '$50,000 - $100,000' },
      { color: '#e53e3e', label: '> $100,000' }
    ]
  }
};

export default function MapLegend({ colorScheme = 'severity' }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const legend = L.control({ position: 'bottomright' });
    const scheme = LEGEND_SCHEMES[colorScheme];

    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'info legend');
      
      let html = `
        <style>
          .legend { 
            background: white; 
            padding: 10px; 
            line-height: 1.5; 
            font-size: 12px; 
            border-radius: 5px; 
            box-shadow: 0 0 8px rgba(0,0,0,0.2); 
          }
          .legend-title { 
            font-weight: bold; 
            margin-bottom: 5px; 
          }
          .legend-gradient { 
            height: 10px; 
            width: 100%; 
            margin: 6px 0; 
          }
          .legend-circle { 
            display: inline-block; 
            width: 10px; 
            height: 10px; 
            border-radius: 50%; 
            margin-right: 5px; 
          }
          .legend-item {
            margin: 4px 0;
          }
        </style>
        <div class="legend">
          <div class="legend-title">${scheme.title}</div>
      `;

      if (scheme.type === 'gradient') {
        const gradientColors = scheme.colors.map(c => c.color).join(', ');
        html += `
          <div class="legend-gradient" style="background: linear-gradient(to right, ${gradientColors});"></div>
          <div class="legend-item"><small>${scheme.colors[0].label}</small> → <small>${scheme.colors[scheme.colors.length - 1].label}</small></div>
        `;
      } else {
        // Binary type (for vehicle involvement)
        scheme.colors.forEach(({ color, label }) => {
          html += `
            <div class="legend-item">
              <span class="legend-circle" style="background: ${color}"></span>
              ${label}
            </div>
          `;
        });
      }

      div.innerHTML = html;
      return div;
    };

    legend.addTo(map);

    return () => {
      legend.remove();
    };
  }, [map, colorScheme]);

  return null;
}
