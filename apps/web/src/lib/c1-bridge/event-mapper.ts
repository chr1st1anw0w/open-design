import type { DaemonAgentPayload, PersistedAgentEvent } from '@open-design/contracts';
import { parseTodoWriteInput } from '../../runtime/todos';

export interface C1BridgeEvent {
  type: string;
  payload?: unknown;
}

export type C1ComponentName =
  | 'CLIBadge'
  | 'TodoWriteCard'
  | 'BashCard'
  | 'FileCard'
  | 'ArtifactChip';

export type C1ToolStatus = 'executing' | 'complete' | 'error' | 'inProgress';

export type C1ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'thinking'; text: string }
  | { type: 'status'; text: string }
  | { type: 'raw'; text: string }
  | { type: 'component'; component: C1ComponentName; props: Record<string, unknown> };

type ToolUseEvent = Extract<PersistedAgentEvent, { kind: 'tool_use' }>;
type ToolResultEvent = Extract<PersistedAgentEvent, { kind: 'tool_result' }>;

export function mapDaemonEventToC1Xml(event: C1BridgeEvent | DaemonAgentPayload): string {
  return serializeC1BlocksToXml(mapDaemonEventToC1Blocks(event));
}

export function mapDaemonEventToC1Blocks(event: C1BridgeEvent | DaemonAgentPayload): C1ContentBlock[] {
  const type = event.type;
  const record = event as Record<string, unknown>;
  if (type === 'text_delta' && typeof record.delta === 'string') {
    return [{ type: 'text', text: record.delta }];
  }
  if (type === 'thinking_delta' && typeof record.delta === 'string') {
    return [{ type: 'thinking', text: record.delta }];
  }
  if (type === 'thinking_start') {
    return [{ type: 'status', text: 'thinking' }];
  }
  if (type === 'status' && typeof record.label === 'string') {
    return [{ type: 'status', text: [record.label, typeof record.detail === 'string' ? record.detail : ''].filter(Boolean).join(': ') }];
  }
  if (type === 'tool_use' && typeof record.name === 'string') {
    return [toolUseToBlock({
      kind: 'tool_use',
      id: typeof record.id === 'string' ? record.id : '',
      name: record.name,
      input: record.input,
    })];
  }
  if (type === 'tool_result' && typeof record.toolUseId === 'string') {
    return [{
      type: 'component',
      component: 'CLIBadge',
      props: {
        label: Boolean(record.isError) ? 'Tool error' : 'Tool result',
        tone: Boolean(record.isError) ? 'danger' : 'neutral',
        detail: typeof record.content === 'string' ? record.content : '',
        toolUseId: record.toolUseId,
      },
    }];
  }
  if (type === 'live_artifact') {
    return [{
      type: 'component',
      component: 'ArtifactChip',
      props: {
        action: record.action ?? null,
        artifactId: record.artifactId ?? null,
        title: typeof record.title === 'string' ? record.title : '',
        projectId: record.projectId ?? null,
        refreshStatus: record.refreshStatus ?? null,
      },
    }];
  }
  if (type === 'live_artifact_refresh') {
    return [{
      type: 'component',
      component: 'ArtifactChip',
      props: {
        phase: record.phase ?? null,
        artifactId: record.artifactId ?? null,
        title: typeof record.title === 'string' ? record.title : '',
        projectId: record.projectId ?? null,
        error: record.error ?? null,
      },
    }];
  }
  if (type === 'usage') {
    return [{
      type: 'component',
      component: 'CLIBadge',
      props: {
        label: 'Usage',
        tone: 'neutral',
        detail: JSON.stringify({
          usage: record.usage ?? null,
          costUsd: record.costUsd ?? null,
          durationMs: record.durationMs ?? null,
        }),
      },
    }];
  }
  if (type === 'raw' && typeof record.line === 'string') {
    return [{ type: 'raw', text: record.line }];
  }
  return [{
    type: 'text',
    text: JSON.stringify('payload' in event ? (event.payload ?? { type }) : { type }),
  }];
}

