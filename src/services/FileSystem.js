// File System Abstraction Interface

export class IFileSystem {
  async selectDirectory() { throw new Error('Not implemented'); }
  async getDocumentDir() { throw new Error('Not implemented'); }
  async getAppInstallDir() { throw new Error('Not implemented'); }
  async createDirectory(path) { throw new Error('Not implemented'); }
  async writeFile(path, content) { throw new Error('Not implemented'); }
  async readFile(path) { throw new Error('Not implemented'); }
  async join(...paths) { throw new Error('Not implemented'); }
}

// Tauri Implementation
class TauriFileSystem extends IFileSystem {
  constructor() {
    super();
    this.dialog = null;
    this.fs = null;
    this.path = null;
  }

  async init() {
    if (!this.dialog) {
      this.dialog = await import('@tauri-apps/plugin-dialog');
      this.fs = await import('@tauri-apps/plugin-fs');
      this.path = await import('@tauri-apps/api/path');
    }
  }

  async selectDirectory() {
    await this.init();
    return await this.dialog.open({
      directory: true,
      multiple: false,
      title: '选择新项目的创建位置',
    });
  }

  async getDocumentDir() {
    await this.init();
    return await this.path.documentDir();
  }

  async getAppInstallDir() {
    await this.init();
    return await this.path.resourceDir();
  }

  async createDirectory(path) {
    await this.init();
    return await this.fs.mkdir(path);
  }

  async writeFile(path, content) {
    await this.init();
    return await this.fs.writeTextFile(path, content);
  }

  async join(...paths) {
    await this.init();
    return await this.path.join(...paths);
  }
}

// Web Implementation (using File System Access API)
class WebFileSystem extends IFileSystem {
  constructor() {
    super();
    // Cache directory handles: { 'root/folder/subfolder': handle }
    this.handles = new Map();
    this.rootHandle = null;
    this.rootName = '';
  }

  async selectDirectory() {
    try {
      // 1. Show picker to user
      this.rootHandle = await window.showDirectoryPicker();
      this.rootName = this.rootHandle.name;
      
      // 2. Cache the root handle
      // We use a virtual path prefix to identify this mount point
      const virtualPath = `/${this.rootName}`;
      this.handles.set(virtualPath, this.rootHandle);
      
      return virtualPath;
    } catch (err) {
      if (err.name === 'AbortError') {
        return null; // User cancelled
      }
      throw err;
    }
  }

  async getDocumentDir() {
    // In Web, we cannot automatically access system Document folder.
    // We have to ask user to pick a folder, so we reuse selectDirectory logic.
    // Or we can default to OPFS if persistent storage is preferred without prompt,
    // but user asked for "System Document" which implies external file system.
    // Since we can't access it directly, we fallback to prompting the user.
    return await this.selectDirectory();
  }

  async getAppInstallDir() {
    // For Web, "Installation Path" is the internal OPFS storage.
    // We return a special prefix to indicate OPFS operations.
    return "opfs:/";
  }

  // Helper to resolve handle from path
  async _getHandle(path, create = false) {
    // Handle OPFS paths
    if (path.startsWith('opfs:/')) {
      let currentHandle = await navigator.storage.getDirectory();
      // Remove prefix and split
      const relativePath = path.replace('opfs:/', '');
      if (!relativePath) return currentHandle; // Root
      
      const parts = relativePath.split('/').filter(p => p);
      
      for (let i = 0; i < parts.length; i++) {
        const name = parts[i];
        // If it's the last part and we are just resolving (not creating file yet), 
        // we assume it's a directory unless context implies otherwise.
        // But here we are just traversing directories.
        currentHandle = await currentHandle.getDirectoryHandle(name, { create });
      }
      return currentHandle;
    }

    // Normalize path
    const parts = path.split('/').filter(p => p);
    
    // Check if path starts with our root name
    if (parts[0] !== this.rootName) {
      throw new Error(`Path must start with selected root: ${this.rootName}`);
    }

    let currentHandle = this.rootHandle;
    let currentPath = `/${this.rootName}`;

    // Traverse parts (skipping root)
    for (let i = 1; i < parts.length; i++) {
      const name = parts[i];
      currentPath += `/${name}`;

      // Check cache first
      if (this.handles.has(currentPath)) {
        currentHandle = this.handles.get(currentPath);
      } else {
        // Get or create directory
        // Note: For writeFile, the last part might be a file, so we stop before it
        // But this helper is mainly for getting directory handles
        currentHandle = await currentHandle.getDirectoryHandle(name, { create });
        this.handles.set(currentPath, currentHandle);
      }
    }

    return currentHandle;
  }

  async createDirectory(path) {
    // If it's an OPFS path, use _getHandle to create it (which handles OPFS logic)
    if (path.startsWith('opfs:/')) {
      await this._getHandle(path, true);
      return path;
    }

    if (!this.rootHandle) throw new Error('No directory selected');
    
    // _getHandle traverses and creates directories if create=true
    await this._getHandle(path, true);
    return path;
  }

  async writeFile(path, content) {
    // If it's an OPFS path
    if (path.startsWith('opfs:/')) {
      // Split path to separate filename
      const relativePath = path.replace('opfs:/', '');
      const parts = relativePath.split('/').filter(p => p);
      const fileName = parts.pop();
      const dirPath = 'opfs:/' + parts.join('/');

      // Get parent directory handle (OPFS)
      const dirHandle = await this._getHandle(dirPath, true);
      
      // Create/Get file
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      
      // Write content
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      return;
    }

    if (!this.rootHandle) throw new Error('No directory selected');

    // Split path to separate filename
    const parts = path.split('/').filter(p => p);
    const fileName = parts.pop();
    const dirPath = '/' + parts.join('/');

    // Get parent directory handle
    const dirHandle = await this._getHandle(dirPath, true);
    
    // Create/Get file
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    
    // Write content
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async join(...paths) {
    // Simple path join for web
    // Ensure we don't duplicate slashes and handle root correctly
    const joined = paths.join('/').replace(/\/+/g, '/');
    
    // Preserve opfs:/ prefix if present
    if (paths[0].startsWith('opfs:/')) {
        return joined.replace('opfs://', 'opfs:/');
    }

    return joined.startsWith('/') ? joined : '/' + joined;
  }
}

// Factory
export const fileSystem = window.__TAURI_INTERNALS__ ? new TauriFileSystem() : new WebFileSystem();
