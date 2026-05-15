import { getC1Thread } from '../../../../../src/lib/c1-bridge/thread-store';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const thread = getC1Thread(id);
  return thread
    ? Response.json(thread)
    : Response.json({ error: 'Thread not found' }, { status: 404 });
}
