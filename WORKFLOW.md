# Daily Workflow

[Overview](README.md) · [Keyboard shortcuts](KEYBOARD_SHORTCUTS.md) · [Setup and maintenance](SETUP.md)

## Keyboard cheat sheet

**Hyper** means holding Caps Lock with the configured Karabiner profile. It sends Command+Control+Option+Shift. Hyper shortcuts below are defined in Ghostty and intended for a focused Herdr session.

**Prefix** means press **Ctrl+B**, release, then press the next key/chord.

| Shortcut | Action |
| --- | --- |
| **Hyper+O** | Open the agent chooser. Herdr equivalent: prefix, **Ctrl+O**. |
| **Hyper+U** | Open the URL chooser for the focused pane. Herdr equivalent: prefix, **Shift+O**. |
| **Hyper+W** | Configured for workspace navigation, but unresolved on this machine; use prefix, **W**. |
| **Option+Shift+J / K** | Next / previous Herdr workspace. |
| Prefix, **C** | New tab, without a naming prompt. |
| Prefix, **N / P** | Next / previous tab. |
| Prefix, **V** | Split into side-by-side panes. |
| Prefix, **-** | Split into stacked panes. |
| Prefix, **H / J / K / L** | Focus the pane left / down / up / right. |
| Prefix, **Z** | Toggle focused-pane zoom. |
| Prefix, **W** | Workspace navigation. |
| Prefix, **B** | Toggle sidebar. |
| Prefix, **Q** | Detach; leave terminals and agents running. |
| Prefix, **Shift+R** | Reload Herdr configuration. |
| **Cmd+Shift+,** | Reload Ghostty configuration. |

Hyper+O is deliberate: Hyper+C is assigned to clearing notifications in SuperCharge on this machine.

## Workspaces and persistence

For everyday use, keep one Herdr session and create a workspace per project.
The hierarchy is **session → workspace → tab → pane**:

- **Session**: the background server holding a collection of workspaces.
- **Workspace**: a project or task, such as `dotfiles` or an API repository.
- **Tab**: a view within that project, such as `coding`, `logs`, or `review`.
- **Pane**: an individual terminal running an agent, shell, or server.

Use a named session when you want an independent set of terminals and agents,
with its own socket and saved runtime state. For example, `work` and `personal`
sessions can be attached to and stopped independently. Sessions do not isolate
files, Git changes, or credentials; use the account wrappers for agent logins.
Opening another terminal window does not require another session: multiple
clients can attach to the same session and view different tabs or workspaces.

