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
  { label: 'All', value: 'all', min: -Infinity, max: Infinity },
  { label: '≤ 25 mph', value: '≤25', min: 0, max: 25 },
  { label: '26-35 mph', value: '26-35', min: 26, max: 35 },
  { label: '36-45 mph', value: '36-45', min: 36, max: 45 },
  { label: '46-55 mph', value: '46-55', min: 46, max: 55 },
  { label: '> 55 mph', value: '>55', min: 56, max: Infinity }
];


export default function MapLayer() {
  const [allData, setAllData] = useState([]);
  const [filteredPoints, setFilteredPoints] = useState([]);
  const [selectedHour, setSelectedHour] = useState('all');
  const [selectedSpeedLimit, setSelectedSpeedLimit] = useState('all');
  const [colorScheme, setColorScheme] = useState('cost');


  

  // Helper function to calculate crash severity
  function calculateSeverity(injuries, fatalities) {
    // Weight fatalities more heavily than injuries
    return injuries + (fatalities * 5);}

  // Load full crash dataset
  useEffect(() => {
    async function loadData() {
      try {
        console.log('Starting data load...');
        const response = await fetch('/data/Austin_crashes_20k_most_attributes.geojson');
        
        if (!response.ok) {throw new Error(`HTTP error! status: ${response.status}`);}
        console.log('GeoJSON file fetched successfully');
        const geojson = await response.json();
        console.log('GeoJSON data loaded, features:', geojson.features.length);
        
        const processedData = geojson.features
          .filter(feature => {
            const hasCoords = feature && feature.geometry && feature.geometry.coordinates;
            //if (!hasCoords) {console.log('Feature missing coordinates:', feature);}
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
              const processed = {
                ...props,
                hour: hour,
                speedLimit: props.crash_speed_limit,
                injury_count: parseInt(props.tot_injry_cnt || 0) || 0,
                fatality_count: parseInt(props.death_cnt || 0) || 0,
                severity: calculateSeverity(
                  parseInt(props.tot_injry_cnt || 0) || 0,
                  parseInt(props.death_cnt || 0) || 0
                ),
                cost: parseFloat(props['Estimated Total Comprehensive Cost'] || 0) || 0,
                latitude: feature.geometry.coordinates[1],
                longitude: feature.geometry.coordinates[0],
                //...parseUnitsInvolved(props.units_involved)
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


      } catch (error) {
        console.error('Error loading data:', error);
      }
    }

    loadData();
  }, []);

  // Filter points by selected hour and speed group
  useEffect(() => {
    const filtered = allData
      .filter(d => {
        const hourMatch = selectedHour === 'all' || d.hour === selectedHour;
        const speedRange = SPEED_LIMIT_RANGES.find(r => r.value === selectedSpeedLimit);
        const speedMatch = selectedSpeedLimit === 'all' || 
                          (speedRange && d.speedLimit >= speedRange.min && d.speedLimit <= speedRange.max);
        return hourMatch && speedMatch;
      
      })
      .map(d => [
        d.latitude,
        d.longitude,
        {
          hour: d.hour,
          speedLimit: d.crash_speed_limit,
          speed_group: d.speed_group,
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

        {/* Speed Limit Filter UI (grouped) */}
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
        <PointMapLayer points={filteredPoints} colorScheme={colorScheme} />
        <MapLegend colorScheme={colorScheme} />
      </BaseMap>
    </PageLayout>
  );
}
