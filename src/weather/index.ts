export type Weather = "sun" | "rain";

export interface WeatherProfile {
  grip: number;
  braking: number;
  visibility: number;
  label: string;
}

const PROFILES: Record<Weather, Readonly<WeatherProfile>> = {
  sun: { grip: 1, braking: 7, visibility: 220, label: "Sol" },
  rain: { grip: 0.6, braking: 4.8, visibility: 115, label: "Lluvia" },
};

export function parseWeather(value: unknown): Weather {
  if (value === "sun" || value === "rain") return value;
  throw new Error("Clima no disponible");
}

export function weatherProfile(weather: Weather): WeatherProfile {
  return { ...PROFILES[parseWeather(weather)] };
}
