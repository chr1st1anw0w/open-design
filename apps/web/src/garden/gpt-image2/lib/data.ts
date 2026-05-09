export interface Template {
  key: string;
  label: string;
  category: string;
  content: string;
  name?: string;
  description?: string;
}

export const cases = {
  templates: {} as Record<string, Template>
};
