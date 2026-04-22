/**
 * ストレージアダプターの共通インターフェース
 * chrome.storage と File System Access API の両方を統一的に扱う
 */
export interface StorageAdapter<T> {
  getValue(): Promise<T>;
  setValue(value: T): Promise<void>;
  watch(callback: (newValue: T | undefined) => void): () => void;
}
