## Dotfiles

- `~/.claude/` (settings, CLAUDE.md, rules, skills, output styles, statusline) is symlinked from `~/dotfiles/.claude/`. Edits land in that repository.
- `CLAUDE.md` is generated: edit `~/dotfiles/agent-rules/` and run `agent-rules/build.sh`.
- Individual skills and `rules/gitbutler.md` link onward into `~/work/personal/skills` (managed by its `setup.sh`). Edit them there.
- The GitButler rules in `~/.claude/rules/gitbutler.md` apply only in GitButler-managed repositories.
