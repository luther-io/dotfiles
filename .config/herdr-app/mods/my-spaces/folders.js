export function spaceFolder(space, panes) {
  const tabs = new Set((space.tabs ?? []).map((tab) => tab.id));
  const terminals = panes.filter((pane) => tabs.has(pane.tab) && pane.terminal && pane.cwd);
  const activeTab = space.tabs?.find((tab) => tab.active)?.id;
  return terminals.find((pane) => pane.focused)?.cwd
    || terminals.find((pane) => pane.tab === activeTab)?.cwd
    || terminals[0]?.cwd
    || space.folder
    || "";
}

export function displayFolder(folder, home, remote = false) {
  if (!folder) return "Folder unavailable";
  if (!remote && home) {
    const prefix = home.replace(/\/+$/, "");
    if (folder === prefix) return "~";
    if (folder.startsWith(`${prefix}/`)) return `~${folder.slice(prefix.length)}`;
  }
  return folder;
}
