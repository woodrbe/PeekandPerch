/**
 * Dynamic Weather Service powered by Open-Meteo (free, no API key required).
 * Provides real-time and historical hourly weather lookups by location, date, and time.
 */

export interface WeatherLookupParams {
  latitude: number;
  longitude: number;
  date: string; // YYYY-MM-DD
  time?: string; // e.g. "08:30 AM", "6:49 AM", "14:30"
  timezone?: string; // e.g. "America/Chicago"
}

export interface WeatherResult {
  weather: string; // e.g. "Partly Cloudy, 55°F"
  temperature: string; // e.g. "55°F"
  condition: string; // e.g. "Partly Cloudy"
  code: number;
  icon?: string;
}

export interface GeocodedLocation {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
  timezone?: string;
}

export const WMO_WEATHER_MAP: Record<number, { condition: string; icon: string }> = {
  0: { condition: 'Sunny', icon: '☀️' },
  1: { condition: 'Mainly Clear', icon: '🌤️' },
  2: { condition: 'Partly Cloudy', icon: '⛅' },
  3: { condition: 'Overcast', icon: '☁️' },
  45: { condition: 'Foggy', icon: '🌫️' },
  48: { condition: 'Depositing Rime Fog', icon: '🌫️' },
  51: { condition: 'Light Drizzle', icon: '🌦️' },
  53: { condition: 'Moderate Drizzle', icon: '🌧️' },
  55: { condition: 'Dense Drizzle', icon: '🌧️' },
  56: { condition: 'Light Freezing Drizzle', icon: '🌨️' },
  57: { condition: 'Dense Freezing Drizzle', icon: '🌨️' },
  61: { condition: 'Light Rain', icon: '🌦️' },
  63: { condition: 'Moderate Rain', icon: '🌧️' },
  65: { condition: 'Heavy Rain', icon: '🌧️' },
  66: { condition: 'Light Freezing Rain', icon: '🌨️' },
  67: { condition: 'Heavy Freezing Rain', icon: '🌨️' },
  71: { condition: 'Light Snow', icon: '🌨️' },
  73: { condition: 'Moderate Snow', icon: '❄️' },
  75: { condition: 'Heavy Snow', icon: '❄️' },
  77: { condition: 'Snow Grains', icon: '❄️' },
  80: { condition: 'Light Rain Showers', icon: '🌦️' },
  81: { condition: 'Moderate Rain Showers', icon: '🌧️' },
  82: { condition: 'Violent Rain Showers', icon: '⛈️' },
  85: { condition: 'Light Snow Showers', icon: '🌨️' },
  86: { condition: 'Heavy Snow Showers', icon: '❄️' },
  95: { condition: 'Thunderstorm', icon: '⚡' },
  96: { condition: 'Thunderstorm with Hail', icon: '⛈️' },
  99: { condition: 'Severe Thunderstorm with Hail', icon: '⛈️' },
};

export class WeatherService {
  // In-memory cache for hourly day forecasts: key = `${lat.toFixed(4)}_${lon.toFixed(4)}_${date}_${tz}`
  private static hourlyCache = new Map<string, { times: string[]; temps: number[]; codes: number[] }>();

