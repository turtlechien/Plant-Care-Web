export enum LightLevel {
  FULL_SUN = 'Full Sun',
  PARTIAL_SHADE = 'Partial Shade',
  INDIRECT_LIGHT = 'Indirect Light',
  LOW_LIGHT = 'Low Light',
}

export interface SeasonLightSchedule {
  spring: string; // e.g., "09:00-15:00"
  summer: string;
  autumn: string;
  winter: string;
}

export interface Location {
  id: string;
  name: string; // e.g., "South Balcony"
  type: 'Indoor' | 'Outdoor';
  aspect: 'N' | 'S' | 'E' | 'W' | 'None';
  description?: string;
  lightSchedule: SeasonLightSchedule;
}

export interface LogEntry {
  id: string;
  date: number; // timestamp
  type: 'Fertilize' | 'Repot' | 'Prune' | 'Note';
  content?: string;
}

export interface Plant {
  id: string;
  name: string;
  nickname?: string;
  scientificName?: string;
  photoUrl?: string; // Base64 or URL
  waterFreqDays: number;
  lastWatered: number; // timestamp
  locationId: string;
  lightNeed: LightLevel;
  notes?: string;
  logs: LogEntry[];
}

export interface WeatherData {
  temp: number;
  humidity: number;
  windSpeed: number;
  conditionCode: number;
  city?: string;
}

export interface GardenData {
  id: string;
  plants: Plant[];
  locations: Location[];
  lastSync: number;
}