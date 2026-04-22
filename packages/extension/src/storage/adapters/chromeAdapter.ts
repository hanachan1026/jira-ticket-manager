import type { StorageAdapter } from "./types";

interface WxtStorageItem<T> {
  getValue: () => Promise<T>;
  setValue: (v: T) => Promise<void>;
  watch: (cb: (v: T | undefined) => void) => () => void;
}

/**
 * WXT の storage.defineItem を StorageAdapter でラップ
 */
export function createChromeAdapter<T>(wxtStorageItem: WxtStorageItem<T>): StorageAdapter<T> {
  return {
    getValue: () => wxtStorageItem.getValue(),
    setValue: (v) => wxtStorageItem.setValue(v),
    watch: (cb) => wxtStorageItem.watch(cb),
  };
}
