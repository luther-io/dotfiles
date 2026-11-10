# Dotfiles

My macOS development environment: shell tools, terminal workspaces, coding agents, editor preferences, and keyboard shortcuts. The Nix flake targets Apple Silicon (`aarch64-darwin`).

- **[Setup and maintenance](SETUP.md)** — installation, another macOS account, authentication, and updates.
- **[Daily workflow](WORKFLOW.md)** — Herdr, chooser shortcuts, Ghostty, and troubleshooting config changes.
- **[Keyboard shortcuts](KEYBOARD_SHORTCUTS.md)** — quick Herdr cheat sheet and daily workflows.

## How it fits together

```text
Karabiner: Caps Lock → Hyper
             ↓
Ghostty: fonts, colors, rendering, Hyper shortcuts
             ↓
Herdr: persistent workspaces → tabs → terminal panes
             ↓
OpenCode / Claude Code / other CLIs, shells, and development servers
```

Ghostty renders the terminal. Herdr keeps its terminal processes running when the client detaches and organizes projects into workspaces. The agents run as their normal CLIs inside those panes. Workspace organization does not isolate Git changes.

## What's in this repository

| Location | Purpose |
| --- | --- |
| [`flake.nix`](flake.nix), [`flake.lock`](flake.lock) | Pinned Nix/Home Manager inputs and per-account configurations. |
| [`.config/home-manager/home.nix`](.config/home-manager/home.nix) | CLI tools, fish shell/functions, Starship prompt, SSH, Git authentication/signing, and Nerd Fonts. |
| [`Brewfile`](Brewfile) | Homebrew packages, apps, fonts, and other Bundle-managed tools. |
| [`.stowrc`](.stowrc) | Links repo-managed dotfiles into `$HOME`; excludes documentation and Home Manager's Git config. |
| [`.config/ghostty/`](.config/ghostty/) | Menlo font, GitHub Dark Colorblind theme, spacing, cursor-warp shader, and Hyper shortcuts. |
| [`.config/herdr/`](.config/herdr/) | Workspace navigation, notifications, and local agent/URL chooser plugins. |
| [`.config/karabiner/`](.config/karabiner/) | Caps Lock → Command+Control+Option+Shift (Hyper). |
| [`.config/openlogi/config.toml`](.config/openlogi/config.toml) | OpenLogi mouse settings (MX Master 4 DPI, scroll, action ring), shared across macOS accounts. |
| [`.config/opencode/`](.config/opencode/) | OpenCode settings, agent instructions, and Herdr TUI integration. |
| [`.claude/`](.claude/) | Claude Code settings, instructions, status line, output styles, and Herdr session hook. |
| [`.codex/`](.codex/) | Codex configuration. |
| [`agent-rules/`](agent-rules/) | Source for the Claude, Codex, and OpenCode global rules. Edit here, then run `agent-rules/build.sh`. |
| [`.config/zed/`](.config/zed/), [`iterm2/`](iterm2/) | Editor and alternative terminal settings. |
| [`.config/nix/`](.config/nix/) | Nix client configuration. |

## Configuration ownership

- **Home Manager** generates fish, Starship, SSH, and Git configuration. Edit `home.nix`, then apply it.
- **GNU Stow** links the other configuration files to this checkout. Editing a linked file normally changes the repo directly.
- **Homebrew Bundle** records the selected package inventory. Review `brew bundle dump --force` changes before committing.
- **Herdr integrations** include generated code managed by Herdr. Upgrades can change the vendored scripts and registrations.

Herdr's logs, sockets, session snapshots, and plugin registration/state are local runtime data, excluded from version control. Agent credentials and conversation histories are also excluded; this repo is not a backup of live sessions. See [setup](SETUP.md#8-enable-the-herdr-workflow) for registering the local plugins on another machine.

## Inspiration and attribution

Parts of this setup were inspired by **[Mark Jaquith's dotfiles](https://github.com/markjaquith/dotfiles)**:

- The [Herdr agent chooser and URL chooser](https://github.com/markjaquith/dotfiles/tree/main/home/.config/herdr/plugins/local) are adapted from his scripts. Local changes add explicit agent status labels/symbols, fix cleanup exit statuses, and handle optional URL-picker tools and cancellation.
- The [cursor-warp shader](https://github.com/markjaquith/dotfiles/blob/main/home/.config/ghostty/shaders/cursor_warp.glsl) is copied from his Ghostty configuration.
- Workspace navigation, skipping tab-name prompts, and some terminal spacing/cursor settings were inspired by his [Herdr](https://github.com/markjaquith/dotfiles/blob/main/home/.config/herdr/config.toml) and [Ghostty](https://github.com/markjaquith/dotfiles/blob/main/home/.config/ghostty/config) settings.

This setup keeps its own Menlo font, colorblind-friendly Ghostty theme, and Hyper+O/U bindings. Generated agent integrations come from [Herdr](https://herdr.dev/docs/integrations/), not Mark's dotfiles.
