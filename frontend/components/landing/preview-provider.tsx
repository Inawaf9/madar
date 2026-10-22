"use client";

import { createContext, useContext, useState } from "react";
import { Toaster, toast } from "sonner";
import { useTheme } from "next-themes";
import { useMadarCopy } from "./use-madar-copy";
import { ComparisonBar } from "./comparison-bar";
import { PreviewPanel, type PreviewPanelValue } from "./preview-panel";
import type { PreviewProperty } from "./preview-data";

type PreviewState = {
  saved: PreviewProperty[];
  compared: PreviewProperty[];
  toggleSaved: (property: PreviewProperty) => void;
  toggleCompared: (property: PreviewProperty) => void;
  openPanel: (panel: PreviewPanelValue) => void;
};

const PreviewContext = createContext<PreviewState | null>(null);

export function usePreview() {
  const context = useContext(PreviewContext);
  if (!context) throw new Error("Preview interactions require PreviewProvider");
  return context;
}

// Ephemeral landing-only state. No user ID, storage, inventory, or API writes.
export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const { text, ar } = useMadarCopy();
  const { resolvedTheme } = useTheme();
  const [saved, setSaved] = useState<PreviewProperty[]>([]);
  const [compared, setCompared] = useState<PreviewProperty[]>([]);
  const [panel, openPanel] = useState<PreviewPanelValue>(null);

  const toggleSaved = (property: PreviewProperty) => {
    const exists = saved.some((item) => item.id === property.id);
    setSaved((current) => exists ? current.filter((item) => item.id !== property.id) : [...current, property]);
    toast(text(exists ? "أُزيل من محفوظات المعاينة" : "أُضيف إلى محفوظات المعاينة لهذه الجلسة", exists ? "Removed from preview favorites" : "Saved in this preview session"));
  };

  const toggleCompared = (property: PreviewProperty) => {
    if (compared.some((item) => item.id === property.id)) {
      setCompared((current) => current.filter((item) => item.id !== property.id));
    } else if (compared.length >= 3) {
      toast(text("يمكن مقارنة ثلاثة نماذج في المعاينة", "Compare up to three preview homes"));
    } else {
      setCompared((current) => [...current, property]);
    }
  };

  return (
    <PreviewContext.Provider value={{ saved, compared, toggleSaved, toggleCompared, openPanel }}>
      {children}
      <ComparisonBar count={compared.length} onOpen={() => openPanel("compare")} onClear={() => setCompared([])} />
      <PreviewPanel panel={panel} saved={saved} compared={compared} onClose={() => openPanel(null)} onToggleSaved={toggleSaved} />
      <Toaster
        dir={ar ? "rtl" : "ltr"}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        position={ar ? "bottom-left" : "bottom-right"}
        toastOptions={{ style: {
          fontFamily: "var(--font-thmanyah-sans)",
          background: "var(--popover)",
          color: "var(--popover-foreground)",
          borderColor: "var(--border)",
        } }}
      />
    </PreviewContext.Provider>
  );
}
