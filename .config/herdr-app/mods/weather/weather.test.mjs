import assert from "node:assert/strict";
import { test } from "node:test";
import { HOUR, isStale, parseWeather, readCache, weatherIcon } from "./weather.js";

const now = 1793740000000;
const response = {
  nearest_area: [{
    areaName: [{ value: "Austin" }],
    region: [{ value: "Texas" }],
    country: [{ value: "United States of America" }],
  }],
  current_condition: [{ temp_C: "22", temp_F: "72", weatherCode: "113" }],
};

test("extracts the detected city, state, country, and both temperatures", () => {
  assert.deepEqual(parseWeather(response, now), {
    city: "Austin", region: "Texas", country: "United States of America",
    tempC: 22, tempF: 72, code: "113", fetchedAt: now,
  });
});

test("handles missing or blank region and country without losing the weather", () => {
  for (const metadata of [{}, { region: [{ value: "  " }], country: [{ value: null }] }]) {
    const result = parseWeather({
      ...response,
      nearest_area: [{ areaName: [{ value: "Singapore" }], ...metadata }],
    }, now);
    assert.equal(result.city, "Singapore");
    assert.equal(result.region, "");
    assert.equal(result.country, "");
  }
});

test("trims detected region and country names", () => {
  const result = parseWeather({
    ...response,
    nearest_area: [{ ...response.nearest_area[0], region: [{ value: " Texas " }], country: [{ value: " USA " }] }],
  }, now);
  assert.equal(result.region, "Texas");
  assert.equal(result.country, "USA");
});

test("accepts zero and negative temperatures", () => {
  for (const temp of ["0", "-12"]) {
    const result = parseWeather({ ...response, current_condition: [{ temp_C: temp, temp_F: "32" }] }, now);
    assert.equal(result.tempC, Number(temp));
  }
});

test("rejects missing location or invalid temperatures instead of overwriting good data", () => {
  for (const value of [undefined, null, "", " ", "bad", {}, true, Infinity]) {
    assert.throws(() => parseWeather({ ...response, current_condition: [{ temp_C: value, temp_F: "72" }] }));
    assert.throws(() => parseWeather({ ...response, current_condition: [{ temp_C: "22", temp_F: value }] }));
  }
  for (const value of [null, {}, { current_condition: response.current_condition }]) {
    assert.throws(() => parseWeather(value));
  }
});

test("restores persistent cached weather, including stale data", () => {
  const weather = parseWeather(response, now);
  assert.deepEqual(readCache(JSON.stringify(weather), now), weather);
  assert.deepEqual(readCache(JSON.stringify(weather), now + 2 * HOUR), weather);
});

test("preserves old city-only caches while location metadata is refreshed", () => {
  const { region, country, ...oldCache } = parseWeather(response, now);
  assert.deepEqual(readCache(JSON.stringify(oldCache), now), { ...oldCache, region: "", country: "" });
});

test("ignores corrupt or future-dated caches", () => {
  const weather = parseWeather(response, now);
  for (const text of [null, "{", "{}", "null", JSON.stringify({ ...weather, tempC: null }),
    JSON.stringify({ ...weather, fetchedAt: now + 1 })]) {
    assert.equal(readCache(text, now), null);
  }
});

test("weather expires exactly after one hour", () => {
  const weather = parseWeather(response, now);
  assert.equal(isStale(weather, now + HOUR - 1), false);
  assert.equal(isStale(weather, now + HOUR), true);
  assert.equal(isStale(null, now), true);
});

test("uses the prompt's weather icons with a safe fallback", () => {
  for (const [code, icon] of [[113, "☀️"], [116, "⛅"], [119, "☁️"], [248, "🌫️"],
    [296, "🌦️"], [389, "⛈️"], [335, "🌨️"], [302, "🌧️"], ["unknown", "🌡️"]]) {
    assert.equal(weatherIcon(code), icon);
  }
});
