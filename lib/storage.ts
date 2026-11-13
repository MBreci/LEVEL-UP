export interface LSStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

declare global {
  interface Window {
    LS: LSStore;
  }
}

const ssrNoop: LSStore = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/**
 * `window.LS` viene de public/storage-shim.js (cargado como script
 * beforeInteractive en el layout raíz) — es el mismo wrapper resiliente de
 * localStorage con fallback a window.name que ya corría en producción, sin
 * reescribirlo, para no arriesgar el fix de Safari/WebViews que resuelve.
 */
export function getLS(): LSStore {
  if (typeof window === "undefined") return ssrNoop;
  return window.LS;
}
