import {
  emptyManualEditStyles,
  type DiffLine,
  type DiffLineKind,
  type LockedLine,
  type ManualEditFields,
  type ManualEditPatch,
  type ManualEditStyles,
  type SourcePatch,
} from './types';

export interface ManualEditPatchResult {
  ok: boolean;
  source: string;
  error?: string;
}

interface DiffOp {
  kind: 'equal' | 'remove' | 'add';
  line: string;
}

export function applyManualEditPatch(source: string, patch: ManualEditPatch): ManualEditPatchResult {
  if (patch.kind === 'set-full-source') return { ok: true, source: patch.source };

  const doc = parseSource(source);
  if (!doc) return { ok: false, source, error: 'Could not parse source.' };

  if (patch.kind === 'set-token') {
    const changed = setCssToken(doc, patch.token, patch.value);
    return changed
      ? { ok: true, source: serializeSource(doc, source) }
      : { ok: false, source, error: `Token not found: ${patch.token}` };
  }

  const el = findEditableElement(doc, patch.id);
  if (!el) return { ok: false, source, error: `Target not found: ${patch.id}` };

  if (patch.kind === 'set-text') {
    if (hasElementChildren(el)) {
      return { ok: false, source, error: 'This element contains nested markup. Use the HTML tab instead.' };
    }
    el.textContent = patch.value;
  } else if (patch.kind === 'set-link') {
    if (hasElementChildren(el)) {
      const currentText = el.textContent?.trim() ?? '';
      if (patch.text.trim() !== currentText) {
        return { ok: false, source, error: 'This link contains nested markup. Use the HTML tab to change its label.' };
      }
    } else {
      el.textContent = patch.text;
    }
    el.setAttribute('href', patch.href);
  } else if (patch.kind === 'set-image') {
    el.setAttribute('src', patch.src);
    el.setAttribute('alt', patch.alt);
  } else if (patch.kind === 'set-style') {
    setInlineStyles(el as HTMLElement, patch.styles);
  } else if (patch.kind === 'set-attributes') {
    setAttributes(el, patch.attributes);
  } else if (patch.kind === 'set-outer-html') {
    const replaced = replaceOuterHtml(doc, el, patch.html);
    if (!replaced.ok) return { ok: false, source, error: replaced.error };
  }

  return { ok: true, source: serializeSource(doc, source) };
}

export function readManualEditFields(source: string, id: string): ManualEditFields {
  const doc = parseSource(source);
  const el = doc ? findEditableElement(doc, id) : null;
  if (!el) return {};
  const kind = inferKind(el);
  if (kind === 'link') {
    return {
      text: el.textContent?.trim() ?? '',
      href: el.getAttribute('href') ?? '',
    };
  }
  if (kind === 'image') {
    return {
      src: el.getAttribute('src') ?? '',
      alt: el.getAttribute('alt') ?? '',
    };
  }
  return { text: el.textContent?.trim() ?? '' };
}

export function readManualEditStyles(source: string, id: string): ManualEditStyles {
  const doc = parseSource(source);
  const el = doc ? findEditableElement(doc, id) : null;
  if (!el) return emptyManualEditStyles();
  const style = (el as HTMLElement).style;
  return {
    color: style.color,
    backgroundColor: style.backgroundColor,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    textAlign: style.textAlign,
    padding: style.padding,
    margin: style.margin,
    borderRadius: style.borderRadius,
    border: style.border,
    width: style.width,
    minHeight: style.minHeight,
  };
}

export function readManualEditAttributes(source: string, id: string): Record<string, string> {
  const doc = parseSource(source);
  const el = doc ? findEditableElement(doc, id) : null;
  if (!el) return {};
  const attrs: Record<string, string> = {};
  Array.from(el.attributes).forEach((attr) => {
    if (attr.name === 'data-od-runtime-id') return;
    attrs[attr.name] = attr.value;
  });
  return attrs;
}

export function readManualEditOuterHtml(source: string, id: string): string {
  const doc = parseSource(source);
  return (doc ? findEditableElement(doc, id)?.outerHTML : '') ?? '';
}

export function buildSourcePatch(input: {
  id: string;
  label: string;
  patch: ManualEditPatch;
  baseSource: string;
  aiSource: string;
  manualSource: string;
  targetId?: string;
  sourceBacked?: boolean;
}): SourcePatch {
  const diffLines = buildManualEditDiff(input.baseSource, input.manualSource);
  return {
    id: input.id,
    label: input.label,
    patch: input.patch,
    targetId: input.targetId,
    sourceBacked: Boolean(input.sourceBacked),
    baseSource: input.baseSource,
    aiSource: input.aiSource,
    manualSource: input.manualSource,
    diffLines,
    lockedLines: collectLockedLines(diffLines),
    conflict: input.aiSource !== input.manualSource,
  };
}

