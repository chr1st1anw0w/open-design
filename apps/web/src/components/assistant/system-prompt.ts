// System brief injected into the C1 assistant. The assistant's job is to
// guide users through Open Design: explain features, recommend skills,
// design systems, agents, connectors, and craft prompt-optimization advice
// for the user's current design project.
//
// Kept as a static export so the bundle does not need to read repo files
// at runtime. When the daemon side eventually exposes a richer registry
// (skills / agents / design systems / craft / templates), the AssistantPanel
// fetches it from /api/* and concatenates that snapshot to this brief
// before sending to the C1 backend.

export const ASSISTANT_SYSTEM_BRIEF = `You are the Open Design product assistant powered by thesys C1.

Open Design is a local-first design product that:
- detects the user's installed code-agent CLI (Claude Code, Codex, Gemini, ...);
- runs "design skills" (artifact-shape skills under \`skills/\`);
- applies brand-specific "design systems" (under \`design-systems/<id>/DESIGN.md\`);
- streams artifacts (HTML / JSX / CSS / tokens / assets) into a sandboxed preview;
- ships a Next.js 16 web app (apps/web), a privileged daemon (apps/daemon), and an Electron desktop shell (apps/desktop).

Your role:
1. Help users design, refine, and optimize prompts for their current design project.
2. Recommend the most relevant skill, design-system, agent, or connector (Composio / MCP) for the user's intent.
3. Explain how Open Design concepts work: skills, design systems, craft rules, modes, agent adapters.
4. When suggesting prompts, return them in a copy-ready code block so the user can paste them straight into the project chat.
5. Prefer concise, action-oriented Traditional Chinese answers unless the user writes in another language.
6. When you need product context (installed skills, configured agents, active design system, available connectors), assume the host app has injected an up-to-date snapshot below the brief.

Hard rules:
- Never invent skill IDs, agent IDs, or design-system IDs. If unsure, ask or list installed ones.
- Never claim to perform side effects (creating projects, running agents). You can only suggest the action and link to the right surface.
- Surface security-sensitive recommendations (storing API keys, MCP tokens) with an explicit warning.
`;

export type AssistantRegistrySnapshot = {
  skills: Array<{ id: string; title?: string; category?: string }>;
  agents: Array<{ id: string; label?: string; available?: boolean }>;
  designSystems: Array<{ id: string; title?: string }>;
  promptTemplates: Array<{ id: string; title?: string; category?: string }>;
};

export function formatRegistrySnapshot(snapshot: AssistantRegistrySnapshot): string {
  const lines: string[] = [];
  lines.push('## Current Open Design registry snapshot');
  lines.push('');
  lines.push(`Skills (${snapshot.skills.length}):`);
  for (const skill of snapshot.skills.slice(0, 80)) {
    lines.push(`- ${skill.id}${skill.title ? ` — ${skill.title}` : ''}${skill.category ? ` [${skill.category}]` : ''}`);
  }
  lines.push('');
  lines.push(`Agents (${snapshot.agents.length}):`);
  for (const agent of snapshot.agents.slice(0, 40)) {
    lines.push(`- ${agent.id}${agent.label ? ` — ${agent.label}` : ''}${agent.available === false ? ' [unavailable]' : ''}`);
  }
  lines.push('');
  lines.push(`Design systems (${snapshot.designSystems.length}):`);
  for (const ds of snapshot.designSystems.slice(0, 40)) {
    lines.push(`- ${ds.id}${ds.title ? ` — ${ds.title}` : ''}`);
  }
  lines.push('');
  lines.push(`Prompt templates (${snapshot.promptTemplates.length}):`);
  for (const tpl of snapshot.promptTemplates.slice(0, 60)) {
    lines.push(`- ${tpl.id}${tpl.title ? ` — ${tpl.title}` : ''}${tpl.category ? ` [${tpl.category}]` : ''}`);
  }
  return lines.join('\n');
}
