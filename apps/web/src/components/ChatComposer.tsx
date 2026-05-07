import {
  Children,
  forwardRef,
  type ReactNode,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useT } from '../i18n';
import type { Dict } from '../i18n/types';
import {
  fetchDesignSystem,
  fetchSkill,
  projectRawUrl,
  uploadProjectFiles,
} from "../providers/registry";
import type {
  AppConfig,
  ChatAttachment,
  ChatCommentAttachment,
  DesignSystemSummary,
  ProjectFile,
  SkillSummary,
} from "../types";
import { Icon } from "./Icon";
import { BUILT_IN_PETS, CUSTOM_PET_ID, resolveActivePet } from "./pet/pets";

type TranslateFn = (key: keyof Dict, vars?: Record<string, string | number>) => string;

type ImportPanel = "root" | "skills" | "code" | "components";

type ImportedContext =
  | {
      kind: "skill";
      id: string;
      title: string;
      summary: string;
      body: string;
    }
  | {
      kind: "design-system";
      id: string;
      title: string;
      summary: string;
      body: string;
    }
  | {
      kind: "code-dir";
      id: string;
      title: string;
      summary: string;
      paths: string[];
    };

interface SlashCommand {
  id: string;
  // Visible label, e.g. `/hatch`. Shown in the popover row.
  label: string;
  // Text inserted into the draft when the user picks the entry. The
  // cursor is positioned at the end of `insert`, so a trailing space
  // is the difference between a "ready for argument" command and a
  // "submit immediately" one.
  insert: string;
  // i18n key of the short description shown next to the label.
  descKey: keyof Dict;
  // Optional argument hint shown after the description.
  argHint?: string;
  // Icon glyph from the project Icon set.
  icon: 'sparkles' | 'eye' | 'sliders';
}

interface Props {
  projectId: string | null;
  projectFiles: ProjectFile[];
  skills?: SkillSummary[];
  designSystems?: DesignSystemSummary[];
  streaming: boolean;
  initialDraft?: string;
  // Lazy ensure — the composer calls this before its first upload, so the
  // project folder exists on disk before files land in it. Returns the
  // project id when ready.
  onEnsureProject: () => Promise<string | null>;
  commentAttachments?: ChatCommentAttachment[];
  onRemoveCommentAttachment?: (id: string) => void;
  onSend: (prompt: string, attachments: ChatAttachment[], commentAttachments: ChatCommentAttachment[]) => void;
  onStop: () => void;
  // Opens the global settings dialog (CLI / model / agent picker). The
  // composer's leading gear icon routes here so users can switch models
  // without leaving the chat.
  onOpenSettings?: () => void;
  // Optional pet wiring — when present, the composer renders a small
  // 🐾 button + popover so users can adopt / wake / tuck a pet without
  // leaving chat. Typing `/pet` (or `/pet wake|tuck|<id>`) is parsed
  // out of the draft and routed to the same handlers.
  petConfig?: AppConfig['pet'];
  onAdoptPet?: (petId: string) => void;
  onTogglePet?: () => void;
  onOpenPetSettings?: () => void;
}

// Imperative handle so ancestors (e.g. example chips in ChatPane) can
// push text into the composer without owning its draft state.
export interface ChatComposerHandle {
  setDraft: (text: string) => void;
  focus: () => void;
}

/**
 * The chat composer: textarea + paste/drop/attach buttons + @-mention
 * picker. Attachments are uploaded into the active project's folder so
 * the agent can reference them by relative path on its next turn.
 *
 * `@` typed at a word boundary opens a popover listing project files.
 * Selecting one inserts `@<path>` into the prompt and stages it as an
 * attachment so the daemon also includes it explicitly.
 */
