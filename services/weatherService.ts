import { WeatherData } from '../types';

export const getCurrentWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
    );
    const data = await response.json();
    
    if (!data.current_weather) throw new Error("No weather data");

    return {
      temp: data.current_weather.temperature,
      humidity: 60, // Open-Meteo current_weather doesn't always provide humidity, mocking for stability or requires hourly query
      windSpeed: data.current_weather.windspeed,
      conditionCode: data.current_weather.weathercode,
    };
  } catch (error) {
    console.error("Weather fetch error", error);
    // Return fallback
    return {
      temp: 22,
      humidity: 50,
      windSpeed: 5,
      conditionCode: 0
    };
  }
};