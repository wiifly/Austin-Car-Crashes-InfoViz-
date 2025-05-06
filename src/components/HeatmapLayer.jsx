'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

export default function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) return;

    const heatLayer = L.heatLayer(points, {
      radius: 10,
      blur: 15,
      maxZoom: 16,
      opacity: 0.3,
      gradient: {
        0.0: '#0d0887',
        0.4: '#5ec962',
        0.7: '#b5de2b',
        1.0: '#fde725'
      },
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}