export function buildManualEditDiff(beforeSource: string, afterSource: string): DiffLine[] {
  const beforeLines = normalizeDiffLines(beforeSource);
  const afterLines = normalizeDiffLines(afterSource);
  const ops = buildDiffOps(beforeLines, afterLines);
  const diffLines: DiffLine[] = [];
  let beforeNumber = 1;
  let afterNumber = 1;
  for (let index = 0; index < ops.length; index += 1) {
    const current = ops[index]!;
    const next = ops[index + 1];
    if (current.kind === 'remove' && next?.kind === 'add') {
      diffLines.push({
        key: `m-${index}`,
        kind: 'modify',
        beforeNumber,
        afterNumber,
        beforeText: current.line,
        afterText: next.line,
      });
      beforeNumber += 1;
      afterNumber += 1;
      index += 1;
      continue;
    }
    if (current.kind === 'equal') {
      diffLines.push({
        key: `c-${index}`,
        kind: 'context',
        beforeNumber,
        afterNumber,
        beforeText: current.line,
        afterText: current.line,
      });
      beforeNumber += 1;
      afterNumber += 1;
      continue;
    }
    if (current.kind === 'remove') {
      diffLines.push({
        key: `r-${index}`,
        kind: 'remove',
        beforeNumber,
        afterNumber: null,
        beforeText: current.line,
        afterText: '',
      });
      beforeNumber += 1;
      continue;
    }
    diffLines.push({
      key: `a-${index}`,
      kind: 'add',
      beforeNumber: null,
      afterNumber,
      beforeText: '',
      afterText: current.line,
    });
    afterNumber += 1;
  }
  return diffLines;
}

export function collectLockedLines(diffLines: DiffLine[]): LockedLine[] {
  return diffLines
    .filter((line) => line.kind === 'add' || line.kind === 'modify')
    .map((line) => ({
      beforeNumber: line.beforeNumber,
      afterNumber: line.afterNumber,
      lockedBy: 'user' as const,
    }));
}

function parseSource(source: string): Document | null {
  if (typeof DOMParser !== 'undefined') {
    return new DOMParser().parseFromString(source, 'text/html');
  }
  if (typeof document !== 'undefined') {
    const doc = document.implementation.createHTMLDocument('');
    doc.documentElement.innerHTML = source;
    return doc;
  }
  return null;
}

function normalizeDiffLines(source: string): string[] {
  return source.replace(/\r\n/g, '\n').split('\n');
}

function buildDiffOps(beforeLines: string[], afterLines: string[]): DiffOp[] {
  const matrix = Array.from({ length: beforeLines.length + 1 }, () => Array<number>(afterLines.length + 1).fill(0));
  for (let beforeIndex = beforeLines.length - 1; beforeIndex >= 0; beforeIndex -= 1) {
    for (let afterIndex = afterLines.length - 1; afterIndex >= 0; afterIndex -= 1) {
      if (beforeLines[beforeIndex] === afterLines[afterIndex]) {
        matrix[beforeIndex]![afterIndex] = matrix[beforeIndex + 1]![afterIndex + 1]! + 1;
      } else {
        matrix[beforeIndex]![afterIndex] = Math.max(
          matrix[beforeIndex + 1]![afterIndex]!,
          matrix[beforeIndex]![afterIndex + 1]!,
        );
      }
    }
  }
  const ops: DiffOp[] = [];
  let beforeIndex = 0;
  let afterIndex = 0;
  while (beforeIndex < beforeLines.length && afterIndex < afterLines.length) {
    if (beforeLines[beforeIndex] === afterLines[afterIndex]) {
      ops.push({ kind: 'equal', line: beforeLines[beforeIndex]! });
      beforeIndex += 1;
      afterIndex += 1;
      continue;
    }
    if (matrix[beforeIndex + 1]![afterIndex]! >= matrix[beforeIndex]![afterIndex + 1]!) {
      ops.push({ kind: 'remove', line: beforeLines[beforeIndex]! });
      beforeIndex += 1;
    } else {
      ops.push({ kind: 'add', line: afterLines[afterIndex]! });
      afterIndex += 1;
    }
  }
  while (beforeIndex < beforeLines.length) {
    ops.push({ kind: 'remove', line: beforeLines[beforeIndex]! });
    beforeIndex += 1;
  }
  while (afterIndex < afterLines.length) {
    ops.push({ kind: 'add', line: afterLines[afterIndex]! });
    afterIndex += 1;
  }
  return ops;
}

