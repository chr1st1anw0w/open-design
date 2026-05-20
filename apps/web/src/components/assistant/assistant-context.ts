import { createContext, useContext } from 'react';

export type AssistantState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

export const AssistantContext = createContext<AssistantState | null>(null);

export function useAssistant(): AssistantState {
  const ctx = useContext(AssistantContext);
  if (!ctx) {
    throw new Error('useAssistant must be used inside <AssistantProvider>');
  }
  return ctx;
}

export const ASSISTANT_OPEN_STORAGE_KEY = 'od.assistant.open' as const;
