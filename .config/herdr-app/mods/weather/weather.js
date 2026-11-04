export const HOUR = 60 * 60 * 1000;

const locationName = (value) => typeof value === "string" ? value.trim() : "";

function temperature(value) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  if (String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function parseWeather(json, now = Date.now()) {
  const current = json?.current_condition?.[0];
  const area = json?.nearest_area?.[0];
  const city = area?.areaName?.[0]?.value;
  const tempC = temperature(current?.temp_C);
  const tempF = temperature(current?.temp_F);
  if (typeof city !== "string" || !city.trim() || tempC === null || tempF === null) {
    throw new Error("Incomplete weather response");
  }
  return {
    city: city.trim(),
    region: locationName(area?.region?.[0]?.value),
    country: locationName(area?.country?.[0]?.value),
    tempC, tempF, code: String(current.weatherCode ?? ""), fetchedAt: now,
  };
}

export function readCache(text, now = Date.now()) {
  try {
    const cached = JSON.parse(text);
    if (typeof cached?.city !== "string" || !cached.city.trim()
      || typeof cached.tempC !== "number" || !Number.isFinite(cached.tempC)
      || typeof cached.tempF !== "number" || !Number.isFinite(cached.tempF)
      || typeof cached.fetchedAt !== "number" || !Number.isFinite(cached.fetchedAt)
      || cached.fetchedAt <= 0 || cached.fetchedAt > now) return null;
    return {
      ...cached,
      region: locationName(cached.region),
      country: locationName(cached.country),
      code: String(cached.code ?? ""),
    };
  } catch {
    return null;
  }
}

export function isStale(weather, now = Date.now()) {
  return !weather || now - weather.fetchedAt >= HOUR;
}

export function weatherIcon(code) {
  switch (String(code)) {
    case "113": return "☀️";
    case "116": return "⛅";
    case "119": case "122": return "☁️";
    case "143": case "248": case "260": return "🌫️";
    case "176": case "263": case "266": case "293": case "296": case "353": return "🌦️";
    case "200": case "386": case "389": return "⛈️";
    case "227": case "230": case "320": case "323": case "326": case "329":
    case "332": case "335": case "338": case "368": case "371": case "392": case "395": return "🌨️";
    case "179": case "182": case "185": case "281": case "284": case "311":
    case "314": case "317": case "350": case "362": case "365": case "374": case "377":
    case "299": case "302": case "305": case "308": case "356": case "359": return "🌧️";
    default: return "🌡️";
  }
}
