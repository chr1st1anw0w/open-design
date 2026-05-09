import React from "react";
import { navigate } from "../router";
import WebDesignApp from "../garden/web-design/App";
import { App as GptImage2App } from "../garden/gpt-image2/App";
import { C1PromptExpertPanel } from "../garden/gpt-image2/components/c1/C1PromptExpertPanel";
import { PromptStudio } from "../garden/gpt-image2/components/prompt-studio/PromptStudio";
import { Workbench } from "../garden/gpt-image2/components/skills/Workbench";
import { ThemeToggle } from "../garden/gpt-image2/components/shared/ThemeToggle";
import type { Route as GptImage2Route } from "../garden/gpt-image2/types";
import "../garden/web-design/design/tokens.css";
import "../garden/gpt-image2/styles/tokens.css";
import "./GardenToolPage.css";

interface Props {
  toolId: "web-design" | "gpt-image2";
  page?: "prompt-studio" | "workbench" | "c1" | null;
}

interface DesignSystemColor {
  name: string;
  value: string;
}

export function GardenToolPage({ toolId, page = null }: Props) {
  const [operationDesignSystemId, setOperationDesignSystemId] = React.useState<
    string | null
  >(null);

  function navigateGptImage2(route: GptImage2Route) {
    if (route.name === "promptStudio") {
      navigate({ kind: "tool", toolId: "gpt-image2", page: "prompt-studio" });
    } else if (route.name === "workbench") {
      navigate({ kind: "tool", toolId: "gpt-image2", page: "workbench" });
    } else if (route.name === "c1") {
      navigate({ kind: "tool", toolId: "gpt-image2", page: "c1" });
    } else {
      navigate({ kind: "tool", toolId: "gpt-image2", page: null });
    }
  }

  // Apply design system colors to CSS variables if a design system is selected
  React.useEffect(() => {
    if (operationDesignSystemId) {
      // Map design system swatches to operation page CSS variables
      // This is a placeholder for the actual mapping logic
      const root = document.documentElement;
      root.style.setProperty("--od-operation-bg", "var(--color-bg)");
      root.style.setProperty("--od-operation-text", "var(--color-text)");
    }
  }, [operationDesignSystemId]);

  React.useEffect(() => {
    if (toolId !== "gpt-image2") return;
    const root = document.querySelector(".garden-gpt-image2");
    const stored = localStorage.getItem("site-theme");
    if (stored === "dark") {
      root?.classList.remove("theme-paper");
      return;
    }
    // Default to light for all GPT-Image2 routes/pages.
    root?.classList.add("theme-paper");
    if (!stored) {
      localStorage.setItem("site-theme", "light");
    }
  }, [toolId, page]);

  return (
    <div
      className={`garden-tool-shell ${
        toolId === "web-design" ? "garden-web-design" : "garden-gpt-image2"
      }`}
    >
      <button
        type="button"
        className="garden-tool-back"
        onClick={() => navigate({ kind: "home" })}
      >
        Back to Open Design
      </button>
      {toolId === "gpt-image2" ? (
        <>
          <ThemeToggle />
          <nav className="garden-tool-tabs" aria-label="GPT-Image 2 tools">
            <button
              type="button"
              className={!page ? "active" : ""}
              onClick={() =>
                navigate({ kind: "tool", toolId: "gpt-image2", page: null })
              }
            >
              Gallery
            </button>
            <button
              type="button"
              className={page === "prompt-studio" ? "active" : ""}
              onClick={() =>
                navigate({
                  kind: "tool",
                  toolId: "gpt-image2",
                  page: "prompt-studio",
                })
              }
            >
              Prompt Studio
            </button>
            <button
              type="button"
              className={page === "workbench" ? "active" : ""}
              onClick={() =>
                navigate({
                  kind: "tool",
                  toolId: "gpt-image2",
                  page: "workbench",
                })
              }
            >
              Workbench
            </button>
            <button
              type="button"
              className={page === "c1" ? "active" : ""}
              onClick={() =>
                navigate({
                  kind: "tool",
                  toolId: "gpt-image2",
                  page: "c1",
                })
              }
            >
              C1 Prompt Expert
            </button>
          </nav>
        </>
      ) : null}
      {toolId === "web-design" ? (
        <WebDesignApp />
      ) : page === "prompt-studio" ? (
        <PromptStudio />
      ) : page === "workbench" ? (
        <Workbench navigate={navigateGptImage2} />
      ) : page === "c1" ? (
        <C1PromptExpertPanel navigate={navigateGptImage2} />
      ) : (
        <GptImage2App />
      )}
    </div>
  );
}
