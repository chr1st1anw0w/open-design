import { listC1Threads, upsertC1Thread } from '../../../../src/lib/c1-bridge/thread-store';

export async function GET() {
  return Response.json({ items: listC1Threads() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const id = typeof body?.id === 'string' && body.id ? body.id : crypto.randomUUID();
  const title = typeof body?.title === 'string' && body.title ? body.title : 'Untitled C1 thread';
  const record = upsertC1Thread({ id, title, createdAt: Date.now() });
  return Response.json(record, { status: 201 });
}
