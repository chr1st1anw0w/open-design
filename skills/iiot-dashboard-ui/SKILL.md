---
name: iiot-dashboard-ui
description: |
  工業戰情中心 (IIoT Dashboard) UI 產生器 — 專為製造業、ERP/MES 整合設計。
  定義工業數據看板的 Design Tokens、色彩語義與組件規則。
triggers:
  - "iiot dashboard"
  - "戰情中心"
  - "工業看板"
  - "dashboard"
  - "iot"
od:
  mode: prototype
  platform: desktop
  scenario: industrial
  preview:
    type: html
    entry: index.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  example_prompt: "為杰銳計畫設計一個包含 OEE、即時產量與設備狀態的工業戰情中心看板。"
---

# IIoT Dashboard UI Skill

開發工業級數據戰情中心介面，整合複雜的生產數據。

## Workflow

1. 定義工業設計系統 (Industrial Design System):
   - **色彩語義 (Status Colors)**:
     - 警示紅 (Alert Red): 設備停機、致命錯誤。
     - 預測橙 (Predictive Orange): 預測性維修提醒、效能下降。
     - 正常綠 (Normal Green): 穩定生產中。
     - 待機藍 (Standby Blue): 設備待機、換模中。
   - **元件命名**: 使用 ERP/MES 標準語境（如 OEE, Availability, Performance, Quality）。
2. 看板結構:
   - **頂部導航**: 廠區選擇、目前班別、系統時間。
   - **關鍵指標 (KPI Cards)**: OEE 總覽、稼動率、良率。
   - **即時圖表**: 生產趨勢線圖、設備負載圓餅圖。
   - **設備列表/地圖**: 條列式或地圖式呈現所有機台狀態。
3. 技術要求:
   - 高對比度，適合工廠環境顯示器。
   - 字體清晰，關鍵數據大字級。

## Output contract

```
<artifact identifier="iiot-dashboard" type="text/html" title="工業戰情中心 - [專案名稱]">
<!doctype html>...</artifact>
```
