// A cheat sheet of the keys worth practicing, for the sidebar. Keys come from keys.json, so a rebind shows here.

import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { keys, layout, theme } from "herdr";

// [label, what to show]: "a" one action, ["a", "b"] a pair, { range: ["a", "b"] } first to last digit,
// { arrows: "a" } the modifiers of an action, then every arrow.
const SHEET = [
  ["Agents", [
    ["Next / previous", ["agent.next", "agent.prev"]],
  ]],
  ["Spaces", [
    ["New", "space.new"],
    ["Next / previous", ["space.next", "space.prev"]],
    ["Go to", { range: ["space.select:1", "space.select:9"] }],
    ["Rename", "space.rename"],
  ]],
  ["Tabs", [
    ["New", "tab.new"],
    ["Close", "tab.close"],
    ["Next / previous", ["tab.next", "tab.prev"]],
    ["Go to", { range: ["tab.select:1", "tab.select:9"] }],
    ["Rename", "tab.rename"],
  ]],
  ["Panes", [
    ["Split right", "pane.split:right"],
    ["Split down", "pane.split:down"],
    ["Close", "pane.close"],
    ["Zoom", "pane.zoom"],
    ["Focus", { arrows: "pane.go:left" }],
    ["Swap", { arrows: "pane.swap:left" }],
  ]],
  ["App", [
    ["Commands", "app.palette"],
    ["Find", "mod.open:picker"],
    ["Sidebar", "layout.toggle:sidebar"],
    ["All keys", "app.help"],
  ]],
];

const MODS = [["ctrl", "⌃"], ["alt", "⌥"], ["shift", "⇧"], ["cmd", "⌘"]];
const NAMED = { left: "←", right: "→", up: "↑", down: "↓", tab: "⇥", enter: "↩", backspace: "⌫", escape: "⎋" };
const ARROWS = "←↑↓→";

function glyphs(stroke) {
  const parts = stroke.split("-");
  let key = parts.pop();
  if (key === "") { key = "-"; parts.pop(); }
  const held = MODS.filter(([m]) => parts.includes(m)).map(([, g]) => g).join("");
  return held + (NAMED[key] ?? key.toUpperCase());
}

function show(what, bound) {
  const one = (action) => {
    const stroke = bound.get(action);
    return stroke ? glyphs(stroke) : null;
  };
  if (typeof what === "string") return one(what);
  if (Array.isArray(what)) {
    const pair = what.map(one);
    return pair.every(Boolean) ? pair.join(" ") : null;
  }
  if (what.range) {
    const [first, last] = what.range.map(one);
    return first && last ? `${first}–${last.slice(-1)}` : null;
  }
  const first = one(what.arrows);
  return first ? first.slice(0, -1) + ARROWS : null;
}

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

export default class KeySheet extends View {
  render() {
    const t = theme();
    const root = v_flex().id("key-sheet-root").size_full().min_h(0).bg(t.chrome).border_t(1).border_color(t.border);
    // Folded to the icon rail, there's no room to read it.
    if ((find(layout(), "sidebar")?.size?.px ?? Infinity) < 160) return root;

    const bound = new Map();
    for (const k of keys()) {
      if (k.section === "global" && !bound.has(k.action) && k.keys.trim()) bound.set(k.action, k.keys.trim().split(/\s+/)[0]);
    }
    const row = ([label, what]) => {
      const stroke = show(what, bound);
      if (!stroke) return null;
      return h_flex().h(17).flex_none().gap(8).items_center().justify_between().text_size(12)
        .child(div().min_w(0).truncate().text_color(t.muted).child(label))
        .child(div().flex_none().text_color(t.foreground).child(stroke));
    };
    return root
      .child(h_flex().id("key-sheet-heading").h(31).flex_none().pl(16).pr(10).items_center()
        .text_size(12).font_medium().text_color(t.muted).child("Keys"))
      .child(v_flex().id("key-sheet-list").flex_1().min_h(0).px(16).pb(8).overflow_y_scroll()
        .children(SHEET.flatMap(([group, rows]) => [
          div().h(18).flex_none().flex().items_end().text_size(11).font_medium().text_color(t.dim).child(group),
          ...rows.map(row).filter(Boolean),
        ])));
  }
}
