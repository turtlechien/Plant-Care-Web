import { Location, LightLevel } from './types';

export const DEFAULT_LOCATIONS: Location[] = [
  {
    id: 'loc_living_room',
    name: 'Living Room',
    type: 'Indoor',
    aspect: 'S',
    description: 'Bright indirect light near window',
    lightSchedule: {
      spring: '10:00-14:00',
      summer: '09:00-16:00',
      autumn: '10:00-14:00',
      winter: '11:00-13:00',
    },
  },
  {
    id: 'loc_balcony',
    name: 'Balcony',
    type: 'Outdoor',
    aspect: 'E',
    description: 'Morning sun',
    lightSchedule: {
      spring: '07:00-11:00',
      summer: '06:00-12:00',
      autumn: '07:00-11:00',
      winter: '08:00-10:00',
    },
  },
];

export const MOCK_WEATHER = {
  temp: 24,
  humidity: 65,
  windSpeed: 12,
  conditionCode: 0,
};

// Map WMO Weather codes to descriptions/icons logic if needed
export const getWeatherDescription = (code: number) => {
  if (code === 0) return 'Clear sky';
  if (code < 3) return 'Partly cloudy';
  if (code < 50) return 'Foggy';
  if (code < 80) return 'Rainy';
  return 'Stormy';
};