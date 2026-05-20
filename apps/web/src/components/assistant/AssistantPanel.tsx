import { useEffect, useMemo, useState } from 'react';
import { C1Chat } from '@thesysai/genui-sdk';
import {
  fetchAgents,
  fetchDesignSystems,
  fetchPromptTemplates,
  fetchSkills,
} from '../../providers/registry';
import {
  ASSISTANT_SYSTEM_BRIEF,
  formatRegistrySnapshot,
  type AssistantRegistrySnapshot,
} from './system-prompt';

const C1_PROXY_ENDPOINT = '/api/c1/assistant';

const C1_STORAGE_KEYS = {
  systemPrompt: 'od.assistant.system-prompt',
  model: 'od.assistant.model',
  knowledgeBase: 'od.assistant.knowledge-base',
  mode: 'od.assistant.mode',
} as const;

type ProcessMessageParams = Parameters<
  NonNullable<Parameters<typeof C1Chat>[0]['processMessage']>
>[0];

async function buildSnapshot(): Promise<AssistantRegistrySnapshot> {
  const [skills, agents, designSystems, promptTemplates] = await Promise.all([
    fetchSkills().catch(() => []),
    fetchAgents().catch(() => []),
    fetchDesignSystems().catch(() => []),
    fetchPromptTemplates().catch(() => []),
  ]);
  return {
    skills: skills.map((s) => ({
      id: s.id,
      title: (s as { name?: string }).name,
      category: (s as { mode?: string }).mode,
    })),
    agents: agents.map((a) => ({
      id: a.id,
      label: (a as { name?: string }).name,
      available: (a as { available?: boolean }).available,
    })),
    designSystems: designSystems.map((d) => ({
      id: d.id,
      title: (d as { title?: string }).title,
    })),
    promptTemplates: promptTemplates.map((t) => ({
      id: t.id,
      title: (t as { title?: string }).title,
      category: (t as { category?: string }).category,
    })),
  };
}

function readC1Settings(): { customPrompt: string; knowledgeBase: string; model: string; mode: 'cli' | 'byok' } {
  const rawMode = localStorage.getItem(C1_STORAGE_KEYS.mode);
  const mode: 'cli' | 'byok' = rawMode === 'byok' ? 'byok' : 'cli';
  return {
    customPrompt: localStorage.getItem(C1_STORAGE_KEYS.systemPrompt) ?? '',
    knowledgeBase: localStorage.getItem(C1_STORAGE_KEYS.knowledgeBase) ?? '',
    model: localStorage.getItem(C1_STORAGE_KEYS.model) ?? 'gemini-2.5-flash',
    mode,
  };
}

export function AssistantPanel() {
  const [snapshot, setSnapshot] = useState<AssistantRegistrySnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    void buildSnapshot().then((value) => {
      if (!cancelled) setSnapshot(value);
    });
    return () => { cancelled = true; };
  }, []);

  const systemBrief = useMemo(() => {
    const { customPrompt, knowledgeBase } = readC1Settings();
    const parts: string[] = [ASSISTANT_SYSTEM_BRIEF];
    if (snapshot) parts.push(formatRegistrySnapshot(snapshot));
    if (customPrompt.trim()) parts.push(`\n## 自訂指令\n${customPrompt.trim()}`);
    if (knowledgeBase.trim()) parts.push(`\n## 知識庫\n${knowledgeBase.trim()}`);
    return parts.join('\n\n');
  }, [snapshot]);

  const processMessage = useMemo(() => {
    return async ({ threadId, messages, responseId, abortController }: ProcessMessageParams): Promise<Response> => {
      const { model, mode } = readC1Settings();
      try {
        const response = await fetch(C1_PROXY_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            threadId,
            responseId,
            systemBrief,
            messages,
            model,
            mode,
          }),
          signal: abortController.signal,
        });
        if (!response.ok) {
          const errText = await response.text().catch(() => `HTTP ${response.status}`);
          return new Response(errText || `HTTP ${response.status}`, {
            status: 200,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        }
        return response;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return new Response(msg, {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    };
  }, [systemBrief]);

  return (
    <div className="assistant-panel-c1" data-testid="assistant-panel">
      <C1Chat
        formFactor="side-panel"
        agentName="Open Design Assistant"
        processMessage={processMessage}
        welcomeMessage={{
          title: 'Hi, 我是 Open Design 助理',
          description:
            '我可以幫你優化提示詞、推薦合適的 skill / design system / agent / connector，並回答 Open Design 使用方式。',
        }}
        conversationStarters={{
          variant: 'short',
          options: [
            {
              displayText: '幫我優化目前專案的提示詞',
              prompt:
                '我正在使用 Open Design 設計一個新專案。請依目前已啟用的 skill 與 design system，幫我把以下需求改寫成更精準的提示詞：\n\n[在此貼上你的原始需求]',
            },
            {
              displayText: '推薦適合的 skill 與 design system',
              prompt:
                '我想做一個 landing page 風格的設計，請從目前已安裝的 skills 與 design systems 中推薦最匹配的組合，並說明選擇理由。',
            },
            {
              displayText: '我需要哪些連接器（MCP / Composio）？',
              prompt:
                '請依我即將進行的設計任務，建議要加哪些 Composio / MCP connector 才能讓 agent 順利工作。',
            },
            {
              displayText: '解釋 Open Design 的核心概念',
              prompt:
                '請用一段話依序說明 Open Design 的 skill、design system、craft、modes、agent adapters 是什麼以及彼此關係。',
            },
          ],
        }}
      />
    </div>
  );
}