export const ChatComposer = forwardRef<ChatComposerHandle, Props>(
  function ChatComposer(
    {
      projectId,
      projectFiles,
      skills = [],
      designSystems = [],
      streaming,
      initialDraft,
      onEnsureProject,
      commentAttachments = [],
      onRemoveCommentAttachment,
      onSend,
      onStop,
      onOpenSettings,
      petConfig,
      onAdoptPet,
      onTogglePet,
      onOpenPetSettings,
    },
    ref
  ) {
    const t = useT();
    const [draft, setDraft] = useState(initialDraft ?? "");
    const [staged, setStaged] = useState<ChatAttachment[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [mention, setMention] = useState<{
      q: string;
      cursor: number;
    } | null>(null);
    // Slash-command popover state — when the draft starts with `/` and
    // the cursor is still inside that token (no space committed yet),
    // we show a small palette of supported commands. The query is the
    // text after `/` so the user can type-to-filter.
    const [slash, setSlash] = useState<{
      q: string;
      cursor: number;
    } | null>(null);
    const [slashIndex, setSlashIndex] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [importOpen, setImportOpen] = useState(false);
    const [importPanel, setImportPanel] = useState<ImportPanel>("root");
    const [importedContexts, setImportedContexts] = useState<ImportedContext[]>(
      [],
    );
    const [importingContextId, setImportingContextId] = useState<string | null>(
      null,
    );
    const [petOpen, setPetOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const importMenuRef = useRef<HTMLDivElement | null>(null);
    const importTriggerRef = useRef<HTMLButtonElement | null>(null);
    const petMenuRef = useRef<HTMLDivElement | null>(null);
    const petTriggerRef = useRef<HTMLButtonElement | null>(null);
    const petEnabled = Boolean(onAdoptPet && onTogglePet);
    // initialDraft is only honored on the first non-empty value the parent
    // hands us. After we seed once, the composer is fully under user control
    // — re-renders that pass the same prompt back must not reseed. If the
    // initial useState above already consumed a non-empty initialDraft we
    // mark it seeded immediately, so an early clear by the user (typing or
    // backspace before the parent stops passing initialDraft) does not get
    // overwritten by the effect.
    const seededRef = useRef(Boolean(initialDraft));

    useEffect(() => {
      if (seededRef.current) return;
      if (initialDraft && initialDraft !== draft) {
        setDraft(initialDraft);
        seededRef.current = true;
      } else if (initialDraft === undefined) {
        seededRef.current = true;
      }
    }, [initialDraft, draft]);

    useEffect(() => {
      if (!importOpen) return;
      function onPointer(e: MouseEvent) {
        const target = e.target as Node;
        if (importMenuRef.current?.contains(target)) return;
        if (importTriggerRef.current?.contains(target)) return;
        setImportOpen(false);
      }
      function onKey(e: KeyboardEvent) {
        if (e.key === "Escape") setImportOpen(false);
      }
      document.addEventListener("mousedown", onPointer);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("mousedown", onPointer);
        document.removeEventListener("keydown", onKey);
      };
    }, [importOpen]);

    useEffect(() => {
      if (!petOpen) return;
      function onPointer(e: MouseEvent) {
        const target = e.target as Node;
        if (petMenuRef.current?.contains(target)) return;
        if (petTriggerRef.current?.contains(target)) return;
        setPetOpen(false);
      }
      function onKey(e: KeyboardEvent) {
        if (e.key === "Escape") setPetOpen(false);
      }
      document.addEventListener("mousedown", onPointer);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("mousedown", onPointer);
        document.removeEventListener("keydown", onKey);
      };
    }, [petOpen]);

    // Catalog of supported slash commands. Each entry shows up in the
    // popover when the user types `/` in the composer. The `insert`
    // value is what we drop into the draft when the user picks the
    // entry — usually the canonical command form with a trailing space
    // ready for an argument.
    const slashCommands = useMemo<SlashCommand[]>(() => {
      const list: SlashCommand[] = [];
      if (petEnabled) {
        list.push(
          {
            id: 'pet',
            label: '/pet',
            insert: '/pet ',
            descKey: 'pet.slashPet',
            icon: 'sparkles',
            argHint: 'wake | tuck | <petId>',
          },
          {
            id: 'pet-wake',
            label: '/pet wake',
            insert: '/pet wake',
            descKey: 'pet.slashPetWake',
            icon: 'eye',
          },
          {
            id: 'pet-tuck',
            label: '/pet tuck',
            insert: '/pet tuck',
            descKey: 'pet.slashPetTuck',
            icon: 'eye',
          },
          {
            id: 'hatch',
            label: '/hatch',
            insert: '/hatch ',
            descKey: 'pet.slashHatch',
            icon: 'sparkles',
            argHint: t('pet.slashHatchArg'),
          },
        );
      }
      return list;
    }, [petEnabled, t]);

    const filteredSlash = useMemo(() => {
      if (!slash) return [] as SlashCommand[];
      const q = slash.q.toLowerCase();
      if (!q) return slashCommands;
      return slashCommands.filter((c) => c.label.toLowerCase().includes(q));
    }, [slash, slashCommands]);

    function pickSlash(cmd: SlashCommand) {
      const ta = textareaRef.current;
      if (!ta || !slash) return;
      const before = draft.slice(0, slash.cursor);
      const after = draft.slice(slash.cursor);
      // Replace the in-flight `/<query>` token with the picked
      // command's canonical insertion text.
      const replaced = before.replace(/\/[^\s/]*$/, cmd.insert);
      const next = replaced + after;
      setDraft(next);
      setSlash(null);
      requestAnimationFrame(() => {
        ta.focus();
        const pos = replaced.length;
        ta.setSelectionRange(pos, pos);
      });
    }

    // Expand a `/hatch <concept>` draft into the canonical hatch-pet
    // skill prompt before sending. Returns null when the draft is not a
    // hatch command so the caller can fall through to the regular
    // submit path.
    function expandHatchCommand(input: string): string | null {
      const m = /^\/hatch(?:\s+([\s\S]*))?$/i.exec(input.trim());
      if (!m) return null;
      const concept = m[1]?.trim() ?? '';
      const intro = concept
        ? `Hatch a Codex-compatible animated pet for me. Concept: ${concept}.`
        : 'Hatch a Codex-compatible animated pet for me.';
      return [
        intro,
        '',
        'Use the @hatch-pet skill end-to-end:',
        '1. Generate the base look with $imagegen.',
        '2. Generate every row strip (idle, running-right, waving, jumping, failed, waiting, running, review).',
        '3. Mirror running-left from running-right only when the design is symmetric.',
        '4. Run the deterministic scripts (extract / compose / validate / contact-sheet / videos).',
        '5. Package the result into ${CODEX_HOME:-$HOME/.codex}/pets/<pet-name>/ with pet.json + spritesheet.webp.',
        '',
        'When the spritesheet is saved, tell me the absolute path and the pet folder name. I will adopt it from Settings → Pets → Recently hatched.',
      ].join('\n');
    }

    // Parse a `/pet [arg]` slash command out of the draft. Recognized
    // forms: `/pet` (toggle wake/tuck), `/pet wake`, `/pet tuck`,
    // `/pet adopt` (open settings), or `/pet <id>` to adopt a built-in
    // by id. The slash is stripped from the draft on a successful match
    // so the user does not accidentally send the command to the agent.
    function tryHandlePetSlash(): boolean {
      if (!petEnabled) return false;
      const trimmed = draft.trim();
      const match = /^\/pet(?:\s+(\S+))?$/i.exec(trimmed);
      if (!match) return false;
      const arg = match[1]?.toLowerCase();
      if (!arg || arg === 'toggle') {
        onTogglePet?.();
      } else if (arg === 'wake' || arg === 'show') {
        if (petConfig?.adopted) {
          if (!petConfig.enabled) onTogglePet?.();
        } else {
          onOpenPetSettings?.();
        }
      } else if (arg === 'tuck' || arg === 'hide') {
        if (petConfig?.enabled) onTogglePet?.();
      } else if (arg === 'adopt' || arg === 'settings' || arg === 'change') {
        onOpenPetSettings?.();
      } else if (arg === CUSTOM_PET_ID) {
        onAdoptPet?.(CUSTOM_PET_ID);
      } else {
        const pet = BUILT_IN_PETS.find((p) => p.id === arg);
        if (pet) {
          onAdoptPet?.(pet.id);
        } else {
          return false;
        }
      }
      setDraft('');
      return true;
    }

    useImperativeHandle(
      ref,
      () => ({
        setDraft: (text: string) => {
          setDraft(text);
          seededRef.current = true;
          requestAnimationFrame(() => {
            const ta = textareaRef.current;
            if (!ta) return;
            ta.focus();
            const pos = text.length;
            ta.setSelectionRange(pos, pos);
          });
        },
        focus: () => {
          textareaRef.current?.focus();
        },
      }),
      []
    );

    function reset() {
      setDraft("");
      setStaged([]);
      setImportedContexts([]);
      setUploadError(null);
      setMention(null);
      setSlash(null);
      setImportPanel("root");
    }

    async function ensureProject(): Promise<string | null> {
      if (projectId) return projectId;
      return onEnsureProject();
    }

    async function uploadFiles(files: File[]) {
      if (files.length === 0) return;
      const id = await ensureProject();
      if (!id) return;
      setUploading(true);
      setUploadError(null);
      try {
        const result = await uploadProjectFiles(id, files);
        if (result.uploaded.length > 0) {
          setStaged((s) => [...s, ...result.uploaded]);
        }
        if (result.failed.length > 0) {
          const failedCount = result.failed.length;
          const uploadedCount = result.uploaded.length;
          const detail = result.error ? ` (${result.error})` : '';
          setUploadError(
            uploadedCount > 0
              ? `Attached ${uploadedCount} file(s), but ${failedCount} failed${detail}.`
              : `Attachment upload failed for ${failedCount} file(s)${detail}.`,
          );
          console.warn('Some attachments failed to upload', result.failed);
        }
      } finally {
        setUploading(false);
      }
    }

    function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
      const items = Array.from(e.clipboardData?.items ?? []);
      const files: File[] = [];
      for (const item of items) {
        if (item.kind === "file") {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        void uploadFiles(files);
      }
    }

    function handleDrop(e: React.DragEvent<HTMLDivElement>) {
      e.preventDefault();
      setDragActive(false);
      const files = Array.from(e.dataTransfer.files ?? []);
      if (files.length > 0) void uploadFiles(files);
    }

    function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
      const value = e.target.value;
      const cursor = e.target.selectionStart;
      setDraft(value);
      // Detect a fresh @ at start or after whitespace; capture the typed
      // query up to the cursor.
      const before = value.slice(0, cursor);
      const m = /(^|\s)@([^\s@]*)$/.exec(before);
      if (m) setMention({ q: m[2] ?? "", cursor });
      else setMention(null);
      // Slash-command popover — open as soon as the draft starts with
      // `/` (and the cursor is still inside the bare command token, no
      // space yet). Closes once the user commits a space or moves past
      // the prefix.
      const slashMatch = /^\/([^\s/]*)$/.exec(before);
      if (slashMatch) {
        setSlash({ q: slashMatch[1] ?? '', cursor });
        setSlashIndex(0);
      } else {
        setSlash(null);
      }
    }

    function insertMention(filePath: string) {
      if (!mention) return;
      const ta = textareaRef.current;
      if (!ta) return;
      const cursor = mention.cursor;
      const before = draft.slice(0, cursor);
      const after = draft.slice(cursor);
      const replaced = before.replace(/@([^\s@]*)$/, `@${filePath} `);
      const next = replaced + after;
      setDraft(next);
      setMention(null);
      if (!staged.some((s) => s.path === filePath)) {
        setStaged((s) => [
          ...s,
          {
            path: filePath,
            name: filePath.split("/").pop() || filePath,
            kind: looksLikeImage(filePath) ? "image" : "file",
          },
        ]);
      }
      requestAnimationFrame(() => {
        ta.focus();
        const pos = replaced.length;
        ta.setSelectionRange(pos, pos);
      });
    }

    function removeStaged(p: string) {
      setStaged((s) => s.filter((a) => a.path !== p));
    }

    function removeImportedContext(id: string) {
      setImportedContexts((items) => items.filter((item) => item.id !== id));
    }

    async function importSkillContext(skill: SkillSummary) {
      const contextId = `skill:${skill.id}`;
      if (importedContexts.some((item) => item.id === contextId)) return;
      setImportingContextId(contextId);
      try {
        const detail = await fetchSkill(skill.id);
        setImportedContexts((items) => [
          ...items,
          {
            kind: "skill",
            id: contextId,
            title: skill.name,
            summary: skill.description,
            body: detail?.body || skill.examplePrompt || skill.description,
          },
        ]);
        setImportOpen(false);
        setImportPanel("root");
      } finally {
        setImportingContextId(null);
      }
    }

    async function importDesignSystemContext(system: DesignSystemSummary) {
      const contextId = `design-system:${system.id}`;
      if (importedContexts.some((item) => item.id === contextId)) return;
      setImportingContextId(contextId);
      try {
        const detail = await fetchDesignSystem(system.id);
        setImportedContexts((items) => [
          ...items,
          {
            kind: "design-system",
            id: contextId,
            title: system.title,
            summary: system.summary,
            body: detail?.body || system.summary,
          },
        ]);
        setImportOpen(false);
        setImportPanel("root");
      } finally {
        setImportingContextId(null);
      }
    }

    function importCodeDirectoryContext(dir: string) {
      const contextId = `code-dir:${dir}`;
      if (importedContexts.some((item) => item.id === contextId)) return;
      const files = filesInDirectory(projectFiles, dir).slice(0, 20);
      setImportedContexts((items) => [
        ...items,
        {
          kind: "code-dir",
          id: contextId,
          title: dir,
          summary: `${files.length} files attached from this directory`,
          paths: files,
        },
      ]);
      setStaged((items) => {
        const seen = new Set(items.map((item) => item.path));
        const next = [...items];
        for (const filePath of files) {
          if (seen.has(filePath)) continue;
          next.push({
            path: filePath,
            name: filePath.split("/").pop() || filePath,
            kind: looksLikeImage(filePath) ? "image" : "file",
          });
        }
        return next;
      });
      setImportOpen(false);
      setImportPanel("root");
    }

    function composeImportedContextPrompt(): string {
      if (importedContexts.length === 0) return "";
      return importedContexts
        .map((item) => {
          if (item.kind === "skill") {
            return [
              `<imported-skill id="${item.id.replace(/^skill:/, "")}" name="${item.title}">`,
              item.body,
              "</imported-skill>",
            ].join("\n");
          }
          if (item.kind === "design-system") {
            return [
              `<imported-design-system id="${item.id.replace(/^design-system:/, "")}" title="${item.title}">`,
              item.body,
              "</imported-design-system>",
            ].join("\n");
          }
          return [
            `<related-code-directory path="${item.title}">`,
            item.paths.map((p) => `- ${p}`).join("\n"),
            "</related-code-directory>",
          ].join("\n");
        })
        .join("\n\n");
    }

    async function submit() {
      const prompt = draft.trim();
      // Intercept `/pet …` before sending so the slash command never
      // hits the agent — it is a local UX hook, not a model prompt.
      if (tryHandlePetSlash()) return;
      // `/hatch <concept>` expands into the canonical hatch-pet skill
      // prompt and *is* sent to the agent — the agent runs the skill,
      // packages a Codex pet under `~/.codex/pets/`, and the user
      // adopts it from "Recently hatched" in pet settings afterwards.
      const hatched = expandHatchCommand(prompt);
      if (hatched) {
        if (streaming) return;
        onSend(hatched, staged, commentAttachments);
        reset();
        return;
      }
      if (
        (!prompt &&
          commentAttachments.length === 0 &&
          importedContexts.length === 0) ||
        streaming
      ) {
        return;
      }
      const contextPrompt = composeImportedContextPrompt();
      const composedPrompt = contextPrompt
        ? `${prompt || "(No extra typed instruction.)"}\n\n# Imported context\n\n${contextPrompt}`
        : prompt;
      onSend(composedPrompt, staged, commentAttachments);
      reset();
    }

    // The @-picker treats the project listing as path-shaped (path + size).
    // ProjectFile.path is optional, so fall back to .name for the legacy
    // flat shape — both ChatComposer and the old code paths see the same
    // entries.
    const filteredFiles = mention
      ? projectFiles
          .filter((f) => f.type === undefined || f.type === "file")
          .filter((f) => {
            const key = f.path ?? f.name;
            return key.toLowerCase().includes(mention.q.toLowerCase());
          })
          .slice(0, 12)
      : [];

    const codeDirectories = useMemo(
      () => deriveCodeDirectories(projectFiles),
      [projectFiles],
    );

    const componentCandidates = useMemo(
      () => deriveComponentCandidates(projectFiles),
      [projectFiles],
    );

    function addComponentReference(file: ProjectFile) {
      const filePath = file.path ?? file.name;
      const note = window.prompt(
        `請說明「${file.name}」要作為什麼元件或區塊用途：`,
        "",
      );
      if (!note?.trim()) return;
      if (!staged.some((s) => s.path === filePath)) {
        setStaged((items) => [
          ...items,
          {
            path: filePath,
            name: file.name,
            kind: looksLikeImage(filePath) ? "image" : "file",
          },
        ]);
      }
      const componentPrompt = [
        `Use @${filePath} as a reusable component source.`,
        `Component/source: ${file.name}`,
        `User note: ${note.trim()}`,
        "Adapt it to the current project instead of copying blindly. Preserve the current visual system.",
      ].join("\n");
      setDraft((current) => {
        const prefix = current.trim() ? `${current.trim()}\n\n` : "";
        return `${prefix}${componentPrompt}`;
      });
      setImportOpen(false);
      setImportPanel("root");
      requestAnimationFrame(() => textareaRef.current?.focus());
    }

    return (
      <div
        className={`composer${dragActive ? " drag-active" : ""}`}
        data-testid="chat-composer"
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <div className="composer-shell">
          {staged.length > 0 ? (
            <StagedAttachments
              attachments={staged}
              projectId={projectId}
              onRemove={removeStaged}
              t={t}
            />
          ) : null}
          {commentAttachments.length > 0 ? (
            <StagedCommentAttachments
              attachments={commentAttachments}
              onRemove={(id) => onRemoveCommentAttachment?.(id)}
              t={t}
            />
          ) : null}
          {importedContexts.length > 0 ? (
            <ImportedContextChips
              contexts={importedContexts}
              onRemove={removeImportedContext}
            />
          ) : null}
          <div className="composer-input-wrap">
            <textarea
              ref={textareaRef}
              data-testid="chat-composer-input"
              value={draft}
              placeholder={t('chat.composerPlaceholder')}
              onChange={handleChange}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (slash && filteredSlash.length > 0) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSlashIndex((i) => (i + 1) % filteredSlash.length);
                    return;
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSlashIndex(
                      (i) => (i - 1 + filteredSlash.length) % filteredSlash.length,
                    );
                    return;
                  }
                  if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey)) {
                    e.preventDefault();
                    const safe = Math.min(slashIndex, filteredSlash.length - 1);
                    pickSlash(filteredSlash[safe]!);
                    return;
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setSlash(null);
                    return;
                  }
                }
                if (mention && e.key === "Escape") {
                  setMention(null);
                  return;
                }
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void submit();
                }
              }}
            />
            {mention && filteredFiles.length > 0 ? (
              <MentionPopover files={filteredFiles} onPick={insertMention} />
            ) : null}
            {slash && filteredSlash.length > 0 ? (
              <SlashPopover
                commands={filteredSlash}
                activeIndex={Math.min(slashIndex, filteredSlash.length - 1)}
                onPick={pickSlash}
                onHover={(i) => setSlashIndex(i)}
                t={t}
              />
            ) : null}
          </div>
          <div className="composer-row">
            <input
              ref={fileInputRef}
              data-testid="chat-file-input"
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                void uploadFiles(files);
                e.target.value = "";
              }}
            />
            <button
              className="icon-btn"
              onClick={() => onOpenSettings?.()}
              title={t('chat.cliSettingsTitle')}
              aria-label={t('chat.cliSettingsAria')}
              disabled={!onOpenSettings}
            >
              <Icon name="sliders" size={15} />
            </button>
            <button
              className="icon-btn"
              data-testid="chat-attach"
              onClick={() => fileInputRef.current?.click()}
              title={t('chat.attachTitle')}
              disabled={uploading}
              aria-label={t('chat.attachAria')}
            >
              {uploading ? (
                <Icon name="spinner" size={15} />
              ) : (
                <Icon name="attach" size={15} />
              )}
            </button>
            <span className="composer-icon-divider" aria-hidden />
            <div className="composer-import-wrap">
              <button
                ref={importTriggerRef}
                type="button"
                className="composer-import"
                onClick={() => setImportOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={importOpen}
                title={t('chat.importTitle')}
              >
                <Icon name="import" size={13} />
                <span>{t('chat.importLabel')}</span>
                <Icon name="chevron-down" size={12} />
              </button>
              {importOpen ? (
                <div
                  ref={importMenuRef}
                  className="composer-import-menu"
                  role="menu"
                >
                  {importPanel === "root" ? (
                    <>
                      <ImportItem icon="upload" label={t('chat.importFig')} t={t} />
                      <ImportItem icon="link" label={t('chat.importGitHub')} t={t} />
                      <ImportItem icon="grid" label={t('chat.importWeb')} t={t} />
                      <ImportItem
                        icon="folder"
                        label={t('chat.importFolder')}
                        t={t}
                        enabled={codeDirectories.length > 0}
                        onClick={() => setImportPanel("code")}
                      />
                      <ImportItem
                        icon="grid"
                        label="目前專案元件 Gallery"
                        t={t}
                        enabled={componentCandidates.length > 0}
                        onClick={() => setImportPanel("components")}
                      />
                      <ImportItem
                        icon="sparkles"
                        label={t('chat.importSkills')}
                        t={t}
                        enabled={skills.length > 0 || designSystems.length > 0}
                        onClick={() => setImportPanel("skills")}
                      />
                      <ImportItem icon="file" label={t('chat.importProject')} t={t} />
                    </>
	                  ) : importPanel === "skills" ? (
	                    <ImportResourcePanel
                      title={t('chat.importSkills')}
                      emptyLabel="目前沒有可匯入的技能或設計系統"
                      onBack={() => setImportPanel("root")}
                    >
                      {skills.slice(0, 8).map((skill) => {
                        const contextId = `skill:${skill.id}`;
                        return (
                          <ImportResourceItem
                            key={contextId}
                            icon="sparkles"
                            title={skill.name}
                            meta={`Skill · ${skill.mode}`}
                            summary={skill.description}
                            active={importedContexts.some((item) => item.id === contextId)}
                            loading={importingContextId === contextId}
                            onClick={() => void importSkillContext(skill)}
                          />
                        );
                      })}
                      {designSystems.slice(0, 8).map((system) => {
                        const contextId = `design-system:${system.id}`;
                        return (
                          <ImportResourceItem
                            key={contextId}
                            icon="grid"
                            title={system.title}
                            meta={`Design system · ${system.category}`}
                            summary={system.summary}
                            active={importedContexts.some((item) => item.id === contextId)}
                            loading={importingContextId === contextId}
                            onClick={() => void importDesignSystemContext(system)}
                          />
                        );
                      })}
                    </ImportResourcePanel>
	                  ) : importPanel === "code" ? (
	                    <ImportResourcePanel
                      title={t('chat.importFolder')}
                      emptyLabel="目前沒有可關聯的程式碼目錄"
                      onBack={() => setImportPanel("root")}
                    >
                      {codeDirectories.map((dir) => {
                        const contextId = `code-dir:${dir.path}`;
                        return (
                          <ImportResourceItem
                            key={contextId}
                            icon="folder"
                            title={dir.path}
                            meta={`${dir.fileCount} files`}
                            summary={dir.sampleFiles.join(", ")}
                            active={importedContexts.some((item) => item.id === contextId)}
                            onClick={() => importCodeDirectoryContext(dir.path)}
                          />
                        );
	                      })}
	                    </ImportResourcePanel>
	                  ) : (
	                    <ImportResourcePanel
	                      title="目前專案元件 Gallery"
	                      emptyLabel="目前沒有可引用的元件或檔案"
	                      onBack={() => setImportPanel("root")}
	                    >
	                      {componentCandidates.map((file) => {
	                        const path = file.path ?? file.name;
	                        return (
	                          <ImportResourceItem
	                            key={path}
	                            icon={looksLikeImage(path) ? "grid" : "file"}
	                            title={file.name}
	                            meta={`${file.kind} · ${prettySize(file.size)}`}
	                            summary="點擊可加入 composer；也可以拖曳到右側預覽畫布後輸入用途。"
	                            draggable
	                            dragPayload={{
	                              path,
	                              title: file.name,
	                              kind: file.kind,
	                            }}
	                            onClick={() => addComponentReference(file)}
	                          />
	                        );
	                      })}
	                    </ImportResourcePanel>
	                  )}
                </div>
              ) : null}
            </div>
            {petEnabled ? (
              <div className="composer-pet-wrap">
                <button
                  ref={petTriggerRef}
                  type="button"
                  className={`composer-pet${petConfig?.adopted ? ' adopted' : ''}`}
                  onClick={() => setPetOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={petOpen}
                  title={t('pet.composerTitle')}
                >
                  <span className="composer-pet-glyph" aria-hidden>
                    {(() => {
                      const active = resolveActivePet(petConfig);
                      if (active) return active.glyph;
                      return '🐾';
                    })()}
                  </span>
                  <span className="composer-pet-label">
                    {petConfig?.adopted
                      ? petConfig.enabled
                        ? t('pet.tuck')
                        : t('pet.wake')
                      : t('pet.adopt')}
                  </span>
                  <Icon name="chevron-down" size={12} />
                </button>
                {petOpen ? (
                  <div
                    ref={petMenuRef}
                    className="composer-pet-menu"
                    role="menu"
                  >
                    <div className="composer-pet-menu-head">
                      <strong>{t('pet.composerMenuTitle')}</strong>
                      <span>{t('pet.composerMenuHint')}</span>
                    </div>
                    {petConfig?.adopted ? (
                      <button
                        type="button"
                        role="menuitem"
                        className="composer-pet-menu-row toggle"
                        onClick={() => {
                          onTogglePet?.();
                          setPetOpen(false);
                        }}
                      >
                        <Icon
                          name={petConfig.enabled ? 'eye' : 'sparkles'}
                          size={12}
                        />
                        <span>
                          {petConfig.enabled
                            ? t('pet.tuck')
                            : t('pet.wake')}
                        </span>
                      </button>
                    ) : null}
                    <div className="composer-pet-menu-grid">
                      {BUILT_IN_PETS.map((p) => {
                        const active =
                          petConfig?.adopted && petConfig.petId === p.id;
                        return (
                          <button
                            type="button"
                            role="menuitem"
                            key={p.id}
                            className={`composer-pet-menu-pet${active ? ' active' : ''}`}
                            onClick={() => {
                              onAdoptPet?.(p.id);
                              setPetOpen(false);
                            }}
                            style={{ ['--pet-accent' as string]: p.accent }}
                            title={p.flavor}
                          >
                            <span aria-hidden>{p.glyph}</span>
                            <span>{p.name}</span>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      className="composer-pet-menu-row settings"
                      onClick={() => {
                        onOpenPetSettings?.();
                        setPetOpen(false);
                      }}
                    >
                      <Icon name="settings" size={12} />
                      <span>{t('pet.composerOpenSettings')}</span>
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
            <span className="composer-spacer" />
            {streaming ? (
              <button
                type="button"
                className="composer-send stop"
                onClick={onStop}
              >
                <Icon name="stop" size={13} />
                <span>{t('chat.stop')}</span>
              </button>
            ) : (
              <button
                type="button"
                className="composer-send"
                data-testid="chat-send"
                onClick={() => void submit()}
                disabled={
                  !draft.trim() &&
                  commentAttachments.length === 0 &&
                  importedContexts.length === 0
                }
              >
                <Icon name="send" size={13} />
                <span>{t('chat.send')}</span>
              </button>
            )}
          </div>
        </div>
        {uploadError ? <span className="composer-hint">{uploadError}</span> : null}
        <span className="composer-hint">{t('chat.composerHint')}</span>
      </div>
    );
  }
);

function StagedAttachments({
  attachments,
  projectId,
  onRemove,
  t,
}: {
  attachments: ChatAttachment[];
  projectId: string | null;
  onRemove: (path: string) => void;
  t: TranslateFn;
}) {
  return (
    <div className="staged-row" data-testid="staged-attachments">
      {attachments.map((a) => (
        <div key={a.path} className={`staged-chip staged-${a.kind}`}>
          {a.kind === "image" && projectId ? (
            <img src={projectRawUrl(projectId, a.path)} alt={a.name} />
          ) : (
            <span className="staged-icon" aria-hidden>
              <Icon name="file" size={13} />
            </span>
          )}
          <span className="staged-name" title={a.path}>
            {a.name}
          </span>
          <button
            className="staged-remove"
            onClick={() => onRemove(a.path)}
            title={t('common.delete')}
            aria-label={t('chat.removeAria', { name: a.name })}
          >
            <Icon name="close" size={11} />
          </button>
        </div>
      ))}
    </div>
  );
}

function StagedCommentAttachments({
  attachments,
  onRemove,
  t,
}: {
  attachments: ChatCommentAttachment[];
  onRemove: (id: string) => void;
  t: TranslateFn;
}) {
  return (
    <div className="staged-row comment-staged-row" data-testid="staged-comment-attachments">
      {attachments.map((a) => (
        <div key={a.id} className="staged-chip staged-comment">
          <span className="staged-name" title={`${a.elementId}: ${a.comment}`}>
            <strong>{a.elementId}</strong>
            <span>{a.comment}</span>
          </span>
          <button
            className="staged-remove"
            onClick={() => onRemove(a.id)}
            title={t('chat.comments.removeAttachment')}
            aria-label={t('chat.comments.removeAttachmentAria', { name: a.elementId })}
          >
            <Icon name="close" size={11} />
          </button>
        </div>
      ))}
    </div>
  );
}

function ImportItem({
  icon,
  label,
  t,
  enabled = false,
  onClick,
}: {
  icon: "upload" | "link" | "grid" | "folder" | "sparkles" | "file";
  label: string;
  t: TranslateFn;
  enabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={`composer-import-item${enabled ? " enabled" : ""}`}
      role="menuitem"
      tabIndex={-1}
      disabled={!enabled}
      title={enabled ? label : t('chat.importComingSoon')}
      onClick={(e) => {
        if (!enabled) {
          e.preventDefault();
          return;
        }
        onClick?.();
      }}
    >
      <span className="ico" aria-hidden>
        <Icon name={icon} size={14} />
      </span>
      <span className="composer-import-item-label">{label}</span>
      <span className="composer-import-item-soon">
        {enabled ? <Icon name="chevron-right" size={11} /> : t('chat.importSoon')}
      </span>
    </button>
  );
}

function ImportedContextChips({
  contexts,
  onRemove,
}: {
  contexts: ImportedContext[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="staged-row imported-context-row">
      {contexts.map((item) => (
        <div key={item.id} className={`staged-chip imported-${item.kind}`}>
          <span className="staged-icon" aria-hidden>
            <Icon
              name={
                item.kind === "skill"
                  ? "sparkles"
                  : item.kind === "design-system"
                    ? "grid"
                    : "folder"
              }
              size={13}
            />
          </span>
          <span className="staged-name" title={item.summary}>
            {item.title}
          </span>
          <button
            className="staged-remove"
            onClick={() => onRemove(item.id)}
            title="移除匯入內容"
            aria-label={`移除 ${item.title}`}
          >
            <Icon name="close" size={11} />
          </button>
        </div>
      ))}
    </div>
  );
}

function ImportResourcePanel({
  title,
  emptyLabel,
  onBack,
  children,
}: {
  title: string;
  emptyLabel: string;
  onBack: () => void;
  children: ReactNode;
}) {
  const hasChildren = Children.count(children) > 0;
  return (
    <div className="composer-import-panel">
      <div className="composer-import-panel-head">
        <button
          type="button"
          className="composer-import-back"
          onClick={onBack}
          aria-label="返回匯入選單"
        >
          <Icon name="chevron-left" size={13} />
        </button>
        <strong>{title}</strong>
      </div>
      <div className="composer-import-panel-list">
        {hasChildren ? children : (
          <div className="composer-import-empty">{emptyLabel}</div>
        )}
      </div>
    </div>
  );
}

function ImportResourceItem({
  icon,
  title,
  meta,
  summary,
  active = false,
  loading = false,
  draggable = false,
  dragPayload,
  onClick,
}: {
  icon: "sparkles" | "grid" | "folder" | "file";
  title: string;
  meta: string;
  summary: string;
  active?: boolean;
  loading?: boolean;
  draggable?: boolean;
  dragPayload?: unknown;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`composer-resource-item${active ? " active" : ""}`}
      disabled={active || loading}
      draggable={draggable}
      onDragStart={(event) => {
        if (!dragPayload) return;
        event.dataTransfer.setData(
          "application/x-open-design-component",
          JSON.stringify(dragPayload),
        );
        event.dataTransfer.effectAllowed = "copy";
      }}
      onClick={onClick}
    >
      <span className="composer-resource-icon" aria-hidden>
        <Icon name={loading ? "spinner" : icon} size={14} />
      </span>
      <span className="composer-resource-body">
        <span className="composer-resource-title">{title}</span>
        <span className="composer-resource-meta">{meta}</span>
        <span className="composer-resource-summary">{summary}</span>
      </span>
      <span className="composer-resource-state">
        {active ? <Icon name="check" size={13} /> : null}
      </span>
    </button>
  );
}

function SlashPopover({
  commands,
  activeIndex,
  onPick,
  onHover,
  t,
}: {
  commands: SlashCommand[];
  activeIndex: number;
  onPick: (cmd: SlashCommand) => void;
  onHover: (index: number) => void;
  t: TranslateFn;
}) {
  return (
    <div
      className="slash-popover"
      data-testid="slash-popover"
      role="listbox"
      aria-label={t('pet.slashPopoverAria')}
    >
      <div className="slash-popover-head">
        <span>{t('pet.slashPopoverTitle')}</span>
        <span className="slash-popover-hint">{t('pet.slashPopoverHint')}</span>
      </div>
      {commands.map((cmd, idx) => {
        const active = idx === activeIndex;
        return (
          <button
            key={cmd.id}
            type="button"
            role="option"
            aria-selected={active}
            className={`slash-item${active ? ' active' : ''}`}
            onMouseDown={(e) => {
              // Prevent the textarea from losing focus before the click
              // handler fires — otherwise selectionStart resets and the
              // pick replacement targets the wrong substring.
              e.preventDefault();
            }}
            onMouseEnter={() => onHover(idx)}
            onClick={() => onPick(cmd)}
          >
            <span className="slash-item-icon" aria-hidden>
              <Icon name={cmd.icon} size={13} />
            </span>
            <span className="slash-item-body">
              <span className="slash-item-row">
                <code className="slash-item-label">{cmd.label}</code>
                {cmd.argHint ? (
                  <span className="slash-item-arg">{cmd.argHint}</span>
                ) : null}
              </span>
              <span className="slash-item-desc">{t(cmd.descKey)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MentionPopover({
  files,
  onPick,
}: {
  files: ProjectFile[];
  onPick: (path: string) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
  }, [files]);
  return (
    <div className="mention-popover" data-testid="mention-popover" ref={ref}>
      {files.map((f) => {
        const key = f.path ?? f.name;
        return (
          <button
            key={key}
            className="mention-item"
            onClick={() => onPick(key)}
          >
            <code>{key}</code>
            {f.size != null ? (
              <span className="mention-meta">{prettySize(f.size)}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function looksLikeImage(name: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(name);
}

function looksLikeCode(name: string): boolean {
  return /\.(ts|tsx|js|jsx|mjs|cjs|css|scss|html|md|json|yml|yaml|sql|py|go|rs|java|kt|swift|rb|php|sh)$/i.test(
    name,
  );
}

function fileKey(file: ProjectFile): string {
  return file.path ?? file.name;
}

function filesInDirectory(files: ProjectFile[], dir: string): string[] {
  const prefix = dir.endsWith("/") ? dir : `${dir}/`;
  return files
    .filter((file) => file.type === undefined || file.type === "file")
    .map(fileKey)
    .filter((path) => path.startsWith(prefix) && looksLikeCode(path));
}

function deriveCodeDirectories(files: ProjectFile[]): Array<{
  path: string;
  fileCount: number;
  sampleFiles: string[];
}> {
  const byDir = new Map<string, string[]>();
  for (const file of files) {
    if (file.type !== undefined && file.type !== "file") continue;
    const key = fileKey(file);
    if (!looksLikeCode(key) || !key.includes("/")) continue;
    const parts = key.split("/");
    for (let i = 1; i < parts.length; i += 1) {
      const dir = parts.slice(0, i).join("/");
      const list = byDir.get(dir) ?? [];
      list.push(key);
      byDir.set(dir, list);
    }
  }
  return Array.from(byDir.entries())
    .map(([path, dirFiles]) => ({
      path,
      fileCount: dirFiles.length,
      sampleFiles: dirFiles.slice(0, 3).map((name) => name.split("/").pop() || name),
    }))
    .sort((a, b) => b.fileCount - a.fileCount || a.path.localeCompare(b.path))
    .slice(0, 12);
}

function deriveComponentCandidates(files: ProjectFile[]): ProjectFile[] {
  const usefulKinds = new Set<ProjectFile["kind"]>([
    "html",
    "code",
    "text",
    "image",
    "sketch",
  ]);
  return files
    .filter((file) => file.type === undefined || file.type === "file")
    .filter((file) => usefulKinds.has(file.kind))
    .filter((file) => {
      const key = fileKey(file);
      if (file.kind === "image" || file.kind === "sketch") return true;
      return /\.(html?|tsx?|jsx?|css|scss|md)$/i.test(key);
    })
    .sort((a, b) => {
      const aScore = componentScore(a);
      const bScore = componentScore(b);
      return bScore - aScore || fileKey(a).localeCompare(fileKey(b));
    })
    .slice(0, 16);
}

function componentScore(file: ProjectFile): number {
  const key = fileKey(file).toLowerCase();
  let score = 0;
  if (file.kind === "html") score += 30;
  if (/\b(component|card|section|hero|slide|panel|widget)\b/.test(key)) score += 20;
  if (key.endsWith(".tsx") || key.endsWith(".jsx")) score += 15;
  if (file.kind === "image") score += 5;
  return score;
}

function prettySize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
