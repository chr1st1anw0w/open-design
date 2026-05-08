// @ts-nocheck
import path from "node:path";
import fs from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { detectAgents } from "../agents.js";
import { listSkills } from "../skills.js";

const SERVER_NAME = "open-design-perplexity-mcp";
const SERVER_VERSION = "0.1.0";
const MCP_PROTOCOL_VERSION = "2024-11-05";

const PRIORITY_ADAPTERS = ["codex", "claude-code", "api-fallback"];
const ADAPTER_ID_MAP = {
  codex: "codex",
  "claude-code": "claude",
  "api-fallback": "api-fallback",
};
const ADAPTER_LIST_TIMEOUT_MS = 8000;

const TOOLS = [
  {
    name: "od_health",
    description: "Health check for the Open Design MCP bridge.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {},
    },
  },
  {
    name: "od_agents_list",
    description:
      "List Open Design agent adapters and mark Perplexity P0 priority adapters.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {},
    },
  },
  {
    name: "od_skills_list",
    description: "List skills from the Open Design skills directory.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {},
    },
  },
  {
    name: "od_route_task",
    description:
      "Route a user request to a recommended Open Design skill and workflow lane.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["request"],
      properties: {
        request: { type: "string", minLength: 1 },
      },
    },
  },
  {
    name: "od_generate_design_brief",
    description:
      "Generate a design brief markdown file in the project workspace.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "goal"],
      properties: {
        title: { type: "string", minLength: 1 },
        goal: { type: "string", minLength: 1 },
        audience: { type: "string" },
        constraints: { type: "array", items: { type: "string" } },
        outputPath: { type: "string" },
      },
    },
  },
  {
    name: "od_write_requirement_doc",
    description: "Write a requirement document under the project root.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["outputPath", "content"],
      properties: {
        outputPath: { type: "string", minLength: 1 },
        content: { type: "string", minLength: 1 },
      },
    },
  },
  {
    name: "od_read_project_doc",
    description: "Read a document under the project root.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["inputPath"],
      properties: {
        inputPath: { type: "string", minLength: 1 },
      },
    },
  },
  {
    name: "od_execution_validate_adapter",
    description:
      "Validate adapter against Perplexity P0 gating (codex, claude-code, api-fallback).",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["adapterId"],
      properties: {
        adapterId: {
          type: "string",
          enum: PRIORITY_ADAPTERS,
        },
      },
    },
  },
  {
    name: "od_run_agent",
    description:
      "Execution placeholder with strict adapter gating for Perplexity P0.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["adapterId", "task"],
      properties: {
        adapterId: {
          type: "string",
          enum: PRIORITY_ADAPTERS,
        },
        task: { type: "string", minLength: 1 },
      },
    },
  },
];

export function startPerplexityMcpServer(options = {}) {
  const projectRoot = resolveProjectRoot(options.projectRoot);
  const skillsRoot = path.join(projectRoot, "skills");

  const transport = createStdioJsonRpcTransport(process.stdin, process.stdout);
  const state = { initialized: false };

  transport.onRequest(async (msg) => {
    const { id, method, params } = msg;

    try {
      if (method === "initialize") {
        state.initialized = true;
        transport.sendResponse(id, {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        });
        return;
      }

      if (method === "notifications/initialized") {
        return;
      }

      if (!state.initialized) {
        transport.sendError(id, -32002, "Server not initialized");
        return;
      }

      if (method === "tools/list") {
        transport.sendResponse(id, { tools: TOOLS });
        return;
      }

      if (method === "tools/call") {
        const toolName = params?.name;
        const args = params?.arguments || {};
        const result = await handleToolCall(toolName, args, {
          projectRoot,
          skillsRoot,
        });
        transport.sendResponse(id, {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
          isError: false,
        });
        return;
      }

      transport.sendError(id, -32601, `Method not found: ${method}`);
    } catch (err) {
      transport.sendError(id, -32000, err?.message || String(err));
    }
  });

  transport.onError((err) => {
    // eslint-disable-next-line no-console
    console.error(`[${SERVER_NAME}] transport error:`, err?.message || err);
  });

  transport.start();
}

