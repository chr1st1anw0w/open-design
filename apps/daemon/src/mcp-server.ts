import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import path from "node:path";
import fs from "node:fs/promises";
import { resolveProjectRoot } from "./server.js";

// Ensure files are written within project root
async function isWithinProject(projectRoot: string, targetPath: string): Promise<boolean> {
  const resolvedTarget = path.resolve(projectRoot, targetPath);
  if (!resolvedTarget.startsWith(projectRoot)) {
    return false;
  }
  return true;
}

export async function runMcpServer(projectRoot: string) {
  const server = new Server(
    {
      name: "antigravity-perplexity-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "od_health",
        description: "Health check for MCP server",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "od_agents_list",
        description: "List available Open Design agents and their capabilities.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "od_skills_list",
        description: "List available skills that can be used by agents.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "od_route_task",
        description: "Analyze a task description and recommend the best agent/skill combination.",
        inputSchema: {
          type: "object",
          properties: {
            task: { type: "string" }
          },
          required: ["task"]
        },
      },
      {
        name: "od_generate_design_brief",
        description: "Generate a structured design brief based on user requirements.",
        inputSchema: {
          type: "object",
          properties: {
            requirements: { type: "string" },
            projectId: { type: "string" }
          },
          required: ["requirements", "projectId"]
        },
      },
      {
        name: "od_run_agent",
        description: "Run a specific agent to execute a task.",
        inputSchema: {
          type: "object",
          properties: {
            agentId: { type: "string" },
            task: { type: "string" },
            cwd: { type: "string" }
          },
          required: ["agentId", "task"]
        },
      },
      {
        name: "od_cancel_run",
        description: "Cancel a running agent task.",
        inputSchema: {
          type: "object",
          properties: {
            runId: { type: "string" }
          },
          required: ["runId"]
        },
      },
      {
        name: "od_write_requirement_doc",
        description: "Write or update a requirement document in the project.",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "string" },
            fileName: { type: "string" },
            content: { type: "string" }
          },
          required: ["projectId", "fileName", "content"]
        },
      },
      {
        name: "od_read_project_doc",
        description: "Read a specific document from the project.",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "string" },
            fileName: { type: "string" }
          },
          required: ["projectId", "fileName"]
        },
      },
      {
        name: "od_execution_validate_adapter",
        description: "Validate if an adapter is allowed to run.",
        inputSchema: {
          type: "object",
          properties: {
            adapterId: { type: "string" }
          },
          required: ["adapterId"]
        }
      }
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    switch (request.params.name) {
      case "od_health":
        return {
          content: [{ type: "text", text: JSON.stringify({ ok: true }) }],
        };
      
      case "od_agents_list":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify([
                { id: "codex", name: "Codex", description: "Advanced coding agent", capabilities: ["code_review", "fix"] },
                { id: "claude-code", name: "Claude Code", description: "Anthropic coding assistant", capabilities: ["chat", "edit"] },
                { id: "api-fallback", name: "API Fallback", description: "Basic LLM fallback", capabilities: ["chat"] }
              ], null, 2),
            },
          ],
        };

      case "od_skills_list":
        return {
          content: [{ type: "text", text: JSON.stringify([{ id: "placeholder", name: "Placeholder", description: "List skills", category: "demo" }]) }],
        };
        
      case "od_route_task":
        return {
          content: [{ type: "text", text: JSON.stringify({ recommendedAgentId: "codex", recommendedSkillIds: [], reasoning: "Default P0 routing." }) }]
        };
        
      case "od_generate_design_brief":
        const { requirements, projectId } = request.params.arguments as any;
        const briefPath = path.join(projectRoot, "specs", "current", `brief_${projectId}.md`);
        if (!await isWithinProject(projectRoot, briefPath)) {
          return { content: [{ type: "text", text: JSON.stringify({ error: "Path is outside project root." }) }], isError: true };
        }
        await fs.writeFile(briefPath, `# Design Brief\n\n${requirements}\n`);
        return { content: [{ type: "text", text: JSON.stringify({ briefContent: requirements, filePath: briefPath }) }] };
        
      case "od_run_agent":
        return {
          content: [{ type: "text", text: JSON.stringify({ error: "not_implemented", message: "Execution transport is deferred in P0. Continue with planning/document tools and enable execution in P1." }) }]
        };

      case "od_cancel_run":
        return { content: [{ type: "text", text: JSON.stringify({ status: "cancelled" }) }] };

      case "od_write_requirement_doc": {
        const { projectId: writeProjectId, fileName: writeFileName, content } = request.params.arguments as any;
        const writePath = path.join(projectRoot, "specs", "current", writeFileName);
        if (!await isWithinProject(projectRoot, writePath)) {
          return { content: [{ type: "text", text: JSON.stringify({ error: "Tool input is invalid or path is outside project root." }) }], isError: true };
        }
        await fs.mkdir(path.dirname(writePath), { recursive: true });
        await fs.writeFile(writePath, content);
        return { content: [{ type: "text", text: JSON.stringify({ success: true, filePath: writePath }) }] };
      }

      case "od_read_project_doc": {
        const { projectId: readProjectId, fileName: readFileName } = request.params.arguments as any;
        const readPath = path.join(projectRoot, "specs", "current", readFileName);
        if (!await isWithinProject(projectRoot, readPath)) {
          return { content: [{ type: "text", text: JSON.stringify({ error: "Tool input is invalid or path is outside project root." }) }], isError: true };
        }
        try {
          const fileContent = await fs.readFile(readPath, "utf-8");
          return { content: [{ type: "text", text: JSON.stringify({ content: fileContent }) }] };
        } catch (error) {
          return { content: [{ type: "text", text: JSON.stringify({ error: "File not found or unreadable." }) }], isError: true };
        }
      }

      case "od_execution_validate_adapter": {
        const { adapterId } = request.params.arguments as any;
        const allowed = ["codex", "claude-code", "api-fallback"].includes(adapterId);
        return { content: [{ type: "text", text: JSON.stringify({ allowed }) }] };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Antigravity MCP server running on stdio");
}
