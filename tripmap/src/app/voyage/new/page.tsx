'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Trip, DayData, Activity } from '@/lib/types';
import { saveTrip } from '@/lib/storage';

const COUNTRIES = [
  { name: 'Espagne (Canaries)', flag: '\uD83C\uDDEE\uD83C\uDDE8' },
  { name: 'France', flag: '\uD83C\uDDEB\uD83C\uDDF7' },
  { name: 'Italie', flag: '🇮🇹' },
  { name: 'Espagne', flag: '🇪🇸' },
  { name: 'Portugal', flag: '🇵🇹' },
  { name: 'Grece', flag: '🇬🇷' },
  { name: 'Thailande', flag: '🇹🇭' },
  { name: 'Vietnam', flag: '🇻🇳' },
  { name: 'Indonesie', flag: '🇮🇩' },
  { name: 'Etats-Unis', flag: '🇺🇸' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'Mexique', flag: '🇲🇽' },
  { name: 'Bresil', flag: '🇧🇷' },
  { name: 'Argentine', flag: '🇦🇷' },
  { name: 'Maroc', flag: '🇲🇦' },
  { name: 'Coree du Sud', flag: '🇰🇷' },
  { name: 'Royaume-Uni', flag: '🇬🇧' },
  { name: 'Allemagne', flag: '🇩🇪' },
  { name: 'Pays-Bas', flag: '🇳🇱' },
  { name: 'Australie', flag: '🇦🇺' },
  { name: 'Nouvelle-Zelande', flag: '🇳🇿' },
  { name: 'Autre', flag: '🌍' },
];

function generateDays(startDate: string, endDate: string): DayData[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days: DayData[] = [];
  let dayNum = 1;
  const current = new Date(start);

  while (current <= end) {
    days.push({
      dayNumber: dayNum,
      title: '',
      description: '',
      date: current.toISOString().slice(0, 10),
      activities: [],
    });
    dayNum++;
    current.setDate(current.getDate() + 1);
  }

  return days;
}

