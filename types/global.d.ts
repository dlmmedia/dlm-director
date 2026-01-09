// Global type declarations for DLM Director

interface AIStudioAPI {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    aistudio?: AIStudioAPI;
  }
}

export {};
