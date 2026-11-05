import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { exec, layout, theme } from "herdr";
import { HOUR, isStale, parseWeather, readCache, weatherIcon } from "./weather.js";

const CACHE_KEY = "weather.v2";

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

export default class Weather extends View {
  init(_props, cx) {
    this.weather = readCache(localStorage.getItem(CACHE_KEY));
    const upgrade = !this.weather;
    this.weather ??= readCache(localStorage.getItem("weather.v1"));
    this.failed = false;
    this.busy = false;
    if (upgrade || isStale(this.weather)) this.refresh(cx);
    else cx.timer.after(Math.max(1, this.weather.fetchedAt + HOUR - Date.now()), (cx) => this.refresh(cx));
  }

  refresh(cx) {
    if (this.busy) return;
    this.busy = true;
    cx.notify();
    cx.spawn(async (cx) => {
      try {
        const result = await exec("curl", [
          "-fsS", "--connect-timeout", "5", "--max-time", "10", "--", "https://wttr.in/?format=j1",
        ]);
        if (result.code !== 0) throw new Error("Weather request failed");
        this.weather = parseWeather(JSON.parse(result.stdout));
        this.failed = false;
        localStorage.setItem(CACHE_KEY, JSON.stringify(this.weather));
      } catch {
        this.failed = true;
      } finally {
        this.busy = false;
        cx.notify();
        cx.timer.after(HOUR, (cx) => this.refresh(cx));
      }
    });
  }

  render() {
    const t = theme();
    const weather = this.weather;
    const stale = weather && (this.failed || isStale(weather));
    const icon = weather ? weatherIcon(weather.code) : "🌡️";
    const area = [weather?.region, weather?.country].filter(Boolean).join(" · ");
    const location = [weather?.city, weather?.region, weather?.country].filter(Boolean).join(", ");
    const root = v_flex().id("weather-root").size_full().min_w(0).bg(t.chrome)
      .text_size(12);
    if ((find(layout(), "sidebar")?.size?.px ?? Infinity) < 160) {
      return root.items_center().justify_center().text_size(18).text_color(stale ? t.dim : t.foreground).child(icon);
    }
    return root.px(12).justify_center().items_center().gap(5)
      .child(div().id("weather-location").w_full().min_w(0).truncate().text_center()
        .font_semibold().text_size(13).text_color(t.foreground)
        .tooltip(location || "Detected from your public IP")
        .child(weather?.city ?? (this.failed ? "Location unavailable" : "Locating…")))
      .when(Boolean(area), (el) => el.child(div().id("weather-region").w_full().min_w(0)
        .truncate().text_center().text_size(11.5).text_color(t.dim).tooltip(location).child(area)))
      .child(h_flex().w_full().min_w(0).gap(7).justify_center().items_center()
        .child(div().flex_none().text_size(16).child(icon))
        .child(div().min_w(0).truncate().font_medium().text_size(14)
          .text_color(stale || !weather ? t.dim : t.muted)
          .child(weather
            ? `${weather.tempC}°C · ${weather.tempF}°F${stale ? " · stale" : ""}`
            : this.failed ? "Weather unavailable" : "Loading weather…")));
  }
}
