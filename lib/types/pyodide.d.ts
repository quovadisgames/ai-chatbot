interface PyodideInterface {
  loadPackagesFromImports(code: string, options?: { messageCallback?: (message: string) => void }): Promise<void>;
  runPythonAsync(code: string): Promise<any>;
  setStdout(options: { batched: (output: string) => void }): void;
}

declare global {
  interface Window {
    loadPyodide: (options?: { indexURL?: string }) => Promise<PyodideInterface>;
  }
  
  var loadPyodide: (options?: { indexURL?: string }) => Promise<PyodideInterface>;
}

export {}; 