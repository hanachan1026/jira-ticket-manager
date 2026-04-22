import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useStorage } from "../storage/StorageContext";
import type { CopyTemplate } from "../types";

export function useTemplates() {
  const { templates: templatesAdapter } = useStorage();
  const [templates, setTemplates] = useState<CopyTemplate[]>([]);

  useEffect(() => {
    templatesAdapter.getValue().then(setTemplates);
    const unwatch = templatesAdapter.watch((v) => setTemplates(v ?? []));
    return unwatch;
  }, [templatesAdapter]);

  const addTemplate = useCallback(
    async (data: Omit<CopyTemplate, "id">) => {
      const t: CopyTemplate = { ...data, id: uuidv4() };
      const current = await templatesAdapter.getValue();
      await templatesAdapter.setValue([...current, t]);
    },
    [templatesAdapter]
  );

  const updateTemplate = useCallback(
    async (id: string, data: Partial<Omit<CopyTemplate, "id">>) => {
      const current = await templatesAdapter.getValue();
      await templatesAdapter.setValue(
        current.map((t) => (t.id === id ? { ...t, ...data } : t))
      );
    },
    [templatesAdapter]
  );

  const removeTemplate = useCallback(
    async (id: string) => {
      const current = await templatesAdapter.getValue();
      await templatesAdapter.setValue(current.filter((t) => t.id !== id));
    },
    [templatesAdapter]
  );

  return { templates, addTemplate, updateTemplate, removeTemplate };
}
