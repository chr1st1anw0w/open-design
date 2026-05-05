---
name: zh-tw-design-brief
description: |
  專業設計簡報生成器 (繁體中文) — 針對科技、奢侈品、製造業等不同行業生成符合 zh-TW 語境的設計簡報。
  包含客戶背景分析、設計目標、風格定義、Design Tokens 規範。
triggers:
  - "設計簡報"
  - "design brief"
  - "設計需求"
  - "brief"
od:
  mode: prototype
  platform: desktop
  scenario: design
  preview:
    type: html
    entry: index.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  example_prompt: "幫我寫一份針對製造業客戶的雲端戰情中心設計簡報，包含設計目標和風格定義。"
---

# Design Brief Skill (zh-TW)

產生一份專業的設計簡報 (Design Brief)，採用繁體中文語境，特別強化行業適配性。

## Workflow

1. 識別客戶行業類型：
   - **科技 (Tech)**: 強調創新、效率、未來感。
   - **奢侈品 (Luxury)**: 強調質感、細節、品牌故事。
   - **製造業 (Manufacturing)**: 強調穩定、數據化、工業 4.0 語境。
2. 結構：
   - **封面**: 專案名稱、客戶名稱、日期。
   - **專案概述**: 用一段話描述核心挑戰。
   - **設計目標 (Design Goals)**: 3-5 個具體的成功標準。
   - **品牌個性 (Brand Personality)**: 使用關鍵字描述（如：專業、可靠、前衛）。
   - **Design Tokens 規範**: 初步定義色彩語義、字體層級。
   - **交付物清單 (Deliverables)**: UI 介面、Prototype、設計規範文件等。
3. 視覺規範：
   - 乾淨的排版，適度的留白。
   - 針對不同行業使用對應的 accent color (預設使用專案 design system)。

## Output contract

```
<artifact identifier="design-brief" type="text/html" title="設計簡報 - [專案名稱]">
<!doctype html>...</artifact>
```
