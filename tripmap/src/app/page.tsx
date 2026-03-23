'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Trip } from '@/lib/types';
import { getTrip, saveTrip, loadTripFromSupabase } from '@/lib/storage';
import { getTenerifeTrip } from '@/lib/tenerifeTripSeed';

const MobileTripApp = dynamic(() => import('@/components/MobileTripApp'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f0',
      fontFamily: 'Poppins, sans-serif',
    }}>
      <div style={{
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{'\uD83C\uDDEE\uD83C\uDDE8'}</div>
        <div style={{
          width: 32,
          height: 32,
          border: '3px solid #e0e0e0',
          borderTopColor: '#4CAF50',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto',
        }} />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  ),
});

export default function HomePage() {
  const [trip, setTrip] = useState<Trip | null>(null);

  useEffect(() => {
    async function loadTrip() {
      const tenerifeSeed = getTenerifeTrip();

      // 1. Try loading from Supabase first (shared source of truth)
      const supabaseTrip = await loadTripFromSupabase(tenerifeSeed.id);

      if (supabaseTrip) {
        // Supabase has the latest version — use it
        saveTrip(supabaseTrip); // sync to localStorage too (no re-upload since data matches)
        setTrip(supabaseTrip);
        return;
      }

      // 2. Fallback: localStorage or seed
      let t = getTrip(tenerifeSeed.id);
      if (!t) {
        saveTrip(tenerifeSeed); // saves to both localStorage + Supabase
        t = tenerifeSeed;
      }

      setTrip(t);
    }

    loadTrip();
  }, []);

  if (!trip) return null;

  return <MobileTripApp trip={trip} />;
}
