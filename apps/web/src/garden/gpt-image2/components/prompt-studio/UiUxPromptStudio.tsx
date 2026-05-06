import React, { useState } from 'react';
import { TemplatePicker } from './TemplatePicker';
import { ArgumentForm } from './ArgumentForm';
import { PromptPreview } from './PromptPreview';
import { ArchiveBrowser } from './ArchiveBrowser';
import type { PromptTemplate, ArgumentValue, TemplateMeta } from '../../types';
import { renderPrompt } from '../../lib/prompt-engine';
import { loadTemplateMarkdown, savePrompt } from '../../lib/archive-client';

import './prompt-studio.css'; // Reuse main studio styles

type StudioStage = 'template-select' | 'argument-form' | 'preview';

export const UiUxPromptStudio: React.FC = () => {
  const [stage, setStage] = useState<StudioStage>('template-select');
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [templateMarkdown, setTemplateMarkdown] = useState<string>('');
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [args, setArgs] = useState<Record<string, ArgumentValue>>({});
  const [renderedPrompt, setRenderedPrompt] = useState<string>('');
  const [isArchiveOpen, setIsArchiveOpen] = useState<boolean>(false);

  // Pre-set UX specific arguments
  const initialUxArgs: Record<string, ArgumentValue> = {
    component_type: 'button',
    design_system: 'shadcn',
    breakpoint: 'responsive',
    theme: 'light',
    a11y_level: 'AA',
  };

  const handleTemplateSelect = async (templateMeta: TemplateMeta) => {
    // Map TemplateMeta to PromptTemplate structure
    const template: PromptTemplate = {
      id: templateMeta.key,
      name: templateMeta.label || templateMeta.name,
      description: templateMeta.description || '',
      category: templateMeta.category,
      ready: true,
      image: '',
      placeholders: [], // Will be filled by loadTemplateMarkdown
    };
    setSelectedTemplate(template);
    if (template.category && template.id) {
      try {
        const { md, placeholders: extractedPlaceholders } = await loadTemplateMarkdown(template.category, template.id);
        setTemplateMarkdown(md);
        setPlaceholders(extractedPlaceholders);
        const mergedArgs = { ...initialUxArgs, ...template.defaultArgs };
        setArgs(mergedArgs);
        setRenderedPrompt(renderPrompt(md, mergedArgs));
        setStage('argument-form');
      } catch (error) {
        console.error('Failed to load template markdown:', error);
        alert('Failed to load template. Please try again.');
        setSelectedTemplate(null);
        setStage('template-select');
      }
    }
  };

  const handleArgsChange = (newArgs: Record<string, ArgumentValue>) => {
    setArgs(newArgs);
    setRenderedPrompt(renderPrompt(templateMarkdown, newArgs));
  };

  const handleSavePrompt = async (format: 'structured' | 'json-flat', tags?: string[]) => {
    if (selectedTemplate && renderedPrompt) {
      const response = await savePrompt({
        category: 'ui-mockups', // Hardcode category for UI/UX Studio
        template: selectedTemplate.id,
        args,
        prompt: renderedPrompt,
        format,
        tags: tags || [],
      });
      if (response.ok) {
        alert('UI/UX Prompt saved successfully!');
      } else {
        alert(`Failed to save UI/UX prompt: ${response.error}`);
      }
    }
  };

  return (
    <div className="prompt-studio-container">
      <header className="studio-header">
        <div className="eyebrow">UX Engineering Lab</div>
        <h1>
          UI/UX Prompt Studio
          <span className="badge">PROMPT ONLY · 不會自動執行</span>
        </h1>
        <button className="archive-toggle-button" onClick={() => setIsArchiveOpen(!isArchiveOpen)}>
          {isArchiveOpen ? 'HIDE ARCHIVE' : 'OPEN ARCHIVE'}
        </button>
      </header>

      <main className="studio-grid">
        {stage === 'template-select' && (
          <div className="selection-view">
            <h2 className="template-list-title serif">Select Layout Pattern</h2>
            <TemplatePicker
              onSelectCategory={() => {}} // Category is fixed for UI/UX
              onSelectTemplate={handleTemplateSelect}
              filterCategory="ui-mockups"
            />
          </div>
        )}

        {stage === 'argument-form' && selectedTemplate && (
          <div className="configuration-view">
            <ArgumentForm
              template={selectedTemplate}
              placeholders={placeholders}
              args={args}
              onArgsChange={handleArgsChange}
              onNext={() => setStage('preview')}
            />
          </div>
        )}

        {stage === 'preview' && selectedTemplate && (
          <PromptPreview
            template={selectedTemplate}
            renderedPrompt={renderedPrompt}
            sourceTemplate={templateMarkdown}
            onBack={() => setStage('argument-form')}
            onSave={handleSavePrompt}
          />
        )}
      </main>

      <ArchiveBrowser isOpen={isArchiveOpen} onClose={() => setIsArchiveOpen(false)} />
    </div>
  );
};
