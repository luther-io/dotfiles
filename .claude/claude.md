# Global Rules

I have ADHD — keep things short and scannable.

## Writing

- Don't add unrequested clarifying asides, such as "Code chooses the digits; an AI model never does." They are often inaccurate and read as filler. Add them only when I ask. This applies to chat, docs, tickets, and code comments.
- Always format ticket keys, wiki pages, and PRs as clickable Markdown links in chat, docs, and ticket descriptions — never as plain text or `code` spans. Resolve the URL from the tracker tool's output, the project's `AGENTS.md` / `docs/agents/issue-tracker.md`, or `git remote -v`.

## Code Style

- Use TypeScript for new application and library code.
- New projects: use `oxlint` for linting and `oxfmt` for formatting.
- Existing projects: follow whatever tooling is already configured — do not introduce new tools without asking.
- Use `vitest` for testing, not Jest.

## Tool Preferences

- Before starting a task, check the skills available to you and read any relevant skill instructions before choosing tools or running commands.
- Search: use `rg` (ripgrep) — never `find` or `grep`
- Package manager: use `pnpm` for new projects.
- Shell: my interactive shell is fish — when suggesting commands for me to run, use fish syntax (`set -gx` not `export`, `(cmd)` not `$(cmd)`).
- Installing tools: never install a system package or CLI tool yourself (no `brew install`, `nix profile install`, global `pnpm`/`npm` installs, or edits to `home.nix`/`Brewfile`). If one is needed, stop and ask me — I'll decide whether it goes in `home.nix` or the `Brewfile`.

## Git

- Check the current branch first. Use GitButler (`but`) only when the repository is already on `gitbutler/workspace`; otherwise, use plain Git. Load the available GitButler skill for syntax only in that workspace; its rules do not apply elsewhere.
- The GitButler rules in `~/.claude/rules/gitbutler.md` apply **only** on `gitbutler/workspace`. On any other branch, ignore them.
- Never create git worktrees (no `git worktree add`, `EnterWorktree`, or `isolation: "worktree"`). Use a GitButler branch instead.
- Never commit, and don't offer to, unless explicitly told in the chat.
- Never make PRs, and don't offer to, unless explicitly told in the chat.

## Jira tickets

- Always draft the ticket in chat and wait for my approval before creating it.
- Title states the intent/goal, not the solution ("Make CI pass on Dependabot npm PRs", not "Pin npm in package.json"). Repo-scoped work gets a `[repo-name]` prefix.
- Body is problem-first: what's broken, then the literal error message from a specific linked example (PR number, CI job URL, log line). Only then the cause, the fix, and how to test. Tickets are documentation for whoever hits the same symptom later, humans or agents.
- Section shape: one context paragraph → evidence (error/scan output) → **Work** (bullets) → **Testing** (bullets) → "Related to …" line.
- Pithy applies to tickets too. No rationale paragraphs, no "why this matters" essays, no restating what the evidence block already shows. If a sentence isn't a fact, a step, or a check, cut it.
- Assign to me, put it in my team's current sprint, and link related tickets (`Relates`).

## PR titles

- PR title = `<type>(<TICKET-KEY>): <Jira ticket summary verbatim>`, minus any `[repo-name]` prefix. The ticket summary is the title; don't write a new one.
- `type` follows the repo's Conventional Commit / release convention (`feat`, `fix`, `chore`, …).
- Fill in the repo's PR template (`.github/pull_request_template.md` or similar) when one exists.
- Always open the description with a plain-voice **Why** (what breaks if we don't merge, plus the literal error) and a **Benefit** (what's better after merge), so a reviewer who hasn't read the ticket gets the purpose. The template doesn't replace them.
- Only the ticket being implemented goes in the PR body. The Jira↔GitHub automation transitions every `EDGE-XXXX` key it finds in the PR, so a "Related to EDGE-YYYY" line moves untouched tickets to In Dev Review / Deployed To Staging. Link related tickets in Jira instead.

## Dotfiles

- `~/.claude/` (settings, CLAUDE.md, rules, skills, output styles, statusline) is symlinked from `~/dotfiles/.claude/`. Edits land in that repo and show up there as uncommitted changes.
- Exception: individual skills and `rules/gitbutler.md` link onward into `~/work/personal/skills` (managed by its `setup.sh`). Edit them there.
