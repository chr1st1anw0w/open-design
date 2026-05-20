import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AssistantContext, ASSISTANT_OPEN_STORAGE_KEY } from './assistant-context';

type Props = {
  children: ReactNode;
};

function readInitialOpen(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(ASSISTANT_OPEN_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function AssistantProvider({ children }: Props) {
  const [open, setOpenState] = useState<boolean>(false);

  // Hydrate from localStorage on mount to avoid SSR mismatch.
  useEffect(() => {
    setOpenState(readInitialOpen());
  }, []);

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    try {
      window.localStorage.setItem(ASSISTANT_OPEN_STORAGE_KEY, next ? '1' : '0');
    } catch {
      // localStorage unavailable — keep in-memory state only.
    }
  }, []);

  const toggle = useCallback(() => {
    setOpenState((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(ASSISTANT_OPEN_STORAGE_KEY, next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ open, setOpen, toggle }), [open, setOpen, toggle]);

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}
