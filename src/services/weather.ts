import { WeatherData } from '@/types';

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const PARIS_LAT = 48.8566;
const PARIS_LON = 2.3522;

export async function fetchWeather(): Promise<WeatherData | null> {
  if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === 'your_openweather_api_key_here') {
    console.warn('OpenWeather API key not configured. Weather data will not be available.');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${PARIS_LAT}&lon=${PARIS_LON}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=fr`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const data = await response.json();

    return {
      temp: Math.round(data.main.temp),
      condition: data.weather[0].description,
      humidity: data.main.humidity,
      wind: Math.round(data.wind.speed * 3.6), // m/s to km/h
      icon: data.weather[0].icon,
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

export function getWeatherEmoji(condition: string): string {
  const conditionLower = condition.toLowerCase();
  
  if (conditionLower.includes('soleil') || conditionLower.includes('clair')) return '☀️';
  if (conditionLower.includes('nuage')) return '☁️';
  if (conditionLower.includes('pluie')) return '🌧️';
  if (conditionLower.includes('orage')) return '⛈️';
  if (conditionLower.includes('neige')) return '❄️';
  if (conditionLower.includes('brouillard') || conditionLower.includes('brume')) return '🌫️';
  
  return '🌤️';
}
