import React, { useState } from "react";
import { TemplatePicker } from "./TemplatePicker";
import { StudioWorkspace } from "./StudioWorkspace";
import { ArchiveBrowser } from "./ArchiveBrowser";
import type { PromptTemplate, TemplateMeta, ArgumentValue } from "../../types";
import { renderPrompt, extractPlaceholders } from "../../lib/prompt-engine";
import { loadTemplateMarkdown, savePrompt } from "../../lib/archive-client";
import { cases } from "../../lib/data";

import "./prompt-studio.css";

type StudioStage = "category-select" | "template-select" | "workspace";

// 將 TemplateMeta 轉換為 PromptTemplate (UI 使用的格式)
function toPromptTemplate(t: TemplateMeta, phs: string[]): PromptTemplate {
  return {
    id: t.key,
    name: t.label || t.name,
    description: t.description ?? "",
    category: t.category,
    ready: t.cases_count > 0,
    image: "",
    placeholders: phs,
    param_labels: t.param_labels,
  };
}

export const PromptStudio: React.FC = () => {
  const [stage, setStage] = useState<StudioStage>("category-select");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] =
    useState<PromptTemplate | null>(null);
  const [templateMarkdown, setTemplateMarkdown] = useState<string>("");
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [args, setArgs] = useState<Record<string, ArgumentValue>>({});
  const [renderedPrompt, setRenderedPrompt] = useState<string>("");
  const [isArchiveOpen, setIsArchiveOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const categoryLabelMap = React.useMemo(() => {
    const map: Record<string, { zh: string; en: string }> = {};
    Object.values(cases.categories).forEach((cat) => {
      map[cat.key] = { zh: cat.cn || cat.label || cat.key, en: cat.key };
    });
    map["brand-assets"] = { zh: "品牌素材與包裝", en: "brand-assets" };
    return map;
  }, []);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setStage("template-select");
  };

  const handleTemplateSelect = async (tmpl: TemplateMeta) => {
    setIsLoading(true);
    try {
      let md = tmpl.content ?? "";
      let phs: string[] = [];

      if (md) {
        // 內容已預載，直接提取佔位符
        phs = extractPlaceholders(md);
      } else {
        // 從後端取得模板 markdown
        // key 格式: "category/template-slug"，取 "/" 後的部分
        const slug = tmpl.key.split("/").slice(1).join("/");
        const res = await loadTemplateMarkdown(tmpl.category, slug);
        md = res.md;
        phs = res.placeholders;
      }

      const promptTemplate = toPromptTemplate(tmpl, phs);
      setSelectedTemplate(promptTemplate);
      setTemplateMarkdown(md);
      setPlaceholders(phs);

      // Initialize arguments with empty strings to ensure real-time preview doesn't show undefined
      const initialArgs: Record<string, string> = {};
      phs.forEach((p) => {
        initialArgs[p] = "";
      });

      setArgs(initialArgs);
      setRenderedPrompt(renderPrompt(md, initialArgs));
      setStage("workspace");
    } catch (err) {
      console.error("載入模板失敗", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArgsChange = (newArgs: Record<string, ArgumentValue>) => {
    setArgs(newArgs);
    setRenderedPrompt(renderPrompt(templateMarkdown, newArgs));
  };

  const handleSavePrompt = async (
    format: "structured" | "json-flat",
    tags?: string[],
  ) => {
    if (selectedCategory && selectedTemplate && renderedPrompt) {
      const response = await savePrompt({
        category: selectedCategory,
        template: selectedTemplate.id,
        args,
        prompt: renderedPrompt,
        format,
        tags,
      });
      if (response.ok) {
        alert("提示詞已成功儲存！");
      } else {
        alert(`儲存失敗：${response.error}`);
      }
    }
  };

  const goBack = () => {
    if (stage === "workspace") {
      setStage("template-select");
      return;
    }
    if (stage === "template-select") {
      setStage("category-select");
      setSelectedCategory(null);
      return;
    }
  };

  const STAGE_LABELS: Record<StudioStage, { zh: string; en: string }> = {
    "category-select": { zh: "選擇分類", en: "Select Category" },
    "template-select": { zh: "選擇模板", en: "Select Template" },
    workspace: { zh: "即時編輯與預覽", en: "Real-time Studio Workspace" },
  };

  return (
    <div className="prompt-studio-container">
      <header className="studio-header">
        {/* 麵包屑導航 */}
        <nav className="studio-breadcrumb mono" aria-label="導航路徑">
          <span
            className={`studio-breadcrumb-item ${stage === "category-select" ? "active" : "clickable"}`}
            onClick={() => {
              setStage("category-select");
              setSelectedCategory(null);
            }}
          >
            提示詞工坊
          </span>
          {stage !== "category-select" && selectedCategory && (
            <>
              <span className="studio-breadcrumb-sep">›</span>
              <span
                className={`studio-breadcrumb-item ${stage === "template-select" ? "active" : "clickable"}`}
                onClick={() => setStage("template-select")}
              >
                {selectedCategory}
              </span>
            </>
          )}
          {stage === "workspace" && selectedTemplate && (
            <>
              <span className="studio-breadcrumb-sep">›</span>
              <span className="studio-breadcrumb-item active">
                {selectedTemplate.name}
              </span>
            </>
          )}
        </nav>

        <div className="studio-header-main">
          <div className="eyebrow">Prompt Studio · 提示詞工作室</div>
          <h1>
            <span className="serif">{STAGE_LABELS[stage].zh}</span>
            <span className="badge">{STAGE_LABELS[stage].en}</span>
          </h1>
        </div>

        <div className="studio-header-actions">
          {stage !== "category-select" && (
            <button className="archive-toggle-button" onClick={goBack}>
              ← 返回
            </button>
          )}
          <button
            className="archive-toggle-button"
            onClick={() => setIsArchiveOpen(!isArchiveOpen)}
          >
            {isArchiveOpen ? "關閉歸檔" : "開啟歸檔"}
          </button>
        </div>
      </header>

      <main className="studio-grid">
        {isLoading && (
          <div className="studio-loading">
            <span className="mono">載入模板中…</span>
          </div>
        )}

        {!isLoading && stage === "category-select" && (
          <div className="selection-view">
            <h2 className="template-list-title serif">
              選擇提示詞分類{" "}
              <span className="text-faint mono" style={{ fontSize: "1rem" }}>
                Choose a Category
              </span>
            </h2>
            <TemplatePicker
              onSelectCategory={handleCategorySelect}
              onSelectTemplate={handleTemplateSelect}
              filterCategory={null}
            />
          </div>
        )}

        {!isLoading && stage === "template-select" && selectedCategory && (
          <div className="selection-view">
            <h2 className="template-list-title serif">
              選擇模板{" "}
              <span
                className="text-faint"
                style={{ fontSize: "1.2rem", marginLeft: 8 }}
              >
                {categoryLabelMap[selectedCategory]?.zh ?? selectedCategory}
              </span>
              <span
                className="text-faint mono"
                style={{ fontSize: "1rem", marginLeft: 10 }}
              >
                {categoryLabelMap[selectedCategory]?.en ?? selectedCategory}
              </span>
            </h2>
            <TemplatePicker
              onSelectCategory={handleCategorySelect}
              onSelectTemplate={handleTemplateSelect}
              filterCategory={selectedCategory}
            />
          </div>
        )}

        {!isLoading && stage === "workspace" && selectedTemplate && (
          <StudioWorkspace
            template={selectedTemplate}
            placeholders={placeholders}
            args={args}
            onArgsChange={handleArgsChange}
            renderedPrompt={renderedPrompt}
            sourceTemplate={templateMarkdown}
            onSave={handleSavePrompt}
          />
        )}
      </main>

      <ArchiveBrowser
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
      />
    </div>
  );
};
