import { WeatherData } from '@/types';

const PARIS_LAT = 48.8566;
const PARIS_LON = 2.3522;

// Codes météo WMO pour Open-Meteo
// https://open-meteo.com/en/docs
const WMO_WEATHER_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: 'Ciel dégagé', icon: '01d' },
  1: { description: 'Principalement dégagé', icon: '02d' },
  2: { description: 'Partiellement nuageux', icon: '03d' },
  3: { description: 'Couvert', icon: '04d' },
  45: { description: 'Brouillard', icon: '50d' },
  48: { description: 'Brouillard givrant', icon: '50d' },
  51: { description: 'Bruine légère', icon: '09d' },
  53: { description: 'Bruine modérée', icon: '09d' },
  55: { description: 'Bruine dense', icon: '09d' },
  56: { description: 'Bruine verglaçante légère', icon: '09d' },
  57: { description: 'Bruine verglaçante dense', icon: '09d' },
  61: { description: 'Pluie légère', icon: '10d' },
  63: { description: 'Pluie modérée', icon: '10d' },
  65: { description: 'Pluie forte', icon: '10d' },
  66: { description: 'Pluie verglaçante légère', icon: '13d' },
  67: { description: 'Pluie verglaçante forte', icon: '13d' },
  71: { description: 'Neige légère', icon: '13d' },
  73: { description: 'Neige modérée', icon: '13d' },
  75: { description: 'Neige forte', icon: '13d' },
  77: { description: 'Grains de neige', icon: '13d' },
  80: { description: 'Averses légères', icon: '09d' },
  81: { description: 'Averses modérées', icon: '09d' },
  82: { description: 'Averses violentes', icon: '09d' },
  85: { description: 'Averses de neige légères', icon: '13d' },
  86: { description: 'Averses de neige fortes', icon: '13d' },
  95: { description: 'Orage', icon: '11d' },
  96: { description: 'Orage avec grêle légère', icon: '11d' },
  99: { description: 'Orage avec grêle forte', icon: '11d' },
};

export async function fetchWeather(): Promise<WeatherData | null> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${PARIS_LAT}&longitude=${PARIS_LON}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Europe/Paris`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch weather data from Open-Meteo');
    }

    const data = await response.json();
    const current = data.current;

    // Obtenir la description météo depuis le code WMO
    const weatherCode = current.weather_code || 0;
    const weatherInfo = WMO_WEATHER_CODES[weatherCode] || WMO_WEATHER_CODES[0];

    return {
      temp: Math.round(current.temperature_2m),
      condition: weatherInfo.description,
      humidity: Math.round(current.relative_humidity_2m),
      wind: Math.round(current.wind_speed_10m), // déjà en km/h
      icon: weatherInfo.icon,
    };
  } catch (error) {
    console.error('Error fetching weather from Open-Meteo:', error);
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
