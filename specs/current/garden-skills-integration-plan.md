# Garden Skills Integration Plan

## Goal

Evolve the Garden skill websites into native Open Design sub-features. The first milestone is to run both migrated React experiences inside the Open Design app. The second milestone is to replace Garden-local automation and archive APIs with daemon-backed Open Design services.

## Migrated Sources

- `apps/web/src/garden/web-design/`
  - Source: `/Users/christianwu/garden-skills/dist/web-design-website/src`
  - Route: `/tools/web-design`
  - Assets: `apps/web/public/garden/web-design/`
- `apps/web/src/garden/gpt-image2/`
  - Source: `/Users/christianwu/garden-skills/dist/gpt-image2-website/src`
  - Route: `/tools/gpt-image2`
  - Assets: `apps/web/public/garden/gpt-image2/`

## Integration Model

1. Native React, not iframe.
   - Components compile inside `@open-design/web`.
   - Routes use Open Design's lightweight router.
   - Entry view exposes tool launch buttons.

2. Scoped styling.
   - Garden token files are scoped under `.garden-web-design` and `.garden-gpt-image2`.
   - GPT-Image theme toggling now targets the tool shell instead of `document.documentElement`.

3. Daemon-owned backend namespace.
   - Garden-specific endpoints live under `/api/garden/gpt-image2/*`.
   - Existing Open Design `/api/*` routes remain unambiguous.

## Current Backend Coverage

- `POST /api/garden/gpt-image2/archive`
  - Stores generated archive JSON under Open Design data dir.
- `POST /api/garden/gpt-image2/save-prompt`
  - Stores prompt records under Open Design data dir.
- `GET /api/garden/gpt-image2/list-archive`
  - Lists saved prompt records.
- `GET /api/garden/gpt-image2/load-template-md`
  - Placeholder endpoint for prompt template markdown.
- `POST /api/garden/gpt-image2/generate`
  - Returns a clear 501-style `UPSTREAM_UNAVAILABLE` error until the automation runner is ported.

## Next Backend Work

1. Replace the placeholder `load-template-md` implementation.
   - Parse the migrated GPT-Image template/reference data directly.
   - Return markdown plus placeholder names in the shape expected by Prompt Studio.

2. Port generation.
   - Decide whether Open Design should call a local ChatGPT browser automation runner, OpenAI image API, or the existing media generation service.
   - Store outputs as Open Design project files when invoked from a project context.
   - Store standalone outputs under `.od/garden/gpt-image2/` when invoked from the tool page.

3. Port copilot/refinement.
   - Remove browser-side Gemini key assumptions.
   - Route refinement through Open Design daemon config or existing provider proxy.

4. Connect to projects.
   - Add "Send to current project" from GPT-Image prompt/workbench.
   - Add "Create project from this prompt".
   - Let generated assets appear in Design Files.

## Known Gaps

- `web-design` references `video.mp4`, but the source asset is currently a zero-byte file.
- GPT-Image case gallery has JSON assets migrated; generated image binaries depend on what exists in the source public tree.
- Browser-level visual verification is not yet automated in this repo because Playwright is not an Open Design dependency.