  public static async geocodeLocation(query: string): Promise<GeocodedLocation | null> {
    if (!query || !query.trim()) return null;
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=1&language=en&format=json`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      if (data && Array.isArray(data.results) && data.results.length > 0) {
        const top = data.results[0];
        return {
          name: top.name,
          latitude: top.latitude,
          longitude: top.longitude,
          admin1: top.admin1,
          country: top.country,
          timezone: top.timezone,
        };
      }
      return null;
    } catch (e) {
      console.warn('Geocoding error:', e);
      return null;
    }
  }

  public static parseHourFromTime(timeStr?: string): number {
    if (!timeStr) return 12;
    const clean = timeStr.trim();
    const m = clean.match(/^(\d{1,2}):(\d{2})(\s*(?:AM|PM|am|pm))?/i);
    if (m) {
      let hh = parseInt(m[1], 10);
      const ampm = m[3] ? m[3].trim().toUpperCase() : null;
      if (ampm === 'PM' && hh < 12) hh += 12;
      if (ampm === 'AM' && hh === 12) hh = 0;
      return Math.min(23, Math.max(0, hh));
    }
    return 12;
  }

  public static async fetchHourlyForDate(
    latitude: number,
    longitude: number,
    date: string,
    timezone: string = 'America/Chicago'
  ): Promise<{ times: string[]; temps: number[]; codes: number[] } | null> {
    const key = `${latitude.toFixed(4)}_${longitude.toFixed(4)}_${date}_${timezone}`;
    if (this.hourlyCache.has(key)) {
      return this.hourlyCache.get(key)!;
    }

    // Determine if date is in the past (> 85 days ago) or recent/forecast
    const targetDate = new Date(date + 'T12:00:00Z');
    const now = new Date();
    const diffDays = (now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24);

    let baseUrl = 'https://api.open-meteo.com/v1/forecast';
    if (diffDays > 85) {
      baseUrl = 'https://archive-api.open-meteo.com/v1/archive';
    }

    try {
      const url = `${baseUrl}?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=${encodeURIComponent(timezone)}&start_date=${date}&end_date=${date}`;
      const res = await fetch(url);
      if (!res.ok) {
        // If forecast endpoint failed, try archive as fallback
        if (baseUrl.includes('forecast')) {
          const fallbackUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=${encodeURIComponent(timezone)}&start_date=${date}&end_date=${date}`;
          const fRes = await fetch(fallbackUrl);
          if (fRes.ok) {
            const fData = await fRes.json();
            if (fData?.hourly?.time) {
              const entry = {
                times: fData.hourly.time,
                temps: fData.hourly.temperature_2m,
                codes: fData.hourly.weather_code,
              };
              this.hourlyCache.set(key, entry);
              return entry;
            }
          }
        }
        return null;
      }

      const data = await res.json();
      if (data?.hourly?.time) {
        const entry = {
          times: data.hourly.time,
          temps: data.hourly.temperature_2m,
          codes: data.hourly.weather_code,
        };
        this.hourlyCache.set(key, entry);
        return entry;
      }
      return null;
    } catch (e) {
      console.warn(`Failed to fetch weather for date ${date}:`, e);
      return null;
    }
  }

  public static async getWeatherForDateTime(params: WeatherLookupParams): Promise<WeatherResult> {
    const { latitude, longitude, date, time, timezone = 'America/Chicago' } = params;
    const hour = this.parseHourFromTime(time);
    const hourly = await this.fetchHourlyForDate(latitude, longitude, date, timezone);

    if (!hourly || !hourly.temps || hourly.temps.length === 0) {
      // Fallback
      return {
        weather: 'Sunny & Pleasant, 72°F',
        temperature: '72°F',
        condition: 'Sunny & Pleasant',
        code: 0,
        icon: '☀️',
      };
    }

    // Match exact hour
    const hourPad = String(hour).padStart(2, '0');
    const isoTarget = `${date}T${hourPad}:00`;
    let index = hourly.times.indexOf(isoTarget);
    if (index === -1) {
      index = Math.min(hour, hourly.temps.length - 1);
    }

    const tempVal = hourly.temps[index];
    const roundedTemp = Math.round(typeof tempVal === 'number' ? tempVal : 72);
    const code = hourly.codes[index] ?? 0;
    const wmoInfo = WMO_WEATHER_MAP[code] || { condition: 'Pleasant', icon: '🌤️' };

    // At night (before 6 AM or after 8 PM), adjust sunny to clear sky
    let condition = wmoInfo.condition;
    if ((hour < 6 || hour >= 20) && condition === 'Sunny') {
      condition = 'Clear Sky';
    }

    return {
      weather: `${condition}, ${roundedTemp}°F`,
      temperature: `${roundedTemp}°F`,
      condition,
      code,
      icon: wmoInfo.icon,
    };
  }
}
