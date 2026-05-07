"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Circle,
  MousePointer2,
  Palette,
  Pencil,
  RotateCcw,
  Square,
  Trash2,
  Type,
} from "lucide-react";
import { useState } from "react";
import type { ComponentType } from "react";

export type AnnotationTool = "select" | "text" | "arrow" | "pencil" | "rect" | "ellipse";

type ToolbarAction = {
  label: string;
  value: AnnotationTool;
  icon: ComponentType<{ className?: string }>;
};

const tools: ToolbarAction[] = [
  { label: "選取", value: "select", icon: MousePointer2 },
  { label: "文字", value: "text", icon: Type },
  { label: "箭頭", value: "arrow", icon: ArrowUpRight },
  { label: "鉛筆", value: "pencil", icon: Pencil },
  { label: "矩形", value: "rect", icon: Square },
  { label: "圓形", value: "ellipse", icon: Circle },
];

const swatches = ["#f97316", "#22c55e", "#2563eb", "#ef4444", "#facc15", "#ffffff"];

type ToolbarButtonProps = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  isActive?: boolean;
  onClick: () => void;
  tooltip: string | null;
  showTooltip: (label: string) => void;
  hideTooltip: () => void;
};

function ToolbarButton({
  label,
  icon: Icon,
  isActive = false,
  onClick,
  tooltip,
  showTooltip,
  hideTooltip,
}: ToolbarButtonProps) {
  return (
    <div
      className="od-toolbar-item"
      onMouseEnter={() => showTooltip(label)}
      onMouseLeave={hideTooltip}
    >
      <button
        className={`od-toolbar-button${isActive ? " active" : ""}`}
        type="button"
        aria-label={label}
        aria-pressed={isActive}
        onClick={onClick}
      >
        <Icon className="od-toolbar-icon" />
      </button>
      <AnimatePresence>
        {tooltip === label && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16 }}
            className="od-toolbar-tooltip"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type ToolbarProps = {
  activeTool: AnnotationTool;
  color: string;
  onToolChange: (tool: AnnotationTool) => void;
  onColorChange: (color: string) => void;
  onUndo: () => void;
  onClear: () => void;
};

export function Toolbar({
  activeTool,
  color,
  onToolChange,
  onColorChange,
  onUndo,
  onClear,
}: ToolbarProps) {
  const [tooltip, setTooltip] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 22, stiffness: 320 }}
      className="od-toolbar"
      role="toolbar"
      aria-label="圖片標註工具列"
    >
      {tools.map((tool) => (
        <ToolbarButton
          key={tool.value}
          label={tool.label}
          icon={tool.icon}
          isActive={activeTool === tool.value}
          onClick={() => onToolChange(tool.value)}
          tooltip={tooltip}
          showTooltip={setTooltip}
          hideTooltip={() => setTooltip(null)}
        />
      ))}

      <div className="od-toolbar-divider" />

      <div className="od-toolbar-color-group" aria-label="標註顏色">
        <Palette className="od-toolbar-icon" aria-hidden="true" />
        {swatches.map((swatch) => (
          <button
            key={swatch}
            className={`od-toolbar-swatch${color === swatch ? " active" : ""}`}
            type="button"
            aria-label={`使用顏色 ${swatch}`}
            onClick={() => onColorChange(swatch)}
            style={{ background: swatch }}
          />
        ))}
      </div>

      <div className="od-toolbar-divider" />

      <ToolbarButton
        label="復原"
        icon={RotateCcw}
        onClick={onUndo}
        tooltip={tooltip}
        showTooltip={setTooltip}
        hideTooltip={() => setTooltip(null)}
      />
      <ToolbarButton
        label="清除"
        icon={Trash2}
        onClick={onClear}
        tooltip={tooltip}
        showTooltip={setTooltip}
        hideTooltip={() => setTooltip(null)}
      />
    </motion.div>
  );
}
