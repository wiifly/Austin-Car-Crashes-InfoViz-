'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function MapLegend() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'info legend');
      div.innerHTML = `
        <style>
          .legend { background: white; padding: 10px; line-height: 1.5; font-size: 12px; border-radius: 5px; box-shadow: 0 0 8px rgba(0,0,0,0.2); }
          .legend-title { font-weight: bold; margin-bottom: 5px; }
          .legend-gradient { height: 10px; width: 100%; background: linear-gradient(to right, #440154, #3b528b, #21918c, #5ec962, #fde725); margin: 6px 0; }
          .legend-circle { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; }
          .red { background: red; }
          .blue { background: blue; }
        </style>
        <div class="legend">
          <div class="legend-title">Crash Heatmap</div>
          <div class="legend-gradient"></div>
          <div><small>Low</small> ← Crash Cost Intensity → <small>High</small></div>
          <hr />
          <div class="legend-title">Top Crash Spots</div>
          <div><span class="legend-circle red"></span> All-Time Top Spots</div>
          <div><span class="legend-circle blue"></span> Hour-Specific Top Spots</div>
        </div>
      `;
      return div;
    };

    legend.addTo(map);

    return () => {
      legend.remove();
    };
  }, [map]);

  return null;
}
