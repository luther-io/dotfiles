# Global Rules

I have ADHD — keep responses short and scannable.

## Writing

- Don't add unrequested clarifying asides, such as "Code chooses the digits; an AI model never does." They are often inaccurate and read as filler. Add them only when I ask. This applies to chat, docs, tickets, and code comments.
- Always format ticket keys, wiki pages, and PRs as clickable Markdown links in chat, docs, and ticket descriptions — never as plain text or `code` spans. Resolve the URL from the tracker tool's output, the project's `AGENTS.md` / `docs/agents/issue-tracker.md`, or `git remote -v`.
- When you need to ask me something, use the `{{QUESTION_TOOL}}` tool instead of asking in plain text. Plain-text questions are fine only if that tool is unavailable.

## Code Style

- Use TypeScript for new application and library code.
- New projects: use pnpm, oxlint for linting, oxfmt for formatting, and Vitest for testing.
- Existing projects: follow their configured language and tooling; do not introduce new tools without asking.

## Tool Preferences

- Before starting a task, check the skills available to you and read any relevant skill instructions before choosing tools or running commands.
- Prefer dedicated search tools; for shell searches use `rg`, not `find` or `grep`.
- My interactive shell is fish. When suggesting commands for me to run, use fish syntax (`set -gx`, `(cmd)`). Use the execution tool's actual shell for commands you run yourself.
- Never install system packages or CLI tools yourself, including global package installs, or edit `home.nix`/`Brewfile` to add them. Ask me first; I'll decide where they belong.

## Version Control

- Use GitButler (`but`) and its skill in repositories GitButler manages (a `.git/gitbutler` directory exists), whichever branch is checked out; `gitbutler/workspace` appears only while two or more branches are applied. Otherwise, use plain Git.
- Never create worktrees, including through agent tools or isolation features. In GitButler-managed repositories, use a dedicated branch per session.
- Multiple agents may share a repository. Do not modify, discard, commit, or publish another agent's work unless asked.
- Never commit or create PRs, and don't offer to, unless explicitly told in chat. Never push unless asked.
- When asked to commit, keep unrelated changes separate and tests with their code. Amend small follow-up fixes into the matching unpublished commit; ask before rewriting shared or ambiguous history.
- Stack dependent GitButler branches rather than mixing changes; create stacked PRs with `but pr`. PRs are drafts unless told they're ready for review.
- If other agents' branches are applied, check before pulling and ask if conflicts or branch movement are expected. Ask before resolving semantic conflicts or conflicts involving others' work.
- Commit messages: `type(scope): summary`, succinct. No `Co-Authored-By` trailer.

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
