import { useState } from "react";
import { Icon } from "./Icon";
import { installSkill, installDesignSystem } from "../providers/registry";

export type ImportKind = "skill" | "designSystem";
export type ImportSource = "github" | "local";

export interface ImportSkillsResult {
  kind: ImportKind;
  id: string;
}

interface Props {
  open: boolean;
  initialKind?: ImportKind;
  onClose: () => void;
  /**
   * Called when the install API returned a successful row. The caller is
   * responsible for any follow-up wiring (e.g. attaching the freshly
   * imported item to the active project) and for closing the dialog if
   * the close-after-success default is undesirable.
   */
  onImported: (result: ImportSkillsResult) => Promise<void> | void;
}

/**
 * Modal that wraps the existing /api/skills/install and
 * /api/design-systems/install endpoints. Mirrors LibrarySection's import
 * form but lives in the chat composer so users can grab a skill or
 * design system mid-conversation without leaving the chat surface.
 */
export function ImportSkillsDialog({
  open,
  initialKind = "skill",
  onClose,
  onImported,
}: Props) {
  const [kind, setKind] = useState<ImportKind>(initialKind);
  const [source, setSource] = useState<ImportSource>("github");
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function reset() {
    setValue("");
    setError(null);
    setSubmitting(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError(
        kind === "skill"
          ? "請輸入來源 URL 或本地路徑"
          : "請輸入來源 URL 或本地路徑",
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    const payload =
      source === "github"
        ? { source: "github" as const, url: trimmed }
        : { source: "local" as const, path: trimmed };

    try {
      if (kind === "skill") {
        const resp = await installSkill(payload);
        if ("error" in resp) {
          setError(resp.error);
          setSubmitting(false);
          return;
        }
        await onImported({ kind: "skill", id: resp.skill.id });
      } else {
        const resp = await installDesignSystem(payload);
        if ("error" in resp) {
          setError(resp.error);
          setSubmitting(false);
          return;
        }
        await onImported({ kind: "designSystem", id: resp.designSystem.id });
      }
      reset();
      onClose();
    } catch (err) {
      setError(String(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal-sm"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-skills-title"
      >
        <header className="modal-head">
          <h2 id="import-skills-title">匯入技能與設計系統</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="關閉"
          >
            <Icon name="close" size={16} />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="modal-body"
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div className="seg">
            <button
              type="button"
              className={`seg-btn${kind === "skill" ? " active" : ""}`}
              onClick={() => setKind("skill")}
            >
              <Icon name="sparkles" size={14} />
              <span>技能 Skill</span>
            </button>
            <button
              type="button"
              className={`seg-btn${kind === "designSystem" ? " active" : ""}`}
              onClick={() => setKind("designSystem")}
            >
              <Icon name="grid" size={14} />
              <span>設計系統 Design System</span>
            </button>
          </div>

          <div className="seg">
            <button
              type="button"
              className={`seg-btn${source === "github" ? " active" : ""}`}
              onClick={() => setSource("github")}
            >
              <Icon name="link" size={14} />
              <span>GitHub URL</span>
            </button>
            <button
              type="button"
              className={`seg-btn${source === "local" ? " active" : ""}`}
              onClick={() => setSource("local")}
            >
              <Icon name="folder" size={14} />
              <span>本地路徑</span>
            </button>
          </div>

          <label className="field">
            <span className="field-label">
              {source === "github"
                ? "GitHub 倉庫或子目錄 URL"
                : "本地資料夾絕對路徑"}
            </span>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={
                source === "github"
                  ? "https://github.com/owner/repo 或 .../tree/main/skills/foo"
                  : "/Users/me/projects/my-skills/foo"
              }
              autoFocus
              required
            />
            <small className="hint">
              {kind === "skill"
                ? "目錄中需含 SKILL.md 檔案"
                : "目錄中需含 DESIGN.md 檔案"}
            </small>
          </label>

          {error && (
            <p
              className="error"
              role="alert"
              style={{ color: "var(--color-error, #d33)" }}
            >
              {error}
            </p>
          )}

          <footer
            className="modal-actions"
            style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
          >
            <button
              type="button"
              className="btn-ghost"
              onClick={onClose}
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || !value.trim()}
            >
              {submitting
                ? "匯入中…"
                : `匯入並選為當前${kind === "skill" ? "技能" : "設計系統"}`}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
