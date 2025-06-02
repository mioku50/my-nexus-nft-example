export interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>
  on: (event: string, callback: (...args: any[]) => void) => void
  removeListener: (event: string, callback: (...args: any[]) => void) => void
}

// Augment the Window interface in the global scope
declare global {
  interface Window {
    ethereum?: any;  // Use optional any type to avoid conflicts
  }
}

export {}; 