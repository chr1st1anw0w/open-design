import type { ComponentType } from 'react';

/** 單個章節的執行時上下文：傳入到章節元件 props 中 */
export interface ChapterContext {
  /** 當前章節內的區域性 step（0..steps-1） */
  localStep: number;
  /** 當前章節的總 step 數 */
  steps: number;
  /** 進入 / 離開方向（用於轉場，正向 1 / 反向 -1） */
  direction: 1 | -1;
}

export interface ChapterDef {
  /** 唯一標識（用於 URL hash / 除錯） */
  id: string;
  /** 中文標題（用於進度條 tooltip） */
  title: string;
  /** 英文 / 編號 eyebrow（視覺用） */
  eyebrow?: string;
  /** 章節內 step 數量（必須 >= 1） */
  steps: number;
  /** 主題：light = 米底，ink = 深墨底 */
  theme?: 'light' | 'ink';
  /** 章節元件 */
  Component: ComponentType<ChapterContext>;
}
