import assert from "node:assert/strict";
import { test } from "node:test";
import { displayFolder, spaceFolder } from "./folders.js";

const space = { folder: "/original", tabs: [{ id: "tab1" }, { id: "tab2", active: true }] };
const panes = [
  { tab: "other", terminal: "other", cwd: "/other", focused: true },
  { tab: "tab1", terminal: "t1", cwd: "/first" },
  { tab: "tab2", terminal: "t2", cwd: "/current" },
  { tab: "tab2", terminal: "t3", cwd: "/split" },
];

test("uses the active tab's live folder instead of the space's original folder", () => {
  assert.equal(spaceFolder(space, panes), "/current");
});

test("prefers the focused terminal in a split tab", () => {
  assert.equal(spaceFolder(space, panes.map((pane) => ({ ...pane, focused: pane.terminal === "t3" }))), "/split");
});

test("updates when a terminal changes directory", () => {
  assert.equal(spaceFolder(space, panes.map((pane) => pane.terminal === "t2" ? { ...pane, cwd: "/new" } : pane)), "/new");
});

test("falls back to another terminal, then the original folder", () => {
  assert.equal(spaceFolder(space, panes.filter((pane) => pane.tab !== "tab2")), "/first");
  assert.equal(spaceFolder(space, []), "/original");
  assert.equal(spaceFolder({}, []), "");
});

test("ignores mod panes and terminals without a current folder", () => {
  assert.equal(spaceFolder(space, [
    { tab: "tab2", terminal: null, focused: true, cwd: "/mod" },
    { tab: "tab2", terminal: "empty", cwd: null },
  ]), "/original");
});

test("shortens only the local home directory, on a path boundary", () => {
  assert.equal(displayFolder("/Users/vluther/dotfiles", "/Users/vluther"), "~/dotfiles");
  assert.equal(displayFolder("/Users/vluther", "/Users/vluther/"), "~");
  assert.equal(displayFolder("/Users/vluther-other/repo", "/Users/vluther"), "/Users/vluther-other/repo");
  assert.equal(displayFolder("/Users/vluther/repo", "/Users/vluther", true), "/Users/vluther/repo");
  assert.equal(displayFolder("/srv/project", "/Users/vluther"), "/srv/project");
  assert.equal(displayFolder("", "/Users/vluther"), "Folder unavailable");
});