From a shell **outside Herdr**, `herdr` attaches to the default session, and
`herdr session attach work` creates or attaches to the named `work` session.
Use `herdr session list` to see your sessions. Avoid nesting Herdr clients.
See [Herdr's concepts](https://herdr.dev/docs/concepts/) for the runtime model.

Use a workspace per project, tabs for different views, and panes for the agent, shell, and development server. A workspace is a terminal container, not a separate Git checkout.

Start or reattach with `herdr`. To step away, use prefix, **Q**, instead of `/exit` in each agent. Running `herdr` again reconnects to the live server and its workspaces.

The host must stay awake for local work to continue. A reboot ends the original processes; Herdr can restore layout and resume supported agent conversations through its integrations. Screen-history persistence is not enabled in this configuration.

## Finding shortcuts without memorizing them

The existing tab bar shows **Ctrl+B ? shortcuts**. Press **Ctrl+B**, release,
then **?** to open Herdr's live list of active keybindings. Press **/** there
to search, for example for `rename`, `tab`, or `split`.

Start with **prefix, C** for a new tab and **prefix, Shift+T** to rename it.
Right-click a tab, workspace, or pane to find its actions by mouse; drag pane
borders to resize. **Prefix, Z** temporarily zooms the focused pane, and the
same shortcut restores the layout. **Prefix, [** opens copy mode for searching
and selecting terminal history.

Herdr 0.9.5 supports formatting existing sidebar agent/workspace rows, but has
no supported configuration or plugin surface for a standalone sidebar help
section. The tab-bar reminder uses an existing row and leaves terminal space
available; on narrow windows Herdr gives tabs priority over the reminder.

## Markdown in Herdr App

The desktop app's `my-main` toolbar shows clock buttons ordered west to east:
San Francisco, Phoenix, Corpus Christi, NYC, Barcelona, and Dubai, immediately
left of the **+** button. They use 24-hour time,
refresh each minute, and follow daylight saving rules automatically. Hover
or click a clock for its local date and timezone. The personal `world-clock-tabs`
mod uses local Python 3.9+ and system timezone data; no network service is needed.
Sun icons indicate 06:00–17:59 local time, and moon icons indicate 18:00–05:59;
these are local-hours indicators, not calculated sunrise or sunset times.

In the desktop `herdr-app`, the personal `my-main` layout uses the
`glow-files` mod for its **Files** panel. Click a `.md` or `.markdown` file
(case-insensitive) to open Glow in a new pane to the right of the focused pane. Other files
still open in the panel's read-only source preview.

Glow uses the light or dark style matching Herdr when the pane opens, with
an 80-column wrap width. Press `?` inside Glow for navigation help and `q`
to leave the viewer; close the pane when finished. Each click opens a new pane.
For remote spaces, Glow must be installed on that machine's PATH too.

The personal mod is cloned from Herdr's Files mod and survives app updates;
it does not automatically inherit future changes to the shipped Files mod.
To restore the stock preview, change the `files` block's `content.mod` from
`glow-files` to `files` in `.config/herdr-app/layouts/my-main.json`.

## Agent chooser

Press **Hyper+O**:

- **Attention** lists blocked or finished agents, newest state changes first.
- **Working** lists agents still running; **All** includes idle agents too.
- **Tab / Shift+Tab** cycles views; type to filter.
- **Enter** focuses the selected agent; **Esc** closes the popup.
- **Ctrl+R** refreshes. The picker also refreshes periodically while open.

Status labels include `! blocked`, `✓ done`, `▶ working`, and `○ idle`, so color is not the only cue.

## URL chooser

Press **Hyper+U** to extract URLs from the focused pane's recent output (roughly a screenful):

- A single unambiguous URL opens directly in the default browser.
- With multiple URLs, type to filter, **Enter** to open, or **Y** to copy.
- **Esc** closes the picker. If no URLs are found, press any key to close the message.

The script attempts to join wrapped links and asks you to verify reconstructed candidates when it cannot confirm them. This is a text-based URL finder, not a search of every link in the agent's conversation history.

## Ghostty appearance and configuration

The primary config is [`.config/ghostty/config`](.config/ghostty/config), linked as `~/.config/ghostty/config`. It selects Menlo, GitHub Dark Colorblind, extra row spacing and padding, and a short cursor-warp animation.

Ghostty can also load `~/Library/Application Support/com.mitchellh.ghostty/config`. **Cmd+,** may open that file rather than the dotfiles copy. The macOS-specific location loads after the XDG location, so check both when settings disagree.

```fish
# See available font family names and the effective configuration.
ghostty +list-fonts
ghostty +show-config
ghostty +validate-config
```

Use a font's family name in `font-family`, not its Homebrew cask name. Reload with **Cmd+Shift+,**; padding changes require a new terminal surface. To remove the cursor animation, comment out `custom-shader` and reload.

## Herdr notifications and plugins

The config uses in-app agent notifications, distinct status symbols, and automatic copy-on-select. Agent notification sounds and Herdr's clipboard popup are disabled. The sidebar is capped at 20 columns. Other applications, including an agent TUI, can still show their own copy notifications.

Plugin source lives under `.config/herdr/plugins/local/`; registration lives outside version control. If a chooser is missing on another machine, follow [plugin setup](SETUP.md#8-enable-the-herdr-workflow).

```fish
herdr plugin list
herdr plugin log list --plugin agent-chooser --limit 5
herdr plugin log list --plugin url-chooser --limit 5
```

If a Hyper shortcut triggers a different app, check global shortcuts in tools such as SuperCharge. Try the Herdr prefix shortcut to distinguish a keyboard conflict from a plugin error.
