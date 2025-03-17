declare global {
  interface Window {
    loadPyodide: (options?: { indexURL?: string }) => Promise<any>;
  }
  
  var loadPyodide: (options?: { indexURL?: string }) => Promise<any>;
}

export {}; 