"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {content && (
          <motion.div
            key="toolbar"
            layout
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="bg-foreground text-background border border-background/30 shadow-md px-3 py-1.5 flex items-center justify-center gap-3 text-sm pointer-events-auto"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
