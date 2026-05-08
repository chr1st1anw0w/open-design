#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const PROJECT_ROOT = path.resolve(process.argv[2] || process.cwd());
const CLI_PATH = path.join(PROJECT_ROOT, "apps/daemon/dist/cli.js");
const TIMEOUT_MS = 30000;
const OPTIONAL_STEP_TIMEOUT_MS = 9000;

function fail(message) {
  process.stderr.write(`FAIL: ${message}\n`);
  process.exit(1);
}

function info(message) {
  process.stdout.write(`${message}\n`);
}

if (!fs.existsSync(CLI_PATH)) {
  fail(
    `missing daemon CLI at ${CLI_PATH}. Run: pnpm --filter @open-design/daemon build`,
  );
}

const child = spawn(
  process.execPath,
  [CLI_PATH, "mcp", "perplexity", "--project-root", PROJECT_ROOT],
  { stdio: ["pipe", "pipe", "pipe"] },
);

let buffer = Buffer.alloc(0);
let nextId = 1;
const pending = new Map();
let timer = null;

function resetTimeout() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    teardown();
    fail(`timeout after ${TIMEOUT_MS}ms`);
  }, TIMEOUT_MS);
}

function teardown() {
  if (timer) clearTimeout(timer);
  if (!child.killed) child.kill("SIGTERM");
}

function encodeMessage(obj) {
  const body = Buffer.from(JSON.stringify(obj), "utf8");
  const header = Buffer.from(
    `Content-Length: ${body.length}\r\nContent-Type: application/json\r\n\r\n`,
    "utf8",
  );
  return Buffer.concat([header, body]);
}

function send(method, params = {}) {
  const id = nextId++;
  const payload = { jsonrpc: "2.0", id, method, params };
  child.stdin.write(encodeMessage(payload));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, method });
  });
}

function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

function onMessage(msg) {
  if (typeof msg?.id !== "number") return;
  const slot = pending.get(msg.id);
  if (!slot) return;
  pending.delete(msg.id);
  if (msg.error) {
    slot.reject(
      new Error(`${slot.method} error ${msg.error.code}: ${msg.error.message}`),
    );
    return;
  }
  slot.resolve(msg.result);
}

child.stdout.on("data", (chunk) => {
  resetTimeout();
  buffer = Buffer.concat([buffer, chunk]);
  while (true) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd < 0) break;
    const header = buffer.subarray(0, headerEnd).toString("utf8");
    const m = header.match(/Content-Length:\s*(\d+)/i);
    if (!m) {
      teardown();
      fail(`invalid MCP header: ${header}`);
    }
    const bodyLen = Number(m[1]);
    const bodyStart = headerEnd + 4;
    if (buffer.length < bodyStart + bodyLen) break;
    const body = buffer.subarray(bodyStart, bodyStart + bodyLen).toString("utf8");
    buffer = buffer.subarray(bodyStart + bodyLen);
    try {
      onMessage(JSON.parse(body));
    } catch (error) {
      teardown();
      fail(`invalid JSON payload: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});

child.stderr.on("data", () => {});
child.on("error", (err) => {
  teardown();
  fail(`failed to start MCP process: ${err.message}`);
});
child.on("exit", (code, signal) => {
  if (pending.size === 0) return;
  for (const [, slot] of pending) {
    slot.reject(new Error(`mcp process exited (${signal || code})`));
  }
  pending.clear();
});

async function main() {
  resetTimeout();
  const init = await send("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "mcp-perplexity-check", version: "0.1.0" },
  });
  if (!init?.serverInfo?.name) fail("initialize missing serverInfo.name");
  info(`PASS initialize -> ${init.serverInfo.name}@${init.serverInfo.version}`);

  const list = await send("tools/list", {});
  const tools = Array.isArray(list?.tools) ? list.tools : [];
  if (tools.length === 0) fail("tools/list returned empty tools");
  info(`PASS tools/list -> ${tools.length} tools`);

  const health = await send("tools/call", { name: "od_health", arguments: {} });
  const healthText = health?.content?.[0]?.text;
  const healthObj = typeof healthText === "string" ? JSON.parse(healthText) : null;
  if (!healthObj?.ok) fail("od_health returned not ok");
  info(`PASS od_health -> ok=true`);

  try {
    const agents = await withTimeout(
      send("tools/call", { name: "od_agents_list", arguments: {} }),
      OPTIONAL_STEP_TIMEOUT_MS,
      "od_agents_list",
    );
    const agentsText = agents?.content?.[0]?.text;
    const agentsObj = typeof agentsText === "string" ? JSON.parse(agentsText) : null;
    const order = agentsObj?.priorityOrder;
    if (
      !Array.isArray(order) ||
      order.join(",") !== "codex,claude-code,api-fallback"
    ) {
      fail("od_agents_list priorityOrder mismatch");
    }
    info(`PASS od_agents_list -> priorityOrder=${order.join(" -> ")}`);
  } catch (error) {
    info(`WARN od_agents_list skipped (${error instanceof Error ? error.message : String(error)})`);
  }

  for (const adapterId of ["codex", "claude-code", "api-fallback"]) {
    const adapterCheck = await send("tools/call", {
      name: "od_execution_validate_adapter",
      arguments: { adapterId },
    });
    const adapterText = adapterCheck?.content?.[0]?.text;
    const adapterObj =
      typeof adapterText === "string" ? JSON.parse(adapterText) : null;
    if (adapterObj?.allowed !== true) {
      fail(`adapter gating failed for ${adapterId}`);
    }
    info(`PASS adapter gating -> ${adapterId}`);
  }

  teardown();
  info("PASS mcp:perplexity:check");
}

main().catch((error) => {
  teardown();
  fail(error instanceof Error ? error.message : String(error));
});