function formatDateDisplay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export default function NewTripPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1
  const [name, setName] = useState('');
  const [countryIndex, setCountryIndex] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Step 2
  const [mode, setMode] = useState<'manual' | 'paste'>('manual');
  const [pasteText, setPasteText] = useState('');

  // Step 3
  const [days, setDays] = useState<DayData[]>([]);

  const country = COUNTRIES[countryIndex];

  const canGoStep2 = name.trim() && startDate && endDate && endDate >= startDate;
  const canGoStep3 = mode === 'manual' || pasteText.trim();

  const handleStep2Next = () => {
    const generated = generateDays(startDate, endDate);

    if (mode === 'paste' && pasteText.trim()) {
      const lines = pasteText.split('\n').filter((l) => l.trim());
      let currentDay = 0;
      for (const line of lines) {
        const dayMatch = line.match(/^(?:jour|j|day)\s*(\d+)/i);
        if (dayMatch) {
          currentDay = parseInt(dayMatch[1]) - 1;
          if (currentDay >= 0 && currentDay < generated.length) {
            const titlePart = line.replace(/^(?:jour|j|day)\s*\d+\s*[-:.]?\s*/i, '');
            if (titlePart) generated[currentDay].title = titlePart;
          }
        } else if (currentDay >= 0 && currentDay < generated.length) {
          const timeMatch = line.match(/^(\d{1,2}[h:]\d{0,2})\s*[-:]?\s*(.*)/i);
          if (timeMatch) {
            generated[currentDay].activities.push({
              id: crypto.randomUUID(),
              time: timeMatch[1].replace('h', ':').replace(/:$/, ':00'),
              period: '',
              name: timeMatch[2] || '',
              query: '',
              lat: 0,
              lng: 0,
              desc: '',
            });
          }
        }
      }
    }

    setDays(generated);
    setStep(3);
  };

  const updateDay = (dayIndex: number, field: keyof DayData, value: string) => {
    setDays((prev) => {
      const updated = [...prev];
      updated[dayIndex] = { ...updated[dayIndex], [field]: value };
      return updated;
    });
  };

  const addActivity = (dayIndex: number) => {
    setDays((prev) => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        activities: [
          ...updated[dayIndex].activities,
          { id: crypto.randomUUID(), time: '', period: '', name: '', query: '', lat: 0, lng: 0, desc: '' },
        ],
      };
      return updated;
    });
  };

  const removeActivity = (dayIndex: number, actIndex: number) => {
    setDays((prev) => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        activities: updated[dayIndex].activities.filter((_, i) => i !== actIndex),
      };
      return updated;
    });
  };

  const updateActivity = (
    dayIndex: number,
    actIndex: number,
    field: keyof Activity,
    value: string | number
  ) => {
    setDays((prev) => {
      const updated = [...prev];
      const acts = [...updated[dayIndex].activities];
      acts[actIndex] = { ...acts[actIndex], [field]: value };
      updated[dayIndex] = { ...updated[dayIndex], activities: acts };
      return updated;
    });
  };

  const handleCreate = () => {
    const trip: Trip = {
      id: uuidv4(),
      name,
      country: country.name,
      flag: country.flag,
      startDate,
      endDate,
      destinations: [],
      days,
      phases: [],
      createdAt: new Date().toISOString(),
    };
    saveTrip(trip);
    router.push(`/voyage/${trip.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            <span className="text-sm">Retour</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗺️</span>
            <span className="text-xl font-bold text-gray-900 tracking-tight">TripMap</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (s < step) setStep(s);
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  s === step
                    ? 'text-white shadow-lg shadow-blue-500/30'
                    : s < step
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
                style={s === step ? { backgroundColor: '#4A67FF' } : undefined}
              >
                {s < step ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  s
                )}
              </button>
              {s < 3 && (
                <div
                  className={`w-16 h-0.5 rounded ${
                    s < step ? 'bg-blue-200' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Basic info */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Informations du voyage</h1>
              <p className="text-gray-500 mt-2">Donnez un nom et des dates a votre voyage</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du voyage
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Road trip Tenerife 2026"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pays
                </label>
                <div className="relative">
                  <select
                    value={countryIndex}
                    onChange={(e) => setCountryIndex(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 appearance-none bg-white"
                  >
                    {COUNTRIES.map((c, i) => (
                      <option key={i} value={i}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                  <svg className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de debut
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                  />
                </div>
              </div>

              {canGoStep2 && (
                <div className="pt-2 text-sm text-gray-500 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  {generateDays(startDate, endDate).length} jours
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setStep(2)}
                disabled={!canGoStep2}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white rounded-xl transition-all hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
                style={{ backgroundColor: '#4A67FF' }}
              >
                Continuer
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Mode */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Mode de saisie</h1>
              <p className="text-gray-500 mt-2">Comment souhaitez-vous renseigner votre itineraire ?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setMode('manual')}
                className={`p-6 rounded-2xl border-2 text-left transition-all ${
                  mode === 'manual'
                    ? 'border-blue-400 bg-blue-50/50 shadow-sm'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className="text-2xl mb-3">✍️</div>
                <h3 className="font-semibold text-gray-900 mb-1">Saisie manuelle</h3>
                <p className="text-sm text-gray-500">
                  Remplissez jour par jour dans un formulaire interactif
                </p>
              </button>
              <button
                onClick={() => setMode('paste')}
                className={`p-6 rounded-2xl border-2 text-left transition-all ${
                  mode === 'paste'
                    ? 'border-blue-400 bg-blue-50/50 shadow-sm'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className="text-2xl mb-3">📋</div>
                <h3 className="font-semibold text-gray-900 mb-1">Coller un itineraire</h3>
                <p className="text-sm text-gray-500">
                  Collez un texte et on essaiera de le parser automatiquement
                </p>
              </button>
            </div>

            {mode === 'paste' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collez votre itineraire
                </label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={12}
                  placeholder={`Jour 1: Arrivee a Tokyo\n9h00 - Aeroport de Narita\n12h00 - Check-in hotel Shinjuku\n\nJour 2: Exploration de Tokyo\n8h30 - Tsukiji Fish Market\n11h00 - Senso-ji Temple`}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm font-mono resize-none"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Format attendu : &quot;Jour N: Titre&quot; suivi de &quot;HHhMM - Activite&quot;
                </p>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-gray-600 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                Retour
              </button>
              <button
                onClick={handleStep2Next}
                disabled={!canGoStep3}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white rounded-xl transition-all hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#4A67FF' }}
              >
                Continuer
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Day-by-day editor */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Planning jour par jour</h1>
              <p className="text-gray-500 mt-2">
                {days.length} jours &middot; {country.flag} {name}
              </p>
            </div>

            <div className="space-y-4">
              {days.map((day, dayIdx) => (
                <div
                  key={day.dayNumber}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  {/* Day header */}
                  <div className="flex items-center gap-4 px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ backgroundColor: '#4A67FF' }}
                    >
                      J{day.dayNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={day.title}
                        onChange={(e) => updateDay(dayIdx, 'title', e.target.value)}
                        placeholder={`Titre du jour ${day.dayNumber}`}
                        className="w-full bg-transparent text-gray-900 font-medium placeholder:text-gray-400 outline-none"
                      />
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDateDisplay(day.date)}
                      </p>
                    </div>
                  </div>

                  {/* Activities */}
                  <div className="p-6 space-y-3">
                    {day.activities.map((act, actIdx) => (
                      <div
                        key={actIdx}
                        className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100 group"
                      >
                        <div className="flex flex-col gap-2 flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={act.time}
                              onChange={(e) =>
                                updateActivity(dayIdx, actIdx, 'time', e.target.value)
                              }
                              placeholder="09:00"
                              className="w-20 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-400 bg-white"
                            />
                            <input
                              type="text"
                              value={act.name}
                              onChange={(e) =>
                                updateActivity(dayIdx, actIdx, 'name', e.target.value)
                              }
                              placeholder="Nom de l'activite"
                              className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-400 bg-white"
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              step="any"
                              value={act.lat || ''}
                              onChange={(e) =>
                                updateActivity(dayIdx, actIdx, 'lat', parseFloat(e.target.value) || 0)
                              }
                              placeholder="Latitude"
                              className="w-32 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-400 bg-white"
                            />
                            <input
                              type="number"
                              step="any"
                              value={act.lng || ''}
                              onChange={(e) =>
                                updateActivity(dayIdx, actIdx, 'lng', parseFloat(e.target.value) || 0)
                              }
                              placeholder="Longitude"
                              className="w-32 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-400 bg-white"
                            />
                            <input
                              type="text"
                              value={act.desc}
                              onChange={(e) =>
                                updateActivity(dayIdx, actIdx, 'desc', e.target.value)
                              }
                              placeholder="Description"
                              className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-400 bg-white"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removeActivity(dayIdx, actIdx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 shrink-0 mt-0.5"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => addActivity(dayIdx)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl border border-dashed border-gray-200 hover:border-blue-300 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Ajouter une activite
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-8 mb-12">
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-gray-600 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                Retour
              </button>
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/25"
                style={{ backgroundColor: '#4A67FF' }}
              >
                Creer le voyage
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
