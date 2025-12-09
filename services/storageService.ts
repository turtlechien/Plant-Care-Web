import { GardenData, Plant, Location } from '../types';
import { DEFAULT_LOCATIONS } from '../constants';

const STORAGE_KEY = 'plantcare_garden_data';

const generateId = () => Math.random().toString(36).substr(2, 9);
const generateGardenId = () => Math.random().toString(36).substr(2, 8).toUpperCase();

export const getGardenData = (): GardenData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Initialize new garden
  const newGarden: GardenData = {
    id: generateGardenId(),
    plants: [],
    locations: DEFAULT_LOCATIONS,
    lastSync: Date.now(),
  };
  saveGardenData(newGarden);
  return newGarden;
};

export const saveGardenData = (data: GardenData) => {
  data.lastSync = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const importGarden = (gardenId: string): boolean => {
  // In a real app, this would fetch from Firestore.
  // Here we just mock a success or check if the local ID matches (simulating).
  console.log(`Attempting to import garden: ${gardenId}`);
  return true; // Mock success
};

export const createPlant = (plant: Omit<Plant, 'id' | 'logs'>): Plant => {
  const garden = getGardenData();
  const newPlant: Plant = {
    ...plant,
    id: generateId(),
    logs: [],
  };
  garden.plants.push(newPlant);
  saveGardenData(garden);
  return newPlant;
};

export const updatePlant = (plant: Plant) => {
  const garden = getGardenData();
  const index = garden.plants.findIndex((p) => p.id === plant.id);
  if (index !== -1) {
    garden.plants[index] = plant;
    saveGardenData(garden);
  }
};

export const deletePlant = (plantId: string) => {
  const garden = getGardenData();
  garden.plants = garden.plants.filter((p) => p.id !== plantId);
  saveGardenData(garden);
};

export const createLocation = (location: Omit<Location, 'id'>): Location => {
  const garden = getGardenData();
  const newLoc: Location = { ...location, id: generateId() };
  garden.locations.push(newLoc);
  saveGardenData(garden);
  return newLoc;
};

export const updateLocation = (location: Location) => {
  const garden = getGardenData();
  const index = garden.locations.findIndex((l) => l.id === location.id);
  if (index !== -1) {
    garden.locations[index] = location;
    saveGardenData(garden);
  }
};

export const deleteLocation = (locationId: string) => {
  const garden = getGardenData();
  garden.locations = garden.locations.filter((l) => l.id !== locationId);
  // Also optionally handle plants in this location (e.g., move to default or unassigned), 
  // currently we just keep them but they might have invalid locIds.
  saveGardenData(garden);
};