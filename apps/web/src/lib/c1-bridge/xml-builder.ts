export function buildC1TextChunk(text: string): string {
  return `<response><content-block type="text">${escapeXml(text)}</content-block></response>`;
}

export function buildC1ResponseChunk(block: string): string {
  return `<response>${block}</response>`;
}

function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
