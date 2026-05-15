export interface C1ThreadRecord {
  id: string;
  title: string;
  createdAt: number;
}

const threadStore = new Map<string, C1ThreadRecord>();

export function listC1Threads(): C1ThreadRecord[] {
  return Array.from(threadStore.values());
}

export function upsertC1Thread(record: C1ThreadRecord): C1ThreadRecord {
  threadStore.set(record.id, record);
  return record;
}

export function getC1Thread(id: string): C1ThreadRecord | null {
  return threadStore.get(id) ?? null;
}
