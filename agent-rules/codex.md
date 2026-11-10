## Dotfiles

- `~/.codex/AGENTS.md` is symlinked from `~/dotfiles/.codex/`. It is generated: edit `~/dotfiles/agent-rules/` and run `agent-rules/build.sh`.
- `~/.codex/config.toml` is machine-local and not tracked (see `config.toml.example`).
- Skills may link onward to another repository. Check symlink targets before editing and change the source file.
