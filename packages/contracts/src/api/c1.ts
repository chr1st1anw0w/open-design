import type { SseTransportEvent } from '../sse/common';

export interface C1Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface C1AssistantRequest {
  messages: C1Message[];
  activeProjectId?: string | null;
  activeFile?: string | null;
  activeSkillId?: string | null;
  activeDesignSystemId?: string | null;
  attachments?: string[];
  model?: string | null;
}

export interface C1AssistantResponse {
  id: string;
  content: string;
  finishReason: 'end_turn' | 'max_tokens' | 'error' | 'stop_sequence';
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export type C1TokenEvent = SseTransportEvent<'token', { text: string }>;
export type C1ToolCallEvent = SseTransportEvent<'tool-call', { id: string; name: string; input: unknown }>;
export type C1ToolResultEvent = SseTransportEvent<'tool-result', { toolCallId: string; content: string; isError: boolean }>;
export type C1DoneEvent = SseTransportEvent<'done', C1AssistantResponse>;
export type C1ErrorEvent = SseTransportEvent<'error', { code: string; message: string }>;

export type C1SseEvent =
  | C1TokenEvent
  | C1ToolCallEvent
  | C1ToolResultEvent
  | C1DoneEvent
  | C1ErrorEvent;
