import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { templatesStorage } from "../storage";
import type { CopyTemplate } from "../types";

export function useTemplates() {
  const [templates, setTemplates] = useState<CopyTemplate[]>([]);

  useEffect(() => {
    templatesStorage.getValue().then(setTemplates);
    const unwatch = templatesStorage.watch((v) => setTemplates(v ?? []));
    return unwatch;
  }, []);

  const addTemplate = useCallback(
    async (data: Omit<CopyTemplate, "id">) => {
      const t: CopyTemplate = { ...data, id: uuidv4() };
      await templatesStorage.setValue([...templates, t]);
    },
    [templates]
  );

  const updateTemplate = useCallback(
    async (id: string, data: Partial<Omit<CopyTemplate, "id">>) => {
      await templatesStorage.setValue(
        templates.map((t) => (t.id === id ? { ...t, ...data } : t))
      );
    },
    [templates]
  );

  const removeTemplate = useCallback(
    async (id: string) => {
      await templatesStorage.setValue(templates.filter((t) => t.id !== id));
    },
    [templates]
  );

  return { templates, addTemplate, updateTemplate, removeTemplate };
}