export function mapAgentEventsToC1Blocks(
  events: PersistedAgentEvent[] | undefined,
  runStreaming = false,
): C1ContentBlock[] {
  if (!events?.length) return [];
  const resultByToolId = new Map<string, ToolResultEvent>();
  for (const event of events) {
    if (event.kind === 'tool_result') resultByToolId.set(event.toolUseId, event);
  }
  const blocks: C1ContentBlock[] = [];
  for (const event of events) {
    if (event.kind === 'text') {
      if (event.text) blocks.push({ type: 'text', text: event.text });
      continue;
    }
    if (event.kind === 'thinking') {
      if (event.text) blocks.push({ type: 'thinking', text: event.text });
      continue;
    }
    if (event.kind === 'status') {
      blocks.push({ type: 'status', text: [event.label, event.detail].filter(Boolean).join(': ') });
      continue;
    }
    if (event.kind === 'tool_use') {
      blocks.push(toolUseToBlock(event, resultByToolId.get(event.id), runStreaming));
      continue;
    }
    if (event.kind === 'tool_result') continue;
    if (event.kind === 'live_artifact') {
      blocks.push({
        type: 'component',
        component: 'ArtifactChip',
        props: {
          action: event.action,
          artifactId: event.artifactId,
          title: event.title,
          projectId: event.projectId,
          refreshStatus: event.refreshStatus ?? null,
        },
      });
      continue;
    }
    if (event.kind === 'live_artifact_refresh') {
      blocks.push({
        type: 'component',
        component: 'ArtifactChip',
        props: {
          phase: event.phase,
          artifactId: event.artifactId,
          title: event.title ?? '',
          projectId: event.projectId,
          error: event.error ?? null,
        },
      });
      continue;
    }
    if (event.kind === 'usage') {
      blocks.push({
        type: 'component',
        component: 'CLIBadge',
        props: {
          label: 'Usage',
          tone: 'neutral',
          detail: JSON.stringify({
            inputTokens: event.inputTokens ?? null,
            outputTokens: event.outputTokens ?? null,
            costUsd: event.costUsd ?? null,
            durationMs: event.durationMs ?? null,
          }),
        },
      });
      continue;
    }
    if (event.kind === 'raw') {
      blocks.push({ type: 'raw', text: event.line });
    }
  }
  return blocks;
}

export function serializeC1BlocksToXml(blocks: C1ContentBlock[]): string {
  return blocks.map(serializeC1BlockToXml).join('');
}

export function serializeC1BlockToXml(block: C1ContentBlock): string {
  if (block.type === 'component') {
    return `<content-block type="component" component="${escapeXml(block.component)}">${escapeXml(JSON.stringify(block.props))}</content-block>`;
  }
  return `<content-block type="${block.type}">${escapeXml(block.text)}</content-block>`;
}

function toolUseToBlock(
  event: ToolUseEvent,
  result?: ToolResultEvent,
  runStreaming = true,
): C1ContentBlock {
  const status = deriveToolStatus(result, runStreaming);
  const toolName = event.name.toLowerCase();
  if (toolName === 'todowrite') {
    return {
      type: 'component',
      component: 'TodoWriteCard',
      props: {
        items: parseTodoWriteInput(event.input),
        status,
        resultText: result?.content,
        isError: result?.isError ?? false,
      },
    };
  }
  if (toolName === 'bash') {
    const input = toRecord(event.input);
    return {
      type: 'component',
      component: 'BashCard',
      props: {
        command: readString(input, ['command']) ?? '',
        description: readString(input, ['description']) ?? '',
        status,
        output: result?.content ?? '',
        isError: result?.isError ?? false,
      },
    };
  }
  if (toolName === 'write' || toolName === 'create_file' || toolName === 'edit' || toolName === 'str_replace_edit' || toolName === 'read' || toolName === 'read_file') {
    const input = toRecord(event.input);
    const filePath = readString(input, ['file_path', 'filePath', 'path']) ?? '(unnamed)';
    const content = readString(input, ['content']);
    const edits = Array.isArray(input.edits) ? input.edits.length : undefined;
    const operation = toolName.includes('edit') ? 'edit' : toolName.includes('read') ? 'read' : 'write';
    return {
      type: 'component',
      component: 'FileCard',
      props: {
        operation,
        path: filePath,
        summary:
          operation === 'write'
            ? content ? `${content.split('\n').length} lines` : undefined
            : operation === 'edit'
              ? `${edits ?? 1} changes`
              : undefined,
        status,
        resultText: result?.content ?? '',
        isError: result?.isError ?? false,
      },
    };
  }
  return {
    type: 'component',
    component: 'CLIBadge',
    props: {
      label: event.name,
      tone: result?.isError ? 'danger' : 'neutral',
      detail: JSON.stringify(event.input ?? null),
      status,
      resultText: result?.content ?? '',
    },
  };
}

function deriveToolStatus(result: ToolResultEvent | undefined, runStreaming: boolean): C1ToolStatus {
  if (result) return result.isError ? 'error' : 'complete';
  return runStreaming ? 'executing' : 'inProgress';
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function readString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value) return value;
  }
  return undefined;
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
