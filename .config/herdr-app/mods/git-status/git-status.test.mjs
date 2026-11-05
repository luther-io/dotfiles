import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("./main.js", import.meta.url), "utf8")
  .replace(/^import .*;\n/gm, "")
  .replace("export default class GitStatus", "globalThis.GitStatus = class GitStatus");

function element() {
  const node = { items: [] };
  const proxy = new Proxy(node, {
    get(target, key) {
      if (key === "items") return target.items;
      if (key === "child") return (value) => { target.items.push(value); return proxy; };
      if (key === "children") return (values) => { target.items.push(...values); return proxy; };
      if (key === "when") return (condition, apply) => condition ? apply(proxy) : proxy;
      return () => proxy;
    },
  });
  return proxy;
}

function text(node) {
  return typeof node === "string" ? node : (node?.items ?? []).map(text).join("\n");
}

const workspace = {
  stacks: [{ branches: [{
    name: "testing-branch",
    branchStatus: "completelyUnpushed",
    commits: [{ commitId: "abc1234", createdAt: "2026-11-05T06:11:57+00:00", message: "Actual feature commit\n\nBody" }],
  }] }],
  upstreamState: { behind: 2 },
};

async function panel({ branch = "gitbutler/workspace", status = workspace, target = { branch: "origin/main" }, fail, on = null } = {}) {
  const calls = [];
  const context = {
    View: class {}, div: element, svg: element, h_flex: element, v_flex: element,
    theme: () => ({}), layout: () => ({ id: "sidebar", size: { px: 300 } }),
    exec: async (cmd, args, options) => {
      calls.push({ cmd, args, options });
      if (cmd === "but") {
        if (fail === "missing") throw new Error("but not found");
        if (fail === "exit") return { code: 1, stdout: "", stderr: "busy" };
        const value = args.includes("status") ? status : target;
        return { code: 0, stdout: typeof value === "string" ? value : JSON.stringify(value) };
      }
      if (args.includes("status")) return { code: 0, stdout: [
        "# branch.oid 0123456789", `# branch.head ${branch}`,
        ...(branch === "main" ? ["# branch.upstream origin/main", "# branch.ab +3 -1"] : []),
        "? notes.txt",
      ].join("\n") };
      if (args.includes("rev-parse")) return { code: 0, stdout: "/repo\n/repo/.git\n" };
      if (args.includes("log")) return { code: 0, stdout: "0123456\x1f1793859117\x1fGitButler Workspace Commit\n" };
      throw new Error(`Unexpected command: ${cmd} ${args.join(" ")}`);
    },
  };
  runInNewContext(source, context);
  const view = new context.GitStatus();
  view.git = await view.look(JSON.stringify([on, "/repo/nested"]));
  return { view, calls, rendered: text(view.render()) };
}

test("GitButler shows applied branch, target and actual commit", async () => {
  const { rendered } = await panel();
  assert.match(rendered, /testing-branch/);
  assert.match(rendered, /Target: origin\/main/);
  assert.match(rendered, /Actual feature commit/);
  assert.doesNotMatch(rendered, /No upstream|GitButler Workspace Commit/);
  assert.match(rendered, /notes.txt/);
});

test("multiple stacks and stacked branches are all visible", async () => {
  const status = { ...workspace, stacks: [
    ...workspace.stacks,
    { branches: [{ name: "feature-ui", commits: [] }, { name: "feature-api", commits: [] }] },
  ] };
  const { rendered } = await panel({ status });
  for (const name of ["testing-branch", "feature-ui", "feature-api"]) assert.ok(rendered.includes(name));
});

test("empty GitButler workspace has an explicit empty state", async () => {
  const { rendered } = await panel({ status: { stacks: [] } });
  assert.match(rendered, /No applied branches/);
  assert.doesNotMatch(rendered, /GitButler Workspace Commit/);
});

test("ordinary Git retains branch, upstream, counts and file display without calling but", async () => {
  const { rendered, calls } = await panel({ branch: "main" });
  assert.match(rendered, /origin\/main/);
  assert.match(rendered, /↑3/);
  assert.match(rendered, /↓1/);
  assert.match(rendered, /notes.txt/);
  assert.ok(calls.every((call) => call.cmd !== "but"));
});

test("GitButler failures keep Git file status and report unavailable details", async () => {
  for (const input of [{ fail: "missing" }, { fail: "exit" }, { status: "invalid JSON" }, { status: {} }]) {
    const { rendered } = await panel(input);
    assert.match(rendered, /GitButler details unavailable/);
    assert.match(rendered, /notes.txt/);
    assert.doesNotMatch(rendered, /Not a git repository/);
  }
});

test("target failure preserves applied branches", async () => {
  const { rendered } = await panel({ target: "invalid JSON" });
  assert.match(rendered, /testing-branch/);
  assert.match(rendered, /Target unavailable/);
});

test("GitButler commands follow the focused folder and machine", async () => {
  const { calls } = await panel({ on: "work-host" });
  const but = calls.filter((call) => call.cmd === "but");
  assert.equal(but.length, 2);
  for (const call of but) {
    assert.equal(call.options.cwd, "/repo/nested");
    assert.equal(call.options.on, "work-host");
    assert.ok(call.args.includes("--json"));
  }
});
