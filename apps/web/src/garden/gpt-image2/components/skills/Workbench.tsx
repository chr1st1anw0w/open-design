import { useState, useMemo, useEffect, useRef } from "react";
import type { Route, PromptGalleryItem } from "../../types";
import { cases, promptGallery } from "../../lib/data";
import { renderPrompt, extractPlaceholders } from "../../lib/prompt-engine";
import { AiAgentPopover } from "../prompt-studio/AiAgentPopover";
import { callGeminiCopilot } from "../../lib/gemini-client";
import { Toolbar, type AnnotationTool } from "@/components/ui/toolbar";
import "./Workbench.css";

function formatParamLabel(
  key: string,
  templateParamLabels?: Record<string, string>,
): string {
  if (templateParamLabels?.[key]) return templateParamLabels[key];
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Props {
  navigate: (r: Route) => void;
  initialCategoryId?: string;
  initialTemplateId?: string;
}

type Mode = "template" | "gallery";
type SidebarMode = "category" | "templates";
type AnnotationPoint = { x: number; y: number };
type AnnotationShape = "arrow" | "rect" | "ellipse";
type ImageAnnotation =
  | {
      id: string;
      type: "text";
      x: number;
      y: number;
      color: string;
      text: string;
    }
  | {
      id: string;
      type: AnnotationShape;
      x: number;
      y: number;
      x2: number;
      y2: number;
      color: string;
    }
  | {
      id: string;
      type: "pencil";
      color: string;
      points: AnnotationPoint[];
    };

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

export function Workbench({
  navigate,
  initialCategoryId,
  initialTemplateId,
}: Props) {
  const [mode, setMode] = useState<Mode>("template");
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(
    initialTemplateId || initialCategoryId ? "templates" : "category",
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialTemplateId
      ? cases.templates[initialTemplateId]?.category || initialCategoryId || ""
      : initialCategoryId || "",
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    initialTemplateId || "",
  );
  const [selectedGalleryItem, setSelectedGalleryItem] =
    useState<PromptGalleryItem | null>(null);
  const [galleryCategory, setGalleryCategory] = useState<string>("");
  const [args, setArgs] = useState<Record<string, string>>({});
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [archiveStatus, setArchiveStatus] = useState<string | null>(null);
  const [genStatus, setGenStatus] = useState<
    "idle" | "generating" | "success" | "error"
  >("idle");
  const [genError, setGenError] = useState<string>("");
  const [genResult, setGenResult] = useState<{
    base64: string;
    ext: string;
  } | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [imageNote, setImageNote] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [threadHistory, setThreadHistory] = useState<string[]>([]);
  const [annotationTool, setAnnotationTool] =
    useState<AnnotationTool>("select");
  const [annotationColor, setAnnotationColor] = useState("#f97316");
  const [annotations, setAnnotations] = useState<ImageAnnotation[]>([]);
  const [activeDrawingId, setActiveDrawingId] = useState<string | null>(null);
  const [isAiPopoverOpen, setIsAiPopoverOpen] = useState(false);
  const [activeFieldForAi, setActiveFieldForAi] = useState<string | undefined>(
    undefined,
  );
  const [aiIsLoading, setAiIsLoading] = useState(false);
  const aiFieldRef = useRef<HTMLElement | null>(null);
  const annotationStageRef = useRef<SVGSVGElement | null>(null);
  const revisionSessionId = useMemo(
    () => (selectedTemplateId || selectedGalleryItem?.id || "default").trim(),
    [selectedTemplateId, selectedGalleryItem],
  );

  const template = useMemo(() => {
    if (!selectedTemplateId) return null;
    return cases.templates[selectedTemplateId];
  }, [selectedTemplateId]);

  const placeholders = useMemo(() => {
    if (!template?.content) return [];
    return extractPlaceholders(template.content);
  }, [template]);

  useEffect(() => {
    if (!template?.content) return;

    const newArgs: Record<string, string> = {};
    const placeholderRegex = /\{([^}]+)\}/g;
    let match;
    while ((match = placeholderRegex.exec(template.content)) !== null) {
      const fullMatch = match[1];
      if (!fullMatch) continue;
      const parts = fullMatch.split(":");
      const key = (parts[0] ?? "").split("|")[0]?.trim() ?? "";
      const defaultValue = parts[1] || "";
      if (key && !newArgs[key]) {
        newArgs[key] = defaultValue;
      }
    }
    setArgs(newArgs);
    setArchiveStatus(null);
    setCopyStatus(null);
  }, [template]);

  useEffect(() => {
    if (initialTemplateId) {
      setSelectedTemplateId(initialTemplateId);
      setSelectedCategory(
        cases.templates[initialTemplateId]?.category || initialCategoryId || "",
      );
      setSidebarMode("templates");
      return;
    }
    if (initialCategoryId) {
      setSelectedCategory(initialCategoryId);
      setSelectedTemplateId("");
      setSidebarMode("templates");
    }
  }, [initialCategoryId, initialTemplateId]);

  const renderResult = useMemo(() => {
    if (!template?.content) return null;
    try {
      return renderPrompt(template.content, args);
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : "Render error" };
    }
  }, [template, args]);

  const activePrompt =
    mode === "gallery"
      ? (selectedGalleryItem?.prompt ?? null)
      : typeof renderResult === "string"
        ? renderResult
        : null;

  const handleCopy = () => {
    const text = activePrompt;
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyStatus("已複製！");
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleArchive = async () => {
    if (!template || !renderResult || typeof renderResult !== "string") return;

    setArchiveStatus("正在封裝...");
    try {
      const response = await fetch("/api/garden/gpt-image2/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: template.category,
          template: template.name,
          filename: args["title"] || args["name"] || "workbench_export",
          content: renderResult,
          args: args,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setArchiveStatus("✅ 已自動歸檔至資料路徑");
        setTimeout(() => setArchiveStatus(null), 3000);
      } else {
        setArchiveStatus(`❌ 錯誤: ${data.error}`);
      }
    } catch {
      setArchiveStatus("❌ 無法連線至伺服器");
    }
  };

  const getAnnotationPoint = (
    event: React.PointerEvent<SVGSVGElement>,
  ): AnnotationPoint | null => {
    const stage = annotationStageRef.current;
    if (!stage) return null;
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: clampPercent(((event.clientX - rect.left) / rect.width) * 100),
      y: clampPercent(((event.clientY - rect.top) / rect.height) * 100),
    };
  };

  const formatAnnotations = (items = annotations) =>
    items
      .map((item, idx) => {
        const prefix = `${idx + 1}.`;
        if (item.type === "text") {
          return `${prefix} 文字「${item.text}」位於 ${item.x.toFixed(1)}%, ${item.y.toFixed(1)}%，顏色 ${item.color}`;
        }
        if (item.type === "pencil") {
          const first = item.points[0];
          const last = item.points[item.points.length - 1];
          if (!first || !last) return "";
          return `${prefix} 手繪線條從 ${first.x.toFixed(1)}%, ${first.y.toFixed(1)}% 到 ${last.x.toFixed(1)}%, ${last.y.toFixed(1)}%，顏色 ${item.color}`;
        }
        const label =
          item.type === "arrow"
            ? "箭頭"
            : item.type === "rect"
              ? "矩形框"
              : "圓形框";
        return `${prefix} ${label}從 ${item.x.toFixed(1)}%, ${item.y.toFixed(1)}% 指向/覆蓋 ${item.x2.toFixed(1)}%, ${item.y2.toFixed(1)}%，顏色 ${item.color}`;
      })
      .filter(Boolean)
      .join("\n");

  const buildRevisionPrompt = () => {
    const base = activePrompt ?? "";
    const annotationText = formatAnnotations();
    return `${base}${
      revisionNote.trim() ? `\n\n[Revision Note]\n${revisionNote.trim()}` : ""
    }${imageNote.trim() ? `\n\n[Image Note]\n${imageNote.trim()}` : ""}${
      annotationText ? `\n\n[Image Annotations]\n${annotationText}` : ""
    }`;
  };

  const applyAnnotationsToNote = () => {
    const annotationText = formatAnnotations();
    if (!annotationText) return;
    setImageNote((prev) =>
      [prev.trim(), `[Image Annotations]\n${annotationText}`]
        .filter(Boolean)
        .join("\n\n"),
    );
  };

  const handleAnnotationPointerDown = (
    event: React.PointerEvent<SVGSVGElement>,
  ) => {
    const point = getAnnotationPoint(event);
    if (!point || annotationTool === "select") return;
    event.currentTarget.setPointerCapture(event.pointerId);

    const id = `annotation_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    if (annotationTool === "text") {
      const text = window.prompt("輸入標註文字")?.trim();
      if (!text) return;
      setAnnotations((prev) => [
        ...prev,
        { id, type: "text", color: annotationColor, text, ...point },
      ]);
      return;
    }

    if (annotationTool === "pencil") {
      setAnnotations((prev) => [
        ...prev,
        { id, type: "pencil", color: annotationColor, points: [point] },
      ]);
      setActiveDrawingId(id);
      return;
    }

    setAnnotations((prev) => [
      ...prev,
      {
        id,
        type: annotationTool,
        color: annotationColor,
        x: point.x,
        y: point.y,
        x2: clampPercent(point.x + 12),
        y2: clampPercent(point.y + 8),
      },
    ]);
    setActiveDrawingId(id);
  };

  const handleAnnotationPointerMove = (
    event: React.PointerEvent<SVGSVGElement>,
  ) => {
    if (!activeDrawingId) return;
    const point = getAnnotationPoint(event);
    if (!point) return;
    setAnnotations((prev) =>
      prev.map((item) => {
        if (item.id !== activeDrawingId) return item;
        if (item.type === "pencil") {
          return { ...item, points: [...item.points, point] };
        }
        if (item.type === "text") return item;
        return { ...item, x2: point.x, y2: point.y };
      }),
    );
  };

  const handleAnnotationPointerUp = (
    event: React.PointerEvent<SVGSVGElement>,
  ) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setActiveDrawingId(null);
  };

  const handleUndoAnnotation = () => {
    setAnnotations((prev) => prev.slice(0, -1));
  };

  const handleSendToChatGPT = async () => {
    if (!activePrompt) return;
    setGenStatus("generating");
    setGenResult(null);
    setGenError("");
    setAnnotations([]);
    try {
      const response = await fetch("/api/garden/gpt-image2/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: activePrompt,
          category:
            mode === "gallery"
              ? selectedGalleryItem?.category
              : template?.category,
          template:
            mode === "gallery" ? selectedGalleryItem?.id : template?.name,
          idx:
            mode === "gallery"
              ? selectedGalleryItem?.id
              : args["title"] || args["name"] || "workbench",
          provider: "chatgpt-web",
        }),
      });
      const data = await response.json();
      if (data.status === "success") {
        setGenResult({ base64: data.imageBase64, ext: data.ext });
        setGenStatus("success");
        const a = document.createElement("a");
        a.href = `data:image/${data.ext};base64,${data.imageBase64}`;
        a.download = `${mode === "gallery" ? selectedGalleryItem?.id : template?.name || "workbench"}_${Date.now()}.${data.ext}`;
        a.click();
      } else {
        setGenStatus("error");
        setGenError(data.error?.message || data.message || "未知錯誤");
      }
    } catch (err) {
      setGenStatus("error");
      setGenError(err instanceof Error ? err.message : "無法連線至伺服器");
    }
  };

  const handleSendRevisionToChatGPT = async () => {
    const base = activePrompt ?? "";
    const annotationText = formatAnnotations();
    if (!base || (!revisionNote.trim() && !imageNote.trim() && !annotationText)) {
      return;
    }
    const composed = buildRevisionPrompt();

    setThreadHistory((prev) =>
      [`Send: ${new Date().toLocaleString()}`, ...prev].slice(0, 8),
    );
    setGenStatus("generating");
    setGenResult(null);
    setGenError("");
    try {
      await fetch("/api/garden/gpt-image2/save-revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: revisionSessionId,
          imageNote: [imageNote.trim(), annotationText && `[Image Annotations]\n${annotationText}`]
            .filter(Boolean)
            .join("\n\n"),
          revisionNote,
          prompt: composed,
        }),
      });
      const response = await fetch("/api/garden/gpt-image2/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: composed,
          category:
            mode === "gallery" ? selectedGalleryItem?.category : template?.category,
          template:
            mode === "gallery" ? selectedGalleryItem?.id : template?.name,
          idx: `revision_${Date.now()}`,
          provider: "chatgpt-web",
        }),
      });
      const data = await response.json();
      if (data.status === "success") {
        setGenResult({ base64: data.imageBase64, ext: data.ext });
        setGenStatus("success");
        setAnnotations([]);
      } else {
        setGenStatus("error");
        setGenError(data.error?.message || data.message || "續改生成失敗");
      }
    } catch (err) {
      setGenStatus("error");
      setGenError(err instanceof Error ? err.message : "無法連線至伺服器");
    }
  };

  const renderRevisionPanel = () => {
    if (!genResult) return null;
    return (
      <div className="wb-phase4">
        <h3 className="mono">圖片備註與續改</h3>
        <div className="wb-phase4-annotation-row">
          <span className="mono">
            已加入 {annotations.length} 個圖片標註
          </span>
          <button
            className="wb-phase4-link"
            type="button"
            onClick={() => setPreviewExpanded(true)}
          >
            開啟標註工具
          </button>
        </div>
        <label className="mono wb-phase4-label">圖片備註</label>
        <textarea
          className="wb-phase4-input"
          value={imageNote}
          onChange={(e) => setImageNote(e.target.value)}
          placeholder="例如：主視覺太暗、按鈕可讀性不足、角色臉部需更自然..."
        />
        <label className="mono wb-phase4-label">續改指令</label>
        <textarea
          className="wb-phase4-input"
          value={revisionNote}
          onChange={(e) => setRevisionNote(e.target.value)}
          placeholder="例如：保持構圖，改成淺色背景並提升字體對比..."
        />
        <div className="wb-phase4-actions">
          <button
            className="wb-btn wb-btn-copy"
            onClick={() => {
              const base = activePrompt ?? "";
              const annotationText = formatAnnotations();
              if (!base || (!revisionNote.trim() && !imageNote.trim() && !annotationText)) {
                return;
              }
              const composed = buildRevisionPrompt();
              navigator.clipboard.writeText(composed);
              setCopyStatus("已複製續改提示詞！");
              setThreadHistory((prev) =>
                [`Revision: ${revisionNote.trim()}`, ...prev].slice(0, 8),
              );
              setTimeout(() => setCopyStatus(null), 2000);
            }}
          >
            產生續改提示詞
          </button>
          <button
            className={`wb-btn wb-btn-chatgpt ${genStatus === "generating" ? "loading" : ""}`}
            disabled={
              genStatus === "generating" ||
              !activePrompt ||
              (!revisionNote.trim() && !imageNote.trim() && annotations.length === 0)
            }
            onClick={() => void handleSendRevisionToChatGPT()}
          >
            帶備註續改並傳送
          </button>
        </div>
        {threadHistory.length > 0 && (
          <div className="wb-phase4-history">
            {threadHistory.map((item, idx) => (
              <div key={`${item}-${idx}`} className="wb-phase4-history-item mono">
                {item}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const allCategories = useMemo(
    () =>
      Object.values(cases.categories).sort((a, b) =>
        a.label.localeCompare(b.label),
      ),
    [],
  );

  const selectedCategoryMeta = useMemo(
    () => cases.categories[selectedCategory] || null,
    [selectedCategory],
  );

  const templatesInCategory = useMemo(
    () =>
      selectedCategory
        ? Object.values(cases.templates).filter(
            (t) => t.category === selectedCategory,
          )
        : [],
    [selectedCategory],
  );

  const handleSelectCategory = (categoryKey: string) => {
    setSelectedCategory(categoryKey);
    setSidebarMode("templates");
    navigate({ name: "workbench", categoryId: categoryKey });
  };

  const handleBackToCategories = () => {
    setSidebarMode("category");
    navigate({ name: "workbench" });
  };

  const galleryCategories = useMemo(() => promptGallery.categories, []);

  const galleryItemsForCategory = useMemo(
    () =>
      galleryCategory
        ? promptGallery.items.filter((i) => i.category === galleryCategory)
        : [],
    [galleryCategory],
  );

  const selectGalleryItem = (item: PromptGalleryItem) => {
    setSelectedGalleryItem(item);
    setMode("gallery");
    setGenStatus("idle");
    setGenResult(null);
    setCopyStatus(null);
  };

  const selectTemplate = (key: string) => {
    setSelectedTemplateId(key);
    setMode("template");
    setSelectedGalleryItem(null);
    setGenStatus("idle");
    setGenResult(null);
    navigate({
      name: "workbench",
      categoryId: cases.templates[key]?.category,
      templateId: key,
    });
  };

  const handleRefineField = async (intent: string) => {
    if (!activeFieldForAi || !template || !template.content) return;
    setAiIsLoading(true);
    try {
      const result = await callGeminiCopilot({
        action: "refine_field",
        intent,
        context: {
          template: template.content,
          targetField: activeFieldForAi,
          currentFieldValue: args[activeFieldForAi] || "",
          placeholders: Object.keys(args),
        },
      });
      if (result.success && result.result) {
        setArgs({ ...args, [activeFieldForAi]: result.result });
        setIsAiPopoverOpen(false);
        setActiveFieldForAi(undefined);
      }
    } catch (err) {
      console.error("AI 優化失敗:", err);
    } finally {
      setAiIsLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        const r = await fetch(
          `/api/garden/gpt-image2/list-revisions?sessionId=${encodeURIComponent(revisionSessionId)}`,
        );
        const data = await r.json();
        const entries = Array.isArray(data.entries) ? data.entries : [];
        setThreadHistory(
          entries
            .map((e: { revisionNote?: string; createdAt?: string }) => {
              const note = String(e.revisionNote || "").trim();
              const at = String(e.createdAt || "");
              return note ? `${at}: ${note}` : "";
            })
            .filter(Boolean)
            .slice(0, 8),
        );
      } catch {
        setThreadHistory([]);
      }
    };
    void run();
  }, [revisionSessionId]);

  const renderAnnotation = (annotation: ImageAnnotation) => {
    if (annotation.type === "text") {
      return (
        <text
          key={annotation.id}
          x={annotation.x}
          y={annotation.y}
          fill={annotation.color}
          className="wb-annotation-text"
        >
          {annotation.text}
        </text>
      );
    }

    if (annotation.type === "pencil") {
      return (
        <polyline
          key={annotation.id}
          points={annotation.points
            .map((point) => `${point.x},${point.y}`)
            .join(" ")}
          fill="none"
          stroke={annotation.color}
          strokeWidth="0.65"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }

    if (annotation.type === "arrow") {
      return (
        <line
          key={annotation.id}
          x1={annotation.x}
          y1={annotation.y}
          x2={annotation.x2}
          y2={annotation.y2}
          stroke={annotation.color}
          strokeWidth="0.75"
          strokeLinecap="round"
          markerEnd="url(#wb-arrow-head)"
        />
      );
    }

    const x = Math.min(annotation.x, annotation.x2);
    const y = Math.min(annotation.y, annotation.y2);
    const width = Math.abs(annotation.x2 - annotation.x);
    const height = Math.abs(annotation.y2 - annotation.y);

    if (annotation.type === "ellipse") {
      return (
        <ellipse
          key={annotation.id}
          cx={x + width / 2}
          cy={y + height / 2}
          rx={width / 2}
          ry={height / 2}
          fill="none"
          stroke={annotation.color}
          strokeWidth="0.7"
        />
      );
    }

    return (
      <rect
        key={annotation.id}
        x={x}
        y={y}
        width={width}
        height={height}
        fill="none"
        stroke={annotation.color}
        strokeWidth="0.7"
      />
    );
  };

  return (
    <div className="wb">
      <div className="wb-sidebar">
        <div className="wb-sidebar-header">
          <button
            className="sp-back"
            onClick={() => navigate({ name: "home" })}
          >
            ← 返回主頁
          </button>
          <h2 className="serif">提示詞工作臺</h2>
          <p className="wb-sidebar-sub">定製化您的完美提示詞</p>
          <button
            type="button"
            className="wb-c1-entry"
            onClick={() => navigate({ name: "c1" })}
          >
            C1 Prompt Expert
          </button>
        </div>

        <div className="wb-nav">
          {sidebarMode === "category" ? (
            <div className="wb-nav-section">
              <h4 className="mono">選擇提示詞分類</h4>
              {allCategories.map((cat) => (
                <button
                  key={cat.key}
                  className="wb-nav-item"
                  onClick={() => handleSelectCategory(cat.key)}
                >
                  <span className="wb-cat-label">{cat.label}</span>
                  <span className="wb-cat-count mono">
                    {cat.ready}/{cat.total}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div>
              <button
                className="wb-back-btn mono"
                onClick={handleBackToCategories}
              >
                ← 返回分類選擇
              </button>
              {selectedCategoryMeta && (
                <div className="wb-nav-section">
                  <h4 className="mono">{selectedCategoryMeta.label}</h4>
                  {templatesInCategory.map((t) => (
                    <button
                      key={t.key}
                      className={`wb-nav-item ${mode === "template" && selectedTemplateId === t.key ? "active" : ""}`}
                      onClick={() => selectTemplate(t.key)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="wb-nav-section">
            <h4 className="mono">圖片提示詞資料庫</h4>
            <select
              className="wb-select"
              value={galleryCategory}
              onChange={(e) => {
                setGalleryCategory(e.target.value);
                setSelectedGalleryItem(null);
              }}
            >
              <option value="">選擇分類...</option>
              {galleryCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {galleryItemsForCategory.length > 0 && (
              <div className="wb-gallery-list">
                {galleryItemsForCategory.map((item) => (
                  <button
                    key={item.id}
                    className={`wb-nav-item wb-gallery-item ${mode === "gallery" && selectedGalleryItem?.id === item.id ? "active" : ""}`}
                    onClick={() => selectGalleryItem(item)}
                  >
                    {item.previewImageUrl && (
                      <img
                        className="wb-gallery-thumb"
                        src={item.previewImageUrl}
                        alt=""
                        loading="lazy"
                      />
                    )}
                    <span className="wb-gallery-title">{item.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="wb-main">
        {mode === "gallery" && selectedGalleryItem ? (
          <div className="wb-content">
            <div className="wb-header">
              <div className="wb-header-main">
                <span
                  className="wb-category-tag"
                  style={{ "--acc": "#7C3AED" } as React.CSSProperties}
                >
                  {selectedGalleryItem.category}
                </span>
                <h1 className="serif">{selectedGalleryItem.title}</h1>
                {selectedGalleryItem.summary && (
                  <p className="wb-desc">{selectedGalleryItem.summary}</p>
                )}
                <div className="wb-gallery-meta">
                  <span className="wb-meta-tag mono">
                    {selectedGalleryItem.model}
                  </span>
                  <span className="wb-meta-tag mono">
                    {selectedGalleryItem.aspect}
                  </span>
                  {selectedGalleryItem.tags.map((tag) => (
                    <span key={tag} className="wb-meta-tag mono">
                      {tag}
                    </span>
                  ))}
                  {selectedGalleryItem.source.author && (
                    <a
                      className="wb-meta-author mono"
                      href={selectedGalleryItem.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      by {selectedGalleryItem.source.author}
                    </a>
                  )}
                  <span className="wb-meta-license mono">
                    {selectedGalleryItem.source.license}
                  </span>
                </div>
              </div>
              <div className="wb-actions">
                <button className="wb-btn wb-btn-copy" onClick={handleCopy}>
                  {copyStatus || "複製提示詞"}
                </button>
                <button
                  className={`wb-btn wb-btn-chatgpt ${genStatus === "generating" ? "loading" : ""}`}
                  onClick={handleSendToChatGPT}
                  disabled={genStatus === "generating"}
                >
                  {genStatus === "generating" ? "生成中..." : "傳送到 ChatGPT"}
                </button>
              </div>
            </div>

            {genStatus === "generating" && (
              <div className="wb-gen-status mono">
                🚀 正在透過 Chrome CDP 生成圖片...
              </div>
            )}
            {genStatus === "error" && (
              <div className="wb-gen-status wb-gen-error mono">
                <div style={{ marginBottom: "12px", whiteSpace: "pre-wrap" }}>
                  {genError || "❌ 生成失敗（未知原因）"}
                </div>
                <div style={{ fontSize: "12px", opacity: 0.8 }}>
                  如果問題持續，請在 Terminal 執行：
                  <br />
                  1. cp -r ~/Library/Application\ Support/Google/Chrome/Default
                  /tmp/chrome-profile-copy/Default
                  <br />
                  2. /Applications/Google\ Chrome.app/Contents/MacOS/Google\
                  Chrome --remote-debugging-port=9000
                  --user-data-dir=/tmp/chrome-profile-copy
                  --profile-directory=Default
                </div>
              </div>
            )}
            {genResult && (
              <div className="wb-gen-result">
                <button
                  className="wb-gen-thumb"
                  onClick={() => setPreviewExpanded(true)}
                >
                  <img
                    src={`data:image/${genResult.ext};base64,${genResult.base64}`}
                    alt="已生成圖片"
                  />
                  <span className="wb-gen-thumb-hint mono">點擊展開</span>
                </button>
                <span className="wb-gen-downloaded mono">✅ 已下載至本機</span>
              </div>
            )}
            {renderRevisionPanel()}

            <div className="wb-gallery-view">
              {selectedGalleryItem.previewImageUrl && (
                <div className="wb-gallery-preview">
                  <h3 className="mono">範例效果 PREVIEW</h3>
                  <img
                    src={selectedGalleryItem.previewImageUrl}
                    alt="範例效果"
                    className="wb-gallery-preview-img"
                  />
                </div>
              )}
              <div className="wb-gallery-prompt">
                <h3 className="mono">提示詞全文 PROMPT</h3>
                <div className="wb-preview-box">
                  <pre className="wb-code">{selectedGalleryItem.prompt}</pre>
                </div>
              </div>
            </div>
          </div>
        ) : mode === "template" && template ? (
          <div className="wb-content">
            <div className="wb-header">
              <div className="wb-header-main">
                <span
                  className="wb-category-tag"
                  style={{ "--acc": "#1F6FB2" } as React.CSSProperties}
                >
                  {template.category}
                </span>
                <h1 className="serif">{template.label}</h1>
                {template.description && (
                  <p className="wb-desc">{template.description}</p>
                )}
              </div>
              <div className="wb-actions">
                <button className="wb-btn wb-btn-copy" onClick={handleCopy}>
                  {copyStatus || "複製提示詞"}
                </button>
                <button
                  className="wb-btn wb-btn-primary"
                  onClick={handleArchive}
                >
                  {archiveStatus || "自動歸檔"}
                </button>
                <button
                  className={`wb-btn wb-btn-chatgpt ${genStatus === "generating" ? "loading" : ""}`}
                  onClick={handleSendToChatGPT}
                  disabled={
                    genStatus === "generating" ||
                    !renderResult ||
                    typeof renderResult !== "string"
                  }
                >
                  {genStatus === "generating" ? "生成中..." : "傳送到 ChatGPT"}
                </button>
              </div>
            </div>

            {genStatus === "generating" && (
              <div className="wb-gen-status mono">
                🚀 正在透過 Chrome CDP 生成圖片...
              </div>
            )}
            {genStatus === "error" && (
              <div className="wb-gen-status wb-gen-error mono">
                <div style={{ marginBottom: "12px", whiteSpace: "pre-wrap" }}>
                  {genError || "❌ 生成失敗（未知原因）"}
                </div>
                <div style={{ fontSize: "12px", opacity: 0.8 }}>
                  如果問題持續，請在 Terminal 執行：
                  <br />
                  1. cp -r ~/Library/Application\ Support/Google/Chrome/Default
                  /tmp/chrome-profile-copy/Default
                  <br />
                  2. /Applications/Google\ Chrome.app/Contents/MacOS/Google\
                  Chrome --remote-debugging-port=9000
                  --user-data-dir=/tmp/chrome-profile-copy
                  --profile-directory=Default
                </div>
              </div>
            )}
            {genResult && (
              <div className="wb-gen-result">
                <button
                  className="wb-gen-thumb"
                  onClick={() => setPreviewExpanded(true)}
                >
                  <img
                    src={`data:image/${genResult.ext};base64,${genResult.base64}`}
                    alt="已生成圖片"
                  />
                  <span className="wb-gen-thumb-hint mono">點擊展開</span>
                </button>
                <span className="wb-gen-downloaded mono">✅ 已下載至本機</span>
              </div>
            )}
            {renderRevisionPanel()}

            <div className="wb-grid">
              <section className="wb-params">
                <h3 className="mono">引數設定 PARAMS</h3>
                <div className="wb-form">
                  {placeholders.map((p) => (
                    <div key={p} className="wb-field">
                      <label>
                        <span className="wb-field-label">
                          {formatParamLabel(p, template?.param_labels)}
                        </span>
                        <span className="wb-field-key mono">{p}</span>
                      </label>
                      <div className="wb-field-input-group">
                        {p.includes("message") ||
                        p.includes("msg") ||
                        p.includes("description") ||
                        p.includes("content") ? (
                          <textarea
                            value={args[p] || ""}
                            onChange={(e) =>
                              setArgs({ ...args, [p]: e.target.value })
                            }
                            placeholder={`輸入${formatParamLabel(p, template?.param_labels)}...`}
                          />
                        ) : (
                          <input
                            type="text"
                            value={args[p] || ""}
                            onChange={(e) =>
                              setArgs({ ...args, [p]: e.target.value })
                            }
                            placeholder={`輸入${formatParamLabel(p, template?.param_labels)}...`}
                          />
                        )}
                        <button
                          className="wb-field-ai-btn"
                          onClick={() => {
                            setActiveFieldForAi(p);
                            setIsAiPopoverOpen(true);
                          }}
                          ref={(el) => {
                            if (p === activeFieldForAi) {
                              aiFieldRef.current = el;
                            }
                          }}
                          title="使用 AI 優化此欄位"
                          type="button"
                        >
                          ✨
                        </button>
                      </div>
                    </div>
                  ))}
                  {placeholders.length === 0 && (
                    <p className="wb-empty">此模板無自定義引數</p>
                  )}
                </div>
              </section>

              <section className="wb-preview">
                <h3 className="mono">渲染預覽 PREVIEW</h3>
                <div className="wb-preview-box">
                  {renderResult && typeof renderResult === "string" ? (
                    <pre className="wb-code">{renderResult}</pre>
                  ) : (
                    <div className="wb-error">
                      {typeof renderResult === "object" && renderResult !== null
                        ? (renderResult as { error: string }).error
                        : "等待輸入..."}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        ) : (
          <div className="wb-empty-state">
            <div className="wb-empty-icon">🛠️</div>
            <h2 className="serif">選擇一個模板開始定製</h2>
            <p>從左側選擇 UI/UX 模板、知識模板，或瀏覽圖片提示詞資料庫。</p>
          </div>
        )}
      </main>

      <AiAgentPopover
        isOpen={isAiPopoverOpen}
        onClose={() => {
          setIsAiPopoverOpen(false);
          setActiveFieldForAi(undefined);
        }}
        onRefine={handleRefineField}
        anchorRef={aiFieldRef}
        title={
          activeFieldForAi
            ? formatParamLabel(activeFieldForAi, template?.param_labels)
            : ""
        }
        placeholder="告訴 AI 你想怎麼改善這個欄位..."
        isLoading={aiIsLoading}
      />

      {previewExpanded && genResult && (
        <div className="wb-lightbox">
          <button
            className="wb-lightbox-close"
            onClick={() => setPreviewExpanded(false)}
            type="button"
          >
            ✕
          </button>
          <div className="wb-annotation-shell">
            <div className="wb-annotation-toolbar">
              <Toolbar
                activeTool={annotationTool}
                color={annotationColor}
                onToolChange={setAnnotationTool}
                onColorChange={setAnnotationColor}
                onUndo={handleUndoAnnotation}
                onClear={() => setAnnotations([])}
              />
            </div>
            <div className="wb-annotation-body">
              <div className="wb-annotation-stage-wrap">
                <div className="wb-annotation-stage">
                  <img
                    className="wb-annotation-image"
                    src={`data:image/${genResult.ext};base64,${genResult.base64}`}
                    alt="生成圖片全覽"
                  />
                  <svg
                    ref={annotationStageRef}
                    className={`wb-annotation-layer tool-${annotationTool}`}
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    onPointerDown={handleAnnotationPointerDown}
                    onPointerMove={handleAnnotationPointerMove}
                    onPointerUp={handleAnnotationPointerUp}
                    onPointerCancel={handleAnnotationPointerUp}
                    aria-label="圖片標註畫布"
                  >
                    <defs>
                      <marker
                        id="wb-arrow-head"
                        markerWidth="6"
                        markerHeight="6"
                        refX="5"
                        refY="3"
                        orient="auto"
                        markerUnits="strokeWidth"
                      >
                        <path d="M0,0 L6,3 L0,6 Z" fill="context-stroke" />
                      </marker>
                    </defs>
                    {annotations.map(renderAnnotation)}
                  </svg>
                </div>
              </div>
              <aside className="wb-annotation-panel">
                <div>
                  <span className="mono wb-annotation-kicker">Annotation</span>
                  <h3>標註後回傳 ChatGPT</h3>
                  <p>
                    在圖片上加入文字、箭頭、手繪線與幾何框，系統會把座標摘要併入續改提示詞。
                  </p>
                </div>
                <div className="wb-annotation-summary">
                  {annotations.length > 0 ? (
                    <pre>{formatAnnotations()}</pre>
                  ) : (
                    <span className="mono">尚未加入標註</span>
                  )}
                </div>
                <div className="wb-annotation-actions">
                  <button
                    className="wb-btn wb-btn-copy"
                    type="button"
                    disabled={annotations.length === 0}
                    onClick={applyAnnotationsToNote}
                  >
                    套用到圖片備註
                  </button>
                  <button
                    className="wb-btn wb-btn-chatgpt"
                    type="button"
                    disabled={
                      genStatus === "generating" ||
                      !activePrompt ||
                      (!revisionNote.trim() &&
                        !imageNote.trim() &&
                        annotations.length === 0)
                    }
                    onClick={() => void handleSendRevisionToChatGPT()}
                  >
                    標註續改傳送
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