async function handleToolCall(name, args, ctx) {
  switch (name) {
    case "od_health":
      return {
        ok: true,
        server: SERVER_NAME,
        version: SERVER_VERSION,
        protocolVersion: MCP_PROTOCOL_VERSION,
        projectRoot: ctx.projectRoot,
      };

    case "od_agents_list": {
      const agents = await detectAgentsWithTimeout(ADAPTER_LIST_TIMEOUT_MS);
      return {
        priorityOrder: PRIORITY_ADAPTERS,
        adapters:
          agents.length > 0
            ? agents.map((a) => ({
                id: reverseMapAdapterId(a.id),
                runtimeId: a.id,
                name: a.name,
                available: Boolean(a.available),
                isPriority: PRIORITY_ADAPTERS.includes(reverseMapAdapterId(a.id)),
              }))
            : PRIORITY_ADAPTERS.map((id) => ({
                id,
                runtimeId: ADAPTER_ID_MAP[id] || id,
                name: id,
                available: null,
                isPriority: true,
              })),
      };
    }

    case "od_skills_list": {
      const skills = await listSkills(ctx.skillsRoot);
      return {
        count: skills.length,
        skills: skills.map((s) => ({
          id: s.id,
          mode: s.mode,
          scenario: s.scenario,
          description: s.description,
        })),
      };
    }

    case "od_route_task": {
      const request = String(args.request || "").trim();
      const route = routeRequest(request);
      return route;
    }

    case "od_generate_design_brief": {
      const title = String(args.title || "").trim();
      const goal = String(args.goal || "").trim();
      if (!title || !goal) {
        throw new Error("title and goal are required");
      }
      const audience = String(args.audience || "").trim() || "未指定";
      const constraints = Array.isArray(args.constraints)
        ? args.constraints.map((x) => String(x).trim()).filter(Boolean)
        : [];
      const defaultPath = path.join(
        "specs",
        "current",
        `${slugify(title)}-design-brief.md`,
      );
      const outputPath = args.outputPath ? String(args.outputPath) : defaultPath;
      const abs = resolveScopedPath(ctx.projectRoot, outputPath);
      await mkdir(path.dirname(abs), { recursive: true });
      const content = [
        `# ${title}`,
        "",
        "## 目標",
        goal,
        "",
        "## 受眾",
        audience,
        "",
        "## 限制",
        constraints.length ? constraints.map((c) => `- ${c}`).join("\n") : "- 無",
        "",
        "## 建議技能路由",
        "- design-brief",
        "- web-design 或 stitch-design（視產物而定）",
      ].join("\n");
      await writeFile(abs, content, "utf8");
      return { ok: true, outputPath: abs };
    }

    case "od_write_requirement_doc": {
      const outputPath = String(args.outputPath || "").trim();
      const content = String(args.content || "");
      if (!outputPath || !content) {
        throw new Error("outputPath and content are required");
      }
      const abs = resolveScopedPath(ctx.projectRoot, outputPath);
      await mkdir(path.dirname(abs), { recursive: true });
      await writeFile(abs, content, "utf8");
      return { ok: true, outputPath: abs, bytes: Buffer.byteLength(content) };
    }

    case "od_read_project_doc": {
      const inputPath = String(args.inputPath || "").trim();
      if (!inputPath) throw new Error("inputPath is required");
      const abs = resolveScopedPath(ctx.projectRoot, inputPath);
      const content = await readFile(abs, "utf8");
      return { ok: true, inputPath: abs, content };
    }

    case "od_execution_validate_adapter": {
      const adapterId = String(args.adapterId || "").trim();
      const { allowed, reason, runtimeId } = validatePriorityAdapter(adapterId);
      return { adapterId, runtimeId, allowed, reason };
    }

    case "od_run_agent": {
      const adapterId = String(args.adapterId || "").trim();
      const task = String(args.task || "").trim();
      if (!task) throw new Error("task is required");
      const { allowed, reason, runtimeId } = validatePriorityAdapter(adapterId);
      if (!allowed) {
        throw new Error(`adapter not allowed: ${reason}`);
      }
      return {
        ok: false,
        status: "not_implemented",
        adapterId,
        runtimeId,
        message:
          "Execution transport is intentionally deferred in P0. Use discovery/planning/document tools first; wire execution in next step with the same adapter gating.",
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function routeRequest(request) {
  const q = request.toLowerCase();
  if (/\bppt|deck|slides|presentation|簡報/.test(q)) {
    return {
      lane: "deck",
      recommendedSkill: "html-ppt",
      fallbackSkill: "replit-deck",
    };
  }
  if (/\bstitch|ui|dashboard|landing|web\b|介面|網站/.test(q)) {
    return {
      lane: "ui",
      recommendedSkill: "design-brief",
      nextSkill: "web-design",
    };
  }
  if (/\bimage|ocr|截圖|圖片|顏色/.test(q)) {
    return {
      lane: "image-analysis",
      recommendedSkill: "image-analysis",
      nextSkill: "image-to-text",
    };
  }
  return {
    lane: "general",
    recommendedSkill: "design-brief",
    nextSkill: "open-design-agent",
  };
}

function validatePriorityAdapter(adapterId) {
  if (!PRIORITY_ADAPTERS.includes(adapterId)) {
    return {
      allowed: false,
      reason: `P0 allows only: ${PRIORITY_ADAPTERS.join(", ")}`,
      runtimeId: null,
    };
  }
  const runtimeId = ADAPTER_ID_MAP[adapterId] || adapterId;
  return { allowed: true, reason: "allowed", runtimeId };
}

function reverseMapAdapterId(runtimeId) {
  if (runtimeId === "claude") return "claude-code";
  if (runtimeId === "codex") return "codex";
  if (runtimeId === "api-fallback") return "api-fallback";
  return runtimeId;
}

async function detectAgentsWithTimeout(timeoutMs) {
  return await Promise.race([
    detectAgents(),
    new Promise((resolve) => setTimeout(() => resolve([]), timeoutMs)),
  ]);
}

function resolveProjectRoot(raw) {
  const base = raw || process.cwd();
  return path.resolve(base);
}

function resolveScopedPath(projectRoot, userPath) {
  const abs = path.resolve(projectRoot, userPath);
  const rel = path.relative(projectRoot, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("path escapes project root");
  }
  return abs;
}

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "design-brief";
}

function createStdioJsonRpcTransport(stdin, stdout) {
  const listeners = {
    request: [],
    error: [],
  };

  let buf = Buffer.alloc(0);
  let started = false;

  function emit(type, payload) {
    for (const fn of listeners[type]) fn(payload);
  }

  function onData(chunk) {
    buf = Buffer.concat([buf, chunk]);
    while (true) {
      const headerEnd = buf.indexOf("\r\n\r\n");
      if (headerEnd < 0) return;
      const headerBuf = buf.subarray(0, headerEnd).toString("utf8");
      const m = headerBuf.match(/Content-Length:\s*(\d+)/i);
      if (!m) {
        emit("error", new Error("missing Content-Length header"));
        buf = Buffer.alloc(0);
        return;
      }
      const length = Number(m[1]);
      const bodyStart = headerEnd + 4;
      if (buf.length < bodyStart + length) return;
      const bodyBuf = buf.subarray(bodyStart, bodyStart + length);
      buf = buf.subarray(bodyStart + length);
      try {
        const parsed = JSON.parse(bodyBuf.toString("utf8"));
        emit("request", parsed);
      } catch (err) {
        emit("error", err);
      }
    }
  }

  function writeMessage(message) {
    const body = Buffer.from(JSON.stringify(message), "utf8");
    const header = Buffer.from(
      `Content-Length: ${body.length}\r\nContent-Type: application/json\r\n\r\n`,
      "utf8",
    );
    stdout.write(Buffer.concat([header, body]));
  }

  return {
    start() {
      if (started) return;
      started = true;
      stdin.on("data", onData);
      stdin.on("error", (err) => emit("error", err));
      stdin.resume();
    },
    onRequest(fn) {
      listeners.request.push(fn);
    },
    onError(fn) {
      listeners.error.push(fn);
    },
    sendResponse(id, result) {
      writeMessage({ jsonrpc: "2.0", id, result });
    },
    sendError(id, code, message) {
      writeMessage({
        jsonrpc: "2.0",
        id,
        error: { code, message },
      });
    },
  };
}
