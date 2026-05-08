#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const HOME = os.homedir();
const SOURCE_DEFAULT = "/Users/christianwu/open-design/mcp.json";
const TARGET_DEFAULT = path.join(HOME, ".codex", "config.toml");

function parseArgs(argv) {
  const args = { from: SOURCE_DEFAULT, to: TARGET_DEFAULT, backup: true };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--from" && argv[i + 1]) args.from = argv[++i];
    else if (token === "--to" && argv[i + 1]) args.to = argv[++i];
    else if (token === "--no-backup") args.backup = false;
  }
  return args;
}

function tomlString(value) {
  return `"${String(value).replaceAll("\\", "\\\\").replaceAll("\"", "\\\"")}"`;
}

function tomlArray(arr) {
  return `[${arr.map((v) => tomlString(v)).join(", ")}]`;
}

function renderMcpServers(servers) {
  const lines = [];
  for (const [name, spec] of Object.entries(servers)) {
    const section = JSON.stringify(name);
    lines.push(`[mcp_servers.${section}]`);
    if (typeof spec.url === "string" && spec.url.length > 0) {
      lines.push(`url = ${tomlString(spec.url)}`);
    } else {
      lines.push(`command = ${tomlString(spec.command)}`);
      lines.push(`args = ${tomlArray(Array.isArray(spec.args) ? spec.args : [])}`);
    }
    lines.push(`enabled = ${spec.enabled !== false ? "true" : "false"}`);
    lines.push("");
    const env = spec.env && typeof spec.env === "object" ? spec.env : {};
    if (Object.keys(env).length > 0) {
      lines.push(`[mcp_servers.${section}.env]`);
      for (const [k, v] of Object.entries(env)) {
        lines.push(`${k} = ${tomlString(v)}`);
      }
      lines.push("");
    }
  }
  return lines.join("\n").trimEnd() + "\n";
}

function stripMcpSections(toml) {
  const rows = toml.split(/\r?\n/);
  const output = [];
  let skip = false;
  for (const row of rows) {
    const m = row.match(/^\s*\[([^\]]+)\]\s*$/);
    if (m) {
      const section = m[1];
      skip = section === "mcp_servers" || section.startsWith("mcp_servers.");
    }
    if (!skip) output.push(row);
  }
  return output.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const raw = fs.readFileSync(args.from, "utf8");
  const source = JSON.parse(raw);
  const servers = source.mcpServers;
  if (!servers || typeof servers !== "object") {
    throw new Error("source JSON must contain mcpServers object");
  }

  const targetDir = path.dirname(args.to);
  fs.mkdirSync(targetDir, { recursive: true });

  const existing = fs.existsSync(args.to) ? fs.readFileSync(args.to, "utf8") : "";
  if (args.backup && fs.existsSync(args.to)) {
    const stamp = new Date().toISOString().replaceAll(":", "-");
    const backupPath = `${args.to}.bak.${stamp}`;
    fs.writeFileSync(backupPath, existing, "utf8");
    console.log(`backup: ${backupPath}`);
  }

  const cleaned = stripMcpSections(existing);
  const rendered = renderMcpServers(servers);
  const finalToml =
    `${cleaned}\n# MCP batch managed block\n` +
    `# source: ${args.from}\n\n` +
    rendered;

  fs.writeFileSync(args.to, finalToml, "utf8");
  console.log(`updated: ${args.to}`);
  console.log(`servers: ${Object.keys(servers).length}`);
}

main();
