import type http from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { startServer } from '../src/server.js';

describe('POST /api/skills/sync-desktop', () => {
  let server: http.Server;
  let baseUrl: string;
  const tempDirs: string[] = [];

  beforeAll(async () => {
    const started = (await startServer({ port: 0, returnServer: true })) as {
      url: string;
      server: http.Server;
    };
    baseUrl = started.url;
    server = started.server;
  });

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  function makeDir(prefix: string): string {
    const d = mkdtempSync(path.join(tmpdir(), prefix));
    tempDirs.push(d);
    return d;
  }

  async function syncSkills(body: unknown) {
    return fetch(`${baseUrl}/api/skills/sync-desktop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('supports dry-run and apply with managed manifest output', async () => {
    const source = makeDir('od-sync-src-');
    const target = makeDir('od-sync-tgt-');
    await mkdir(path.join(source, 'alpha'), { recursive: true });
    await writeFile(path.join(source, 'alpha', 'SKILL.md'), '# Alpha\n');
    await writeFile(path.join(source, 'alpha', 'assets.txt'), 'hello');

    const dryRunResp = await syncSkills({
      dryRun: true,
      sourceDir: source,
      targetDir: target,
    });
    expect(dryRunResp.status).toBe(200);
    const dryRunBody = (await dryRunResp.json()) as {
      added: number;
      dryRun: boolean;
    };
    expect(dryRunBody.dryRun).toBe(true);
    expect(dryRunBody.added).toBe(1);

    const applyResp = await syncSkills({
      dryRun: false,
      sourceDir: source,
      targetDir: target,
    });
    expect(applyResp.status).toBe(200);
    const applyBody = (await applyResp.json()) as {
      added: number;
      updated: number;
      unchanged: number;
      deleted: number;
      dryRun: boolean;
    };
    expect(applyBody.dryRun).toBe(false);
    expect(applyBody.added).toBe(1);
    expect(applyBody.deleted).toBe(0);

    const manifestRaw = await readFile(path.join(target, '.open-design-skill-sync.json'), 'utf8');
    expect(manifestRaw).toContain('open-design-tools-dev');
  });
});

