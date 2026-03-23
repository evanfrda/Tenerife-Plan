'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Trip } from '@/lib/types';
import { getTrips, deleteTrip, saveTrip } from '@/lib/storage';
import { getTenerifeTrip } from '@/lib/tenerifeTripSeed';

export default function DashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let currentTrips = getTrips();
    if (currentTrips.length === 0) {
      const tenerifeTrip = getTenerifeTrip();
      saveTrip(tenerifeTrip);
      currentTrips = getTrips();
    } else {
      // Update existing Tenerife trip with restaurant data if missing
      const tenerifeSeed = getTenerifeTrip();
      const existing = currentTrips.find((t) => t.id === tenerifeSeed.id);
      if (existing && existing.days.length > 0 && !existing.days[0].restaurants) {
        const updated = { ...existing };
        updated.days = updated.days.map((day) => {
          const seedDay = tenerifeSeed.days.find((sd) => sd.dayNumber === day.dayNumber);
          if (seedDay?.restaurants) {
            return { ...day, restaurants: seedDay.restaurants };
          }
          return day;
        });
        saveTrip(updated);
        currentTrips = getTrips();
      }
    }
    setTrips(currentTrips);
    setLoaded(true);
  }, []);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Supprimer le voyage "${name}" ?`)) {
      deleteTrip(id);
      setTrips(getTrips());
    }
  };

  const now = new Date();

  const upcomingTrips = trips.filter((t) => new Date(t.endDate) >= now);
  const pastTrips = trips.filter((t) => new Date(t.endDate) < now);

  const getDayCount = (trip: Trip) => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const TripCard = ({ trip }: { trip: Trip }) => (
    <Link
      href={`/voyage/${trip.id}`}
      className="group relative bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 overflow-hidden"
    >
      {/* Top color bar */}
      <div
        className="h-1.5"
        style={{ backgroundColor: '#4A67FF' }}
      />
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{trip.flag}</span>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {trip.name}
              </h3>
              <p className="text-sm text-gray-500">{trip.country}</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDelete(trip.id, trip.name);
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Supprimer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            {formatDate(trip.startDate)}
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {getDayCount(trip)} jours
          </div>
        </div>

        {trip.days.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {trip.days.slice(0, 5).map((day) => (
              <span
                key={day.dayNumber}
                className="px-2 py-0.5 text-xs font-medium rounded-md bg-gray-50 text-gray-600 border border-gray-100"
              >
                J{day.dayNumber}
              </span>
            ))}
            {trip.days.length > 5 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-gray-50 text-gray-400">
                +{trip.days.length - 5}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );

  const NewTripCard = () => (
    <Link
      href="/voyage/new"
      className="group flex flex-col items-center justify-center p-8 bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-300 min-h-[200px]"
    >
      <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-50 group-hover:bg-blue-100 transition-colors mb-4">
        <svg
          className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </div>
      <span className="text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors">
        Nouveau voyage
      </span>
    </Link>
  );

  const EmptyState = () => (
    <div className="text-center py-20">
      <div className="text-6xl mb-6">🌍</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Aucun voyage pour le moment
      </h3>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        Commencez par créer votre premier voyage. Ajoutez vos destinations,
        planifiez jour par jour et visualisez tout sur une carte.
      </p>
      <Link
        href="/voyage/new"
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/25"
        style={{ backgroundColor: '#4A67FF' }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Créer mon premier voyage
      </Link>
    </div>
  );

  const TripSection = ({
    title,
    tripList,
    showNew,
  }: {
    title: string;
    tripList: Trip[];
    showNew?: boolean;
  }) => {
    if (tripList.length === 0 && !showNew) return null;
    return (
      <div className="mb-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {showNew && <NewTripCard />}
          {tripList.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🗺️</span>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              TripMap
            </span>
          </Link>
          <nav className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-sm font-medium transition-colors"
              style={{ color: '#4A67FF' }}
            >
              Mes voyages
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes voyages</h1>
            <p className="text-gray-500 mt-1">
              {trips.length === 0
                ? 'Aucun voyage'
                : `${trips.length} voyage${trips.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <Link
            href="/voyage/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/25"
            style={{ backgroundColor: '#4A67FF' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nouveau voyage
          </Link>
        </div>

        {!loaded ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : trips.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <TripSection title="A venir" tripList={upcomingTrips} showNew />
            <TripSection title="Passes" tripList={pastTrips} />
          </>
        )}
      </main>
    </div>
  );
}
