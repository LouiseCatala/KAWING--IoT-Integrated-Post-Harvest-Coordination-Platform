/// <reference types="vite/client" />

interface Window {
  puter?: {
    ai?: {
      chat: (...args: unknown[]) => Promise<unknown>;
    };
  };
}
