'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '@/components/PageLayout';
import MapLegend from '@/components/MapLegend';

// Dynamic imports to avoid SSR issues with Leaflet
const BaseMap = dynamic(() => import('@/components/MapContainer'), { ssr: false });
const PointMapLayer = dynamic(() => import('@/components/PointMapLayer'), { ssr: false });

// Speed limit ranges for the filter
const SPEED_LIMIT_RANGES = [
  { label: 'All Speeds', value: 'all' },
  { label: '≤ 25 mph', value: '25', min: 0, max: 25 },
  { label: '26-35 mph', value: '35', min: 26, max: 35 },
  { label: '36-45 mph', value: '45', min: 36, max: 45 },
  { label: '46-55 mph', value: '55', min: 46, max: 55 },
  { label: '> 55 mph', value: '55+', min: 56, max: Infinity }
];

function getQuantiles(arr, quantiles = [0, 0.33, 0.66, 1]) {
  if (!arr.length) return quantiles.map(() => 0);
  const sorted = [...arr].sort((a, b) => a - b);
  return quantiles.map(q => {
    const pos = q * (sorted.length - 1);
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
      return sorted[base];
    }
  });
}

export default function MapLayer() {
  const [allData, setAllData] = useState([]);
  const [filteredPoints, setFilteredPoints] = useState([]);
  const [selectedHour, setSelectedHour] = useState('all');
  const [selectedSpeedLimit, setSelectedSpeedLimit] = useState('all');
  const [colorScheme, setColorScheme] = useState('cost');
  const [quantiles, setQuantiles] = useState({
    severity: [0, 1, 2, 3],
    injury: [0, 1, 2, 3],
    fatality: [0, 1, 2],
    cost: [0, 10000, 50000, 100000]
  });

  // Helper function to parse units involved
  function parseUnitsInvolved(unitsStr) {
    if (!unitsStr) return {};
    
    const units = unitsStr.toLowerCase();
    return {
      has_pedestrian: units.includes('pedestrian') || units.includes('ped'),
      has_bicycle: units.includes('bicycle') || units.includes('bike'),
      has_motorcycle: units.includes('motorcycle') || units.includes('moto'),
      has_truck: units.includes('truck'),
      has_bus: units.includes('bus'),
      has_emergency: units.includes('emergency') || units.includes('fire') || units.includes('police'),
      has_other: !['pedestrian', 'bicycle', 'motorcycle', 'truck', 'bus', 'emergency', 'passenger car']
        .some(unit => units.includes(unit))
    };
  }

  // Helper function to calculate crash severity
  function calculateSeverity(injuries, fatalities) {
    // Weight fatalities more heavily than injuries
    return injuries + (fatalities * 5);
  }

  // Load full crash dataset
  useEffect(() => {
    async function loadData() {
      try {
        console.log('Starting data load...');
        const response = await fetch('/data/Austin_crashes_20k_most_attributes.geojson');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('GeoJSON file fetched successfully');
        const geojson = await response.json();
        console.log('GeoJSON data loaded, features:', geojson.features.length);
        
        const processedData = geojson.features
          .filter(feature => {
            const hasCoords = feature && feature.geometry && feature.geometry.coordinates;
            if (!hasCoords) {
              console.log('Feature missing coordinates:', feature);
            }
            return hasCoords;
          })
          .map(feature => {
            try {
              const props = feature.properties;
              // Parse timestamp to get hour
              const timestamp = props['Crash timestamp'];
              const hour = timestamp ? 
                parseInt(timestamp.split(' ')[1].split(':')[0]) + 
                (timestamp.includes('PM') && parseInt(timestamp.split(' ')[1].split(':')[0]) !== 12 ? 12 : 0) +
                (timestamp.includes('AM') && parseInt(timestamp.split(' ')[1].split(':')[0]) === 12 ? -12 : 0)
                : 0;

              // Parse speed limit
              const speedLimit = parseInt(props['Speed Limit'] || props['speed_limit'] || '0');
              
              const processed = {
                ...props,
                hour: hour,
                speed_limit: speedLimit,
                injury_count: parseInt(props.tot_injry_cnt || 0) || 0,
                fatality_count: parseInt(props.death_cnt || 0) || 0,
                severity: calculateSeverity(
                  parseInt(props.tot_injry_cnt || 0) || 0,
                  parseInt(props.death_cnt || 0) || 0
                ),
                cost: parseFloat(props['Estimated Total Comprehensive Cost'] || 0) || 0,
                latitude: feature.geometry.coordinates[1],
                longitude: feature.geometry.coordinates[0],
                ...parseUnitsInvolved(props.units_involved)
              };
              
              if (isNaN(processed.latitude) || isNaN(processed.longitude)) {
                console.log('Invalid coordinates in feature:', feature, 'Processed:', processed);
              }
              
              return processed;
            } catch (err) {
              console.error('Error processing feature:', feature, err);
              return null;
            }
          })
          .filter(row => {
            const isValid = row && 
              !isNaN(row.latitude) && 
              !isNaN(row.longitude) && 
              row.latitude !== 0 && 
              row.longitude !== 0;
            
            if (!isValid && row) {
              console.log('Filtered out invalid row:', row);
            }
            return isValid;
          });
        
        console.log('Data processing complete, valid rows:', processedData.length);
        console.log('Sample processed row:', processedData[0]);
        setAllData(processedData);

        // Calculate quantiles for color scales
        const severityArr = processedData.map(d => d.severity).filter(x => !isNaN(x));
        const injuryArr = processedData.map(d => d.injury_count).filter(x => !isNaN(x));
        const fatalityArr = processedData.map(d => d.fatality_count).filter(x => !isNaN(x));
        const costArr = processedData.map(d => d.cost).filter(x => !isNaN(x));
        setQuantiles({
          severity: getQuantiles(severityArr, [0, 0.33, 0.66, 1]),
          injury: getQuantiles(injuryArr, [0, 0.33, 0.66, 1]),
          fatality: getQuantiles(fatalityArr, [0, 0.5, 1]),
          cost: getQuantiles(costArr, [0, 0.33, 0.66, 1])
        });
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }

    loadData();
  }, []);

  // Filter points by selected hour and speed limit
  useEffect(() => {
    const filtered = allData
      .filter(d => {
        const hourMatch = selectedHour === 'all' || d.hour === selectedHour;
        
        // Speed limit filtering
        let speedMatch = true;
        if (selectedSpeedLimit !== 'all') {
          const range = SPEED_LIMIT_RANGES.find(r => r.value === selectedSpeedLimit);
          if (range) {
            speedMatch = d.speed_limit >= range.min && d.speed_limit <= range.max;
          }
        }
        
        return hourMatch && speedMatch;
      })
      .map(d => [
        d.latitude,
        d.longitude,
        {
          hour: d.hour,
          speed_limit: d.speed_limit,
          injury_count: d.injury_count,
          fatality_count: d.fatality_count,
          severity: d.severity,
          cost: d.cost,
          has_pedestrian: d.has_pedestrian,
          has_bicycle: d.has_bicycle,
          has_motorcycle: d.has_motorcycle,
          has_truck: d.has_truck,
          has_bus: d.has_bus,
          has_emergency: d.has_emergency,
          has_other: d.has_other
        }
      ]);
    setFilteredPoints(filtered);
  }, [allData, selectedHour, selectedSpeedLimit]);

  return (
    <PageLayout title="Individual Crash View">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', padding: '0 1rem', flexWrap: 'wrap' }}>
        {/* Time Filter UI */}
        <div style={{ flex: 1, minWidth: '200px' }}>
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

        {/* Speed Limit Filter UI */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ marginBottom: '0.5rem' }}><strong>Speed Limit:</strong></div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {SPEED_LIMIT_RANGES.map(range => (
              <label key={range.value} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input
                  type="radio"
                  name="speedLimit"
                  checked={selectedSpeedLimit === range.value}
                  onChange={() => setSelectedSpeedLimit(range.value)}
                />
                <span>{range.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Color Scheme UI */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ marginBottom: '0.5rem' }}><strong>Color By:</strong></div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <input
                type="radio"
                name="colorScheme"
                checked={colorScheme === 'severity'}
                onChange={() => setColorScheme('severity')}
              />
              <span>Crash Severity</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <input
                type="radio"
                name="colorScheme"
                checked={colorScheme === 'injury'}
                onChange={() => setColorScheme('injury')}
              />
              <span>Injury Count</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <input
                type="radio"
                name="colorScheme"
                checked={colorScheme === 'fatality'}
                onChange={() => setColorScheme('fatality')}
              />
              <span>Fatality Count</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <input
                type="radio"
                name="colorScheme"
                checked={colorScheme === 'cost'}
                onChange={() => setColorScheme('cost')}
              />
              <span>Crash Cost</span>
            </label>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <BaseMap>
        <PointMapLayer points={filteredPoints} colorScheme={colorScheme} quantiles={quantiles} />
        <MapLegend colorScheme={colorScheme} quantiles={quantiles} />
      </BaseMap>
    </PageLayout>
  );
}
