"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

const ActionBarSetContext = createContext<(node: ReactNode) => void>(() => {});
const ActionBarContentContext = createContext<ReactNode>(null);

export function ActionBarProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ReactNode>(null);

  return (
    <ActionBarSetContext.Provider value={setContent}>
      <ActionBarContentContext.Provider value={content}>
        {children}
      </ActionBarContentContext.Provider>
    </ActionBarSetContext.Provider>
  );
}

export function useActionBar() {
  return { setContent: useContext(ActionBarSetContext) };
}

export function ActionBar() {
  const content = useContext(ActionBarContentContext);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-10 border-t bg-background px-4 flex items-center justify-center gap-3 text-sm z-50">
      {content}
    </div>
  );
}
