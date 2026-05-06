export interface PromptCategoryMeta {
  key: string;
  label: string;
  cn: string;
  accent: string;
  templates: string[];
  total: number;
  ready: number;
}

export interface PromptTemplateMeta {
  key: string;
  category: string;
  name: string;
  label: string;
  md_path: string;
  description: string | null;
  content: string | null;
  cases_count: number;
  param_labels?: Record<string, string>;
}

// Legacy aliases for backward compatibility
export type CategoryMeta = PromptCategoryMeta;
export type TemplateMeta = PromptTemplateMeta;

export interface PromptCaseRecord {
  id: string;
  category: string;
  category_label: string;
  category_accent: string;
  template_key: string;
  template_label: string;
  idx: number;
  title: string;
  brief: string;
  format: "json" | "txt";
  prompt_path: string;
  prompt_url: string;
  prompt_content: string | null;
  /** Full-resolution original PNG. Only loaded when a case detail opens. */
  image_url: string | null;
  /** Compressed 800px WebP thumbnail used in galleries / hero / strips. */
  thumb_url: string | null;
  has_image: boolean;
}

// Legacy alias for backward compatibility
export type PromptCase = PromptCaseRecord;

export interface PromptGalleryItem {
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

export interface PromptGallery {
  generated_at: string;
  total: number;
  categories: string[];
  items: PromptGalleryItem[];
}

export interface PromptStudioDataSourceManifest {
  generated_at: string;
  summary: { templates: number; cases: number };
  categories: Record<string, PromptCategoryMeta>;
  templates: Record<string, PromptTemplateMeta>;
  cases: PromptCaseRecord[];
}

// Legacy alias for backward compatibility
export type CasesManifest = PromptStudioDataSourceManifest;

export interface DocsManifest {
  skill_md: string | null;
  intro_md: string | null;
  generated_at: string;
}

export type Route =
  | { name: "home" }
  | { name: "case"; id: string }
  | { name: "skills" }
  | { name: "workbench"; templateId?: string }
  | { name: "promptStudio" }
  | { name: "uiuxStudio" };

export type PromptTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  ready: boolean;
  image: string;
  placeholders: string[];
  defaultArgs?: Record<string, ArgumentValue>;
  param_labels?: Record<string, string>;
};

export type ArgumentValue = string | number | boolean | string[];

export type ArchiveEntry = {
  category: string;
  template: string;
  slug: string;
  timestamp: string;
  format: "structured" | "json-flat";
  tags?: string[];
  args: Record<string, ArgumentValue>;
  renderedPrompt: string;
  sourceTemplate: string;
};
