import React from 'react';
import { cases } from '../../lib/data';
import type { TemplateMeta } from '../../types';

interface TemplatePickerProps {
  onSelectCategory: (category: string) => void;
  onSelectTemplate: (template: TemplateMeta) => void;
  filterCategory: string | null;
}

const BRAND_ASSETS_CATEGORY_KEY = 'brand-assets';

const BRAND_ASSETS_TEMPLATE: TemplateMeta = {
  key: 'brand-assets/muhuotu-product-packaging',
  category: BRAND_ASSETS_CATEGORY_KEY,
  name: "MUHUOTU's Product Packaging",
  label: "MUHUOTU's Product Packaging",
  md_path: '/prompt-templates/brand-assets/MUHUOTU-木火土-ProductPrompt-260506.md',
  description:
    '寵物產品包裝提示詞參考。可延伸為白底主圖、場景圖、平鋪圖、品牌 KV 等商業素材。',
  content: `# MUHUOTU 木火土 — Product Packaging Prompt

請參考：/Users/christianwu/open-design/prompt-templates/brand-assets

目標：
- 產出可直接用於 GPT-Image2 的產品包裝與商業素材提示詞

核心輸入：
- 品牌名稱、產品名稱、規格、受眾、配色、場景

輸出方向：
- 白底商品圖
- 45 度場景圖
- 生活情境圖
- Flat Lay
- 品牌主視覺 Key Visual`,
  cases_count: 2,
};

const BRAND_ASSETS_CATEGORY_META = {
  key: BRAND_ASSETS_CATEGORY_KEY,
  label: 'Brand Assets',
  cn: '品牌素材與包裝',
  accent: '#C96442',
  templates: [BRAND_ASSETS_TEMPLATE.key],
  total: 2,
  ready: 1,
};

export const TemplatePicker: React.FC<TemplatePickerProps> = ({
  onSelectCategory,
  onSelectTemplate,
  filterCategory
}) => {
  // === 分類選擇畫面 ===
  if (!filterCategory) {
    const categories = [
      ...Object.values(cases.categories),
      BRAND_ASSETS_CATEGORY_META,
    ];
    return (
      <div className="template-grid">
        {categories.map(cat => (
          <div
            key={cat.key}
            className="template-card"
            onClick={() => onSelectCategory(cat.key)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onSelectCategory(cat.key)}
            style={{ '--cat-acc': cat.accent } as React.CSSProperties}
          >
            <div className="eyebrow mono">{cat.key}</div>
            <h3 className="serif">{cat.cn || cat.label}</h3>
            <p>{cat.total} 個案例 · {cat.ready} 個模板</p>
            <div className="template-card-footer">
              <span className="mono">{cat.templates.length} TEMPLATES</span>
              <span style={{ color: cat.accent }}>→</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // === 模板選擇畫面（依分類過濾）===
  const categoryMeta = cases.categories[filterCategory];
  const isBrandAssets = filterCategory === BRAND_ASSETS_CATEGORY_KEY;
  const templateKeys = categoryMeta?.templates ?? [];
  const templates = isBrandAssets
    ? [BRAND_ASSETS_TEMPLATE]
    : templateKeys
        .map(key => cases.templates[key])
        .filter((t): t is TemplateMeta => !!t);

  if (templates.length === 0) {
    return (
      <div className="template-empty">
        <p className="text-mute">此分類尚無模板</p>
      </div>
    );
  }

  return (
    <div className="template-grid">
      {templates.map(tmpl => (
        <div
          key={tmpl.key}
          className="template-card"
          onClick={() => onSelectTemplate(tmpl)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && onSelectTemplate(tmpl)}
        >
          <div className="eyebrow mono">{tmpl.category}</div>
          <h3 className="serif">{tmpl.label || tmpl.name}</h3>
          {tmpl.description && <p>{tmpl.description}</p>}
          <div className="template-card-footer">
            <span className="mono">{tmpl.cases_count} 個案例</span>
            <button className="use-button" onClick={e => { e.stopPropagation(); onSelectTemplate(tmpl); }}>
              使用此模板
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
