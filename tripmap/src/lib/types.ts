export interface Trip {
  id: string;
  name: string;
  country: string;
  flag: string;
  startDate: string;
  endDate: string;
  destinations: Destination[];
  days: DayData[];
  phases: Phase[];
  createdAt: string;
}

export interface Destination {
  id: number;
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  days: string;
  dayNums: number[];
  phase: number;
  description: string;
  highlights: string[];
  image: string;
}

export interface DayData {
  dayNumber: number;
  title: string;
  description: string;
  date: string;
  activities: Activity[];
  restaurants?: Restaurant[];
  tabelogRestaurants?: Restaurant[];
}

export interface Activity {
  id: string;
  time: string;
  period: string;
  name: string;
  query: string;
  lat: number;
  lng: number;
  desc: string;
}

export interface Restaurant {
  id: string;
  name: string;
  query: string;
  lat: number;
  lng: number;
  cuisine: string;
  priceRange: string;
  desc: string;
  tabelogUrl?: string;
  tabelogRating?: number;
  label?: string;
}

export interface Phase {
  id: number;
  name: string;
  color: string;
  days: string;
  icon: string;
}
