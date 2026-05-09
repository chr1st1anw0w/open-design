import { useState, useEffect } from "react";
import { Hero } from "./components/hero/Hero";
import { CaseDetail } from "./components/gallery/CaseDetail";
import { SkillsPage } from "./components/skills/SkillsPage";
import { Workbench } from "./components/skills/Workbench";
import { C1PromptExpertPanel } from "./components/c1/C1PromptExpertPanel";
import { PromptStudio } from "./components/prompt-studio/PromptStudio";
import { UiUxPromptStudio } from "./components/prompt-studio/UiUxPromptStudio";
import { ThemeToggle } from "./components/shared/ThemeToggle";
import { useRoute } from "./lib/router";
import { cases } from "./lib/data";
import type { Route } from "./types";
// import './App.css'; // Removed missing file

function WorkbenchBreadcrumb({
  route,
  navigate,
}: {
  route: Route;
  navigate: (r: Route) => void;
}) {
  if (route.name !== "workbench") return null;

  const template = route.templateId ? cases.templates[route.templateId] : null;
  const categoryId = route.categoryId || template?.category;
  const category = categoryId ? cases.categories[categoryId] : null;

  return (
    <nav className="app-breadcrumb mono" aria-label="目前 Workbench 路徑">
      <span>/tools/gpt-image2#/workbench</span>
      {categoryId ? (
        <>
          <span>/</span>
          <button
            type="button"
            onClick={() => navigate({ name: "workbench", categoryId })}
            title="回到此分類的模板列表"
          >
            {category?.label || categoryId}
          </button>
        </>
      ) : null}
      {template ? (
        <>
          <span>/</span>
          <span>{template.label || template.name}</span>
        </>
      ) : null}
      <span>/</span>
    </nav>
  );
}

export function App() {
  const [route, navigate] = useRoute();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Restore saved theme; default to light
    const stored = localStorage.getItem("site-theme");
    const root = document.querySelector(".garden-gpt-image2");
    if (stored === "dark") {
      root?.classList.remove("theme-paper");
    } else {
      root?.classList.add("theme-paper");
    }
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) return <div className="loading-screen">...</div>;

  return (
    <div className="app-container">
      <ThemeToggle />
      {route.name === "home" ? (
        <Hero navigate={navigate} />
      ) : route.name === "case" ? (
        <CaseDetail id={route.id} navigate={navigate} />
      ) : route.name === "skills" ? (
        <SkillsPage navigate={navigate} />
      ) : route.name === "workbench" ? (
        <Workbench
          navigate={navigate}
          initialCategoryId={route.categoryId}
          initialTemplateId={route.templateId}
        />
      ) : route.name === "c1" ? (
        <C1PromptExpertPanel navigate={navigate} />
      ) : route.name === "promptStudio" ? (
        <PromptStudio />
      ) : route.name === "uiuxStudio" ? (
        <UiUxPromptStudio />
      ) : (
        <div className="error-page">
          <h2>找不到頁面</h2>
          <button onClick={() => navigate({ name: "home" })}>回到首頁</button>
        </div>
      )}

      {/* Footer / Info */}
      {route.name === "workbench" ? (
        <footer className="app-footer">
          <div className="footer-content">
            <WorkbenchBreadcrumb route={route} navigate={navigate} />
          </div>
        </footer>
      ) : null}
    </div>
  );
}
