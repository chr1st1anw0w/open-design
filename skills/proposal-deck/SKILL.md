---
name: proposal-deck
description: |
  計畫書視覺化 Skill — 專為政府標案、商業提案設計。
  封裝提案書資訊架構（問題→方案→KPI→ROI）與繁中/英文雙語排版規則。
triggers:
  - "計畫書"
  - "提案"
  - "proposal"
  - "deck"
  - "標案"
od:
  mode: prototype
  platform: desktop
  scenario: business
  preview:
    type: html
    entry: index.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  example_prompt: "為杰銳計畫撰寫一份提案計畫書，包含問題分析、解決方案與預期 ROI。"
---

# Proposal Deck Skill

將複雜的文字提案轉化為視覺化的計畫書。

## Workflow

1. 資訊架構 (Information Architecture):
   - **現況分析 (Current State)**: 描述客戶面臨的痛點。
   - **核心方案 (Proposed Solution)**: 具體的技術或設計解決方案。
   - **執行效益 (KPI/ROI)**: 數據化的產出（如：效率提升 20%、成本降低 15%）。
   - **執行時程 (Roadmap)**: 專案里程碑。
2. 視覺風格 (Visual Style):
   - **標案傾向 (Government Tenders)**: 嚴謹、層級清晰、使用藍/灰/白等穩定色系。
   - **品牌提案 (Brand Proposals)**: 大膽、視覺化、強調品牌調性。
3. 排版規則:
   - 繁中/英文雙語對照時，確保字體粗細與行高協調。
   - 使用大量的圖表與側欄說明，避免純文字塊。

## Output contract

```
<artifact identifier="proposal-deck" type="text/html" title="計畫提案書 - [專案名稱]">
<!doctype html>...</artifact>
```
