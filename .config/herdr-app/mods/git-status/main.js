// The git state of the focused pane's folder: repo, branch, upstream, changes and last commit. Read-only.

import { View, div, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { exec, focused, layout, panes, spaces, theme, watchFolder, window } from "herdr";

// Edits outside .git don't wake the watch: looked for this often while the window is in front.
const FALLBACK = 10000;

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

function ago(seconds) {
  const m = Math.floor((Date.now() / 1000 - seconds) / 60);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  if (m < 10080) return `${Math.floor(m / 1440)}d`;
  return `${Math.floor(m / 10080)}w`;
}

function parseStatus(text) {
  const g = { branch: null, oid: null, upstream: null, ahead: 0, behind: 0, stash: 0, staged: 0, modified: 0, untracked: 0, conflicts: 0 };
  for (const line of text.split("\n")) {
    if (line.startsWith("# branch.oid ")) g.oid = line.slice(13);
    else if (line.startsWith("# branch.head ")) g.branch = line.slice(14);
    else if (line.startsWith("# branch.upstream ")) g.upstream = line.slice(18);
    else if (line.startsWith("# branch.ab ")) {
      const [a, b] = line.slice(12).split(" ");
      g.ahead = Math.abs(parseInt(a, 10)) || 0;
      g.behind = Math.abs(parseInt(b, 10)) || 0;
    } else if (line.startsWith("# stash ")) g.stash = parseInt(line.slice(8), 10) || 0;
    else if (line.startsWith("1 ") || line.startsWith("2 ")) {
      if (line[2] !== ".") g.staged++;
      if (line[3] !== ".") g.modified++;
    } else if (line.startsWith("u ")) g.conflicts++;
    else if (line.startsWith("? ")) g.untracked++;
  }
  return g;
}

const repoName = (common) => {
  const path = common.replace(/\/+$/, "");
  return (path.endsWith("/.git") ? path.slice(0, -5) : path).split("/").pop().replace(/\.git$/, "");
};

export default class GitStatus extends View {
  init(_props, cx) {
    this.key = null; // where we're looking: [machine, folder]
    this.git = undefined; // undefined: not looked yet; null: not a repo
    this.checked = 0;
    this.busy = false;
    this.again = false;
    cx.timer.every(1000, (cx) => this.tick(cx));
    this.tick(cx);
  }

  tick(cx) {
    const f = focused();
    const pane = panes().find((p) => p.pane === f?.pane);
    const cwd = pane?.cwd ?? f?.cwd;
    // A mod pane or a pane without a folder keeps showing the last place.
    if (cwd) {
      const machine = spaces().find((s) => s.id === f.space)?.machine ?? null;
      const key = JSON.stringify([machine, cwd]);
      if (key !== this.key) {
        this.key = key;
        this.refresh(cx);
        return;
      }
    }
    // A finished turn or command is when things change.
    const working = pane?.status === "working";
    const finished = this.working && !working;
    this.working = working;
    if (finished || (window()?.active && Date.now() - this.checked > FALLBACK)) this.refresh(cx);
  }

  // One look at a time; asked again meanwhile, one more after it.
  refresh(cx) {
    if (!this.key) return;
    if (this.busy) { this.again = true; return; }
    this.busy = true;
    this.checked = Date.now();
    cx.spawn(async (cx) => {
      do {
        this.again = false;
        const key = this.key;
        const git = await this.look(key);
        // Focus moved while it looked: this answer is for somewhere else.
        if (key === this.key) {
          this.git = git;
          this.watch(git, key, cx);
        }
      } while (this.again);
      this.busy = false;
      cx.notify();
    });
  }

  async look(key) {
    const [on, cwd] = JSON.parse(key);
    const git = (...args) => exec("git", ["--no-optional-locks", "-c", "core.fsmonitor=false", ...args], { cwd, on });
    try {
      const st = await git("status", "--porcelain=v2", "--branch", "--show-stash");
      if (st.code !== 0) return null;
      const info = parseStatus(st.stdout);
      const where = await git("rev-parse", "--show-toplevel", "--path-format=absolute", "--git-common-dir");
      const [top, common] = where.stdout.trim().split("\n");
      info.repo = repoName(common ?? top);
      info.common = common;
      info.linked = common !== `${top}/.git`;
      const log = await git("log", "-1", "--format=%h%x1f%ct%x1f%s");
      if (log.code === 0 && log.stdout.trim()) {
        const [hash, time, ...subject] = log.stdout.trim().split("\x1f");
        info.commit = { hash, time: Number(time), subject: subject.join(" ") };
      }
      return info;
    } catch {
      return null;
    }
  }

  // A commit, checkout, stage or fetch shows at once. Local repos only.
  watch(git, key, cx) {
    const repo = git && !JSON.parse(key)[0] ? git.common : null;
    if (repo === this.watching) return;
    this.watching = repo;
    if (!repo) return;
    cx.spawn(async (cx) => {
      try {
        while (this.watching === repo) {
          await watchFolder(repo);
          if (this.watching === repo) this.refresh(cx);
        }
      } catch {
        if (this.watching === repo) this.watching = null;
      }
    });
  }

  render() {
    const t = theme();
    const root = v_flex().id("git-status-root").size_full().min_h(0).bg(t.chrome).border_t(1).border_color(t.border).text_size(12);
    // Folded to the icon rail, there's no room to read it.
    if ((find(layout(), "sidebar")?.size?.px ?? Infinity) < 160) return root;

    const g = this.git;
    const heading = h_flex().id("git-status-heading").h(31).flex_none().pl(16).pr(10).items_center().font_medium().text_color(t.muted).child("Git");
    const body = v_flex().id("git-status-body").flex_1().min_h(0).px(16).pb(8).gap(3).overflow_y_scroll();
    if (g === undefined) return root.child(heading).child(body.child(div().text_color(t.dim).child("Looking…")));
    if (g === null) return root.child(heading).child(body.child(div().text_color(t.dim).child("Not a git repository")));

    const branch = g.branch === "(detached)" ? `detached ${g.oid?.slice(0, 7) ?? ""}` : g.branch;
    const count = (n, word, color) => n > 0 ? div().flex_none().text_color(color).child(`${n} ${word}`) : null;
    const changes = [
      count(g.conflicts, "conflicts", t.blocked),
      count(g.staged, "staged", t.ansi2),
      count(g.modified, "modified", t.ansi3),
      count(g.untracked, "new", t.muted),
    ].filter(Boolean);

    return root.child(heading).child(body
      .child(h_flex().gap(6).items_center()
        .child(div().min_w(0).truncate().font_medium().text_size(13).text_color(t.foreground).child(g.repo))
        .when(g.linked, (el) => el.child(div().flex_none().text_color(t.dim).child("worktree"))))
      .child(h_flex().gap(6).items_center()
        .child(svg("mods/workspace-chrome/branch.svg").size(12).flex_none().text_color(t.dim))
        .child(div().min_w(0).flex_1().truncate().text_color(t.foreground).child(branch ?? ""))
        .when(g.ahead > 0, (el) => el.child(div().flex_none().text_color(t.ansi2).child(`↑${g.ahead}`)))
        .when(g.behind > 0, (el) => el.child(div().flex_none().text_color(t.ansi1).child(`↓${g.behind}`))))
      .child(div().min_w(0).truncate().text_color(t.dim).child(g.upstream ? `→ ${g.upstream}` : "No upstream"))
      .child(h_flex().gap(8).flex_wrap().items_center()
        .when(changes.length === 0, (el) => el.child(div().text_color(t.dim).child("Clean")))
        .children(changes)
        .when(g.stash > 0, (el) => el.child(div().flex_none().text_color(t.dim).child(`${g.stash} stashed`))))
      .when(Boolean(g.commit), (el) => el.child(h_flex().gap(6).items_center().text_color(t.dim)
        .child(div().min_w(0).flex_1().truncate().child(g.commit.subject))
        .child(div().flex_none().child(ago(g.commit.time))))));
  }
}