function serializeSource(doc: Document, originalSource: string): string {
  if (!isFullHtmlDocument(originalSource)) return doc.body.innerHTML;
  return `<!doctype html>\n${doc.documentElement.outerHTML}`;
}

function isFullHtmlDocument(source: string): boolean {
  const normalized = firstSourceToken(source).slice(0, 32).toLowerCase();
  return normalized.startsWith('<!doctype') || normalized.startsWith('<html');
}

function firstSourceToken(source: string): string {
  let rest = source.trimStart();
  while (rest.startsWith('<!--') || rest.startsWith('<?')) {
    const close = rest.startsWith('<!--') ? '-->' : '?>';
    const end = rest.indexOf(close);
    if (end === -1) return rest;
    rest = rest.slice(end + close.length).trimStart();
  }
  return rest;
}

function inferKind(el: Element): 'text' | 'link' | 'image' | 'container' {
  const explicit = el.getAttribute('data-od-edit');
  if (explicit === 'text' || explicit === 'link' || explicit === 'image' || explicit === 'container') return explicit;
  const tag = el.tagName.toLowerCase();
  if (tag === 'a') return 'link';
  if (tag === 'img') return 'image';
  if (['section', 'main', 'nav', 'div', 'article', 'header', 'footer'].includes(tag)) return 'container';
  return 'text';
}

function findEditableElement(doc: Document, id: string): Element | null {
  return (
    doc.querySelector(`[data-od-id="${cssEscape(id)}"]`) ??
    doc.querySelector(`[data-od-runtime-id="${cssEscape(id)}"]`) ??
    findElementByPath(doc, id)
  );
}

function findElementByPath(doc: Document, id: string): Element | null {
  if (!id.startsWith('path-')) return null;
  const indexes = id
    .slice('path-'.length)
    .split('-')
    .map((part) => Number(part));
  if (indexes.some((index) => !Number.isInteger(index) || index < 0)) return null;
  let current: Element | null = doc.body;
  for (const index of indexes) {
    current = current?.children.item(index) ?? null;
    if (!current) return null;
  }
  return current;
}

function hasElementChildren(el: Element): boolean {
  return Array.from(el.children).some((child) => child.nodeType === 1);
}

function setInlineStyles(el: HTMLElement, styles: Partial<ManualEditStyles>): void {
  for (const [name, value] of Object.entries(styles)) {
    const cssName = camelToKebab(name);
    if (typeof value !== 'string' || value.trim() === '') el.style.removeProperty(cssName);
    else el.style.setProperty(cssName, value.trim());
  }
}

function setAttributes(el: Element, attributes: Record<string, string>): void {
  const protectedAttrs = new Set(['data-od-id', 'data-od-edit', 'data-od-label', 'data-od-runtime-id']);
  for (const [name, value] of Object.entries(attributes)) {
    if (!isSafeAttributeName(name) || protectedAttrs.has(name)) continue;
    if (value.trim() === '') el.removeAttribute(name);
    else el.setAttribute(name, value);
  }
}

function replaceOuterHtml(doc: Document, el: Element, html: string): { ok: true } | { ok: false; error: string } {
  const template = doc.createElement('template');
  template.innerHTML = html.trim();
  const elements = Array.from(template.content.children);
  if (elements.length !== 1) return { ok: false, error: 'Replacement HTML must contain exactly one root element.' };
  const next = elements[0]!;
  if (el.getAttribute('data-od-id') && !next.getAttribute('data-od-id')) {
    next.setAttribute('data-od-id', el.getAttribute('data-od-id') ?? '');
  }
  if (el.getAttribute('data-od-edit') && !next.getAttribute('data-od-edit')) {
    next.setAttribute('data-od-edit', el.getAttribute('data-od-edit') ?? '');
  }
  el.replaceWith(next);
  return { ok: true };
}

function setCssToken(doc: Document, token: string, value: string): boolean {
  const styles = Array.from(doc.querySelectorAll('style'));
  const pattern = new RegExp(`(${escapeRegExp(token)}\\s*:\\s*)([^;]+)(;)`);
  for (const style of styles) {
    const text = style.textContent ?? '';
    if (!pattern.test(text)) continue;
    style.textContent = text.replace(pattern, `$1${value}$3`);
    return true;
  }
  return false;
}

function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(value);
  return value.replace(/"/g, '\\"');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function camelToKebab(value: string): string {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function isSafeAttributeName(value: string): boolean {
  return /^[a-zA-Z_:][a-zA-Z0-9_:.-]*$/.test(value);
}
