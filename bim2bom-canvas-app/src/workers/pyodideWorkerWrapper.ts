/**
 * TypeScript wrapper for Pyodide Worker
 * Provides type-safe interface to the worker
 */

export interface WorkerMessage {
  type: string;
  id: string;
  data?: any;
  error?: string;
  percent?: number;
  message?: string;
}

export interface UploadFileData {
  fileData: Uint8Array;
  filename: string;
}

export interface ValidationData {
  ifcPath: string;
  csvPath: string;
}

export interface ConversionData {
  ifcPath: string;
  mmiThreshold?: number;
}

export class PyodideWorker {
  private worker: Worker;
  private messageId = 0;
  private pendingMessages = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>();

  constructor() {
    // Use a relative path that works in both dev and build
    this.worker = new Worker(new URL('./pyodideWorker.js', import.meta.url), { 
      type: 'module',
      name: 'pyodide-worker'
    });
    this.worker.addEventListener('message', this.handleMessage.bind(this));
  }

  private handleMessage(event: MessageEvent<WorkerMessage>) {
    const { type, id, data, error, percent, message } = event.data;

    if (type === 'PROGRESS') {
      // Handle progress updates - progress messages don't need response handling
      return;
    }

    const pending = this.pendingMessages.get(id);
    if (!pending) {
      console.warn(`No pending message found for id: ${id}`);
      return;
    }

    this.pendingMessages.delete(id);

    if (error) {
      pending.reject(new Error(error));
    } else {
      pending.resolve(data);
    }
  }

  private sendMessage(type: string, data?: any): Promise<any> {
    const id = `msg_${this.messageId++}`;
    
    return new Promise((resolve, reject) => {
      this.pendingMessages.set(id, { resolve, reject });
      this.worker.postMessage({ type, id, data });
    });
  }

  async init(): Promise<void> {
    await this.sendMessage('INIT');
  }

  async uploadFile(fileData: Uint8Array, filename: string): Promise<{ path: string; filename: string }> {
    return this.sendMessage('UPLOAD_FILE', { fileData, filename });
  }

  async runValidation(ifcPath: string, csvPath: string, csvContent?: string): Promise<any> {
    return this.sendMessage('RUN_VALIDATION', { ifcPath, csvPath, csvContent });
  }

  async convertToXML(ifcPath: string, mmiThreshold = 375.0): Promise<{ xml: string; stats: any }> {
    return this.sendMessage('CONVERT_TO_XML', { ifcPath, mmiThreshold });
  }

  terminate() {
    this.worker.terminate();
    this.pendingMessages.clear();
  }
}

