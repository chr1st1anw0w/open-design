import type { ChatRequest } from '@open-design/contracts';
import { mapDaemonEventToC1Xml } from '../../../src/lib/c1-bridge/event-mapper';
import { buildC1ResponseChunk, buildC1TextChunk } from '../../../src/lib/c1-bridge/xml-builder';
import { parseSseFrame } from '../../../src/providers/sse';

const DAEMON_ORIGIN = `http://127.0.0.1:${Number(process.env.OD_PORT) || 7456}`;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Partial<ChatRequest>;
  const createResp = await fetch(`${DAEMON_ORIGIN}/api/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-OD-Client': 'web',
    },
    body: JSON.stringify({
      agentId: body.agentId ?? 'codex',
      message: body.message ?? '',
      currentPrompt: body.currentPrompt ?? body.message ?? '',
      projectId: body.projectId ?? null,
      conversationId: body.conversationId ?? null,
      assistantMessageId: body.assistantMessageId ?? null,
      clientRequestId: body.clientRequestId ?? null,
      skillId: body.skillId ?? null,
      designSystemId: body.designSystemId ?? null,
      attachments: body.attachments ?? [],
      commentAttachments: body.commentAttachments ?? [],
      model: body.model ?? null,
      reasoning: body.reasoning ?? null,
      ...(body.research ? { research: body.research } : {}),
    }),
  });

  if (!createResp.ok) {
    const text = await createResp.text().catch(() => '');
    return Response.json({ error: text || 'Failed to create daemon run' }, { status: createResp.status });
  }

  const created = await createResp.json() as { runId: string };
  const eventsResp = await fetch(`${DAEMON_ORIGIN}/api/runs/${encodeURIComponent(created.runId)}/events`);
  if (!eventsResp.ok || !eventsResp.body) {
    return Response.json({ error: 'Failed to stream daemon events', runId: created.runId }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = eventsResp.body.getReader();
  let buf = '';
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (true) {
        const delimiterIndex = buf.indexOf('\n\n');
        if (delimiterIndex !== -1) {
          const frame = buf.slice(0, delimiterIndex);
          buf = buf.slice(delimiterIndex + 2);
          const parsed = parseSseFrame(frame);
          if (!parsed || parsed.kind !== 'event') continue;
          const chunk = mapFrameToC1Chunk(parsed.event, parsed.data);
          if (!chunk) continue;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ runId: created.runId, delta: chunk })}\n\n`));
          return;
        }
        const { value, done } = await reader.read();
        if (done) {
          if (buf.trim()) {
            const parsed = parseSseFrame(buf.trim());
            if (parsed && parsed.kind === 'event') {
              const chunk = mapFrameToC1Chunk(parsed.event, parsed.data);
              if (chunk) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ runId: created.runId, delta: chunk })}\n\n`));
            }
          }
          controller.close();
          return;
        }
        buf += decoder.decode(value, { stream: true });
      }
    },
    cancel() {
      void reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

export async function GET() {
  return Response.json({ ok: true, bridge: 'c1', status: 'stream-ready', defaultMode: 'c1' });
}

function mapFrameToC1Chunk(event: string, data: Record<string, unknown>): string | null {
  if (event === 'agent') return buildC1ResponseChunk(mapDaemonEventToC1Xml(data as never));
  if (event === 'stdout') return buildC1TextChunk(String(data.chunk ?? ''));
  if (event === 'stderr') return buildC1ResponseChunk(`<content-block type="stderr">${escapeXml(String(data.chunk ?? ''))}</content-block>`);
  if (event === 'start') return buildC1ResponseChunk(`<content-block type="status">run started</content-block>`);
  if (event === 'error') return buildC1ResponseChunk(`<content-block type="error">${escapeXml(String((data.error as { message?: string } | undefined)?.message ?? data.message ?? 'daemon error'))}</content-block>`);
  if (event === 'end') return buildC1ResponseChunk(`<content-block type="status">run ended</content-block>`);
  return null;
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
