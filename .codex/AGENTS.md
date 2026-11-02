# Global Rules

I have ADHD — keep responses short and scannable.

## Writing

- Don't add unrequested clarifying asides, such as "Code chooses the digits; an AI model never does." They are often inaccurate and read as filler. Add them only when I ask. This applies to chat, docs, tickets, and code comments.
- Always format ticket keys, wiki pages, and PRs as clickable Markdown links in chat, docs, and ticket descriptions — never as plain text or `code` spans. Resolve the URL from the tracker tool's output, the project's `AGENTS.md` / `docs/agents/issue-tracker.md`, or `git remote -v`.

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

- Check the current branch first. Use GitButler (`but`) only when the repository is already on `gitbutler/workspace`; otherwise, use plain Git. Load the available GitButler skill for syntax only in that workspace; its rules do not apply elsewhere.
- Never create worktrees, including through agent isolation features. In GitButler workspaces, use a dedicated branch per session.
- Multiple agents may share a repository. Do not modify, discard, commit, or publish another agent's work unless asked.
- Never commit or create PRs, and don't offer to, unless explicitly told in chat. Never push unless asked.
- When asked to commit, keep unrelated changes separate and tests with their code. Amend small follow-up fixes into the matching unpublished commit; ask before rewriting shared or ambiguous history.
- Stack dependent GitButler branches rather than mixing changes; create stacked PRs with `but pr`. PRs are drafts unless told they're ready for review.
- If other agents' branches are applied, check before pulling and ask if conflicts or branch movement are expected. Ask before resolving semantic conflicts or conflicts involving others' work.
- Commit messages: `type(scope): summary`, succinct.

## Dotfiles

- `~/.codex/` is symlinked from `~/dotfiles/.codex/`; edits land in that repository.
- Skills may link onward to another repository. Check symlink targets before editing and change the source file.

<!-- gitbutler-agent-setup:start -->
## Version control

- Use GitButler (`but`) for version-control inspection and write operations, including status, diffs, branching, committing, pushing, and history edits.
- Assume multiple agents may be working in this repository. Do not move, amend, squash, discard, commit, push, or otherwise modify another agent's work unless the user asks.
- For commit just/only/specific changes on a new branch (selected-change requests), use the two-command fast path from the GitButler skill: `but diff`, then `but commit -b <branch> -m "message" <id> <id>`.
- For that fast path, after the commit succeeds, stop and summarize; do not run separate branch, staging, status, or diff commands unless the commit output is missing information you need.
- Use the installed GitButler skill for command recipes and syntax before guessing flags, using `--help`, or translating Git habits directly.
- Mutation commands report their result without appending workspace status. Add `--status-after` only when the next step needs resulting workspace IDs or details; otherwise do not rerun status or diff to verify success.
- Use a dedicated GitButler branch for each agent session, unless the user asks for a different branch structure. Commit only changes that belong to that session.
- Do not push or open pull requests unless the user asks.
- Keep commit messages and pull request descriptions succinct: explain what changed, why it changed, and any important decision.

### Amend local fixes into the right commits

- For small cleanup or follow-up fixes, amend an unpublished local commit when the change clearly belongs with that commit's intent.
- Do not create tiny fixup commits unless the user asks.
- Use GitButler to move the relevant changes into the commit where they belong.
- Ask before rewriting pushed, reviewed, shared, or ambiguous history.

### Split unrelated changes into separate commits

- If one file contains unrelated changes, split them by hunk instead of committing the whole file.
- Keep tests with the behavior they verify.
- Split generated output, docs-only edits, or mechanical cleanup into separate commits when each commit remains coherent on its own.
- If the split is ambiguous, summarize the options before committing.

### Create stacked pull requests

- If this session depends on another in-flight branch, stack its branch on top of that dependency instead of mixing the changes.
- If this session is working in a stack, put commits on the branch where they belong.
- Ask before moving commits onto lower, pushed, reviewed, or shared branches.
- Use `but move` for branch stacking and restacking. Do not recreate branches to simulate stacking.
- For stacked branches, create pull requests with `but pr`, not `gh`, so GitButler keeps the right PR base branches and stack metadata.

### Update from the target branch automatically

- When GitButler status shows new changes on the target branch and the workspace holds only this session's branches, update with `but pull` directly — its output reports the result and `but undo` reverts it.
- If an update you started on your own initiative reports conflicted commits, stop and ask before resolving them (`but undo` reverts the pull if the user prefers).
- When other agents' branches are applied, run `but pull --check` first and ask before updating if it reports conflicts or their branches would move.
- If the user asks you to handle update conflicts, use GitButler's conflict tools. Ask before resolving semantic conflicts, dependency updates, generated files, or conflicts involving another person's work.

### Open draft pull requests by default

- When asked to open a pull request, create it as a draft with GitButler unless the user says it is ready for review.
- Remember that creating a draft pull request still publishes the branch.

### Commit message convention

- Follow the `type(scope): summary` commit-message convention when writing commit messages.
<!-- gitbutler-agent-setup:end -->
