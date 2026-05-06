#!/usr/bin/env node
/**
 * Reads all JSON files from prompt-templates/image/ and generates a
 * consolidated prompt-gallery.json for the Workbench gallery UI.
 *
 * Usage:
 *   node --experimental-strip-types scripts/build-prompt-gallery.ts
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "prompt-templates", "image");
const OUT_FILE = path.join(
  ROOT,
  "apps/web/src/garden/gpt-image2/data/prompt-gallery.json",
);

interface RawTemplate {
  id: string;
  surface: string;
  title: string;
  summary?: string;
  category: string;
  tags?: string[];
  model?: string;
  aspect?: string;
  prompt: string;
  previewImageUrl?: string;
  source?: {
    repo?: string;
    license?: string;
    author?: string;
    url?: string;
  };
}

interface GalleryItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  model: string;
  aspect: string;
  prompt: string;
  previewImageUrl?: string;
  source: {
    repo: string;
    license: string;
    author: string;
    url: string;
  };
}

interface GalleryManifest {
  generated_at: string;
  total: number;
  categories: string[];
  items: GalleryItem[];
}

async function main() {
  const files = (await readdir(SRC_DIR)).filter((f) => f.endsWith(".json"));

  const items: GalleryItem[] = [];
  for (const file of files) {
    const raw = JSON.parse(
      await readFile(path.join(SRC_DIR, file), "utf8"),
    ) as RawTemplate;

    if (!raw.id || !raw.prompt || !raw.title) continue;

    items.push({
      id: raw.id,
      title: raw.title,
      summary: raw.summary ?? raw.title,
      category: raw.category ?? "Illustration",
      tags: raw.tags ?? [],
      model: raw.model ?? "gpt-image-2",
      aspect: raw.aspect ?? "1:1",
      prompt: raw.prompt,
      previewImageUrl: raw.previewImageUrl,
      source: {
        repo: raw.source?.repo ?? "",
        license: raw.source?.license ?? "CC-BY-4.0",
        author: raw.source?.author ?? "",
        url: raw.source?.url ?? "",
      },
    });
  }

  items.sort(
    (a, b) =>
      a.category.localeCompare(b.category) || a.title.localeCompare(b.title),
  );

  const categories = [...new Set(items.map((i) => i.category))].sort();

  const manifest: GalleryManifest = {
    generated_at: new Date().toISOString(),
    total: items.length,
    categories,
    items,
  };

  await writeFile(OUT_FILE, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(
    `✅ prompt-gallery.json — ${items.length} items, ${categories.length} categories`,
  );
  console.log(`   Categories: ${categories.join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
