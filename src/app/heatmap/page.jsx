'use client';


import PageLayout from '../../components/PageLayout';
import BaseMap from '../../components/MapContainer';
// import HeatLayer from '@/components/HeatLayer'; // if separated

export default function HeatmapPage() {
  return (
    <PageLayout title="Heatmap View">
      <BaseMap>
        {/* Add heat layer or points here */}
        {/* <HeatLayer /> */}
      </BaseMap>
    </PageLayout>
  );
}