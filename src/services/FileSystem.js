// File System Service (Tauri only)
import { open, confirm } from '@tauri-apps/plugin-dialog';
import * as fs from '@tauri-apps/plugin-fs';
import * as path from '@tauri-apps/api/path';

class TauriFileSystem {
  async selectDirectory() {
    return await open({
      directory: true,
      multiple: false,
      title: '选择新项目的创建位置',
    });
  }

  async confirm(message, title = 'Confirm') {
    return await confirm(message, { title, kind: 'warning' });
  }

  async getDocumentDir() {
    return await path.documentDir();
  }

  async getAppInstallDir() {
    return await path.resourceDir();
  }

  async createDirectory(dirPath) {
    return await fs.mkdir(dirPath);
  }

  async remove(path) {
    // Determine if it's a file or directory first to use correct removal method?
    // fs.remove removes file, fs.removeDir removes directory.
    // Or we can try remove and see.
    // Tauri v2 fs plugin has separate functions usually?
    // Let's check docs or try. 
    // fs.remove is for files. fs.removeDir is for directories.
    
    // Check if it is directory
    const isDir = await this.exists(path) && (await fs.stat(path)).isDirectory;
    
    if (isDir) {
        return await fs.remove(path, { recursive: true }); // v2 fs.remove handles both if recursive? 
        // Actually in v2 plugin-fs:
        // remove(path: string, options?: RemoveOptions): Promise<void>
        // options: { recursive?: boolean }
        // So fs.remove with recursive true should handle both.
    } else {
        return await fs.remove(path);
    }
  }

  async copyFile(source, destination) {
    return await fs.copyFile(source, destination);
  }

  async writeFile(filePath, content) {
    return await fs.writeTextFile(filePath, content);
  }

  async readFile(filePath) {
    return await fs.readTextFile(filePath);
  }

  async readDir(dirPath) {
    return await fs.readDir(dirPath);
  }

  async join(...paths) {
    return await path.join(...paths);
  }

  async exists(filePath) {
    return await fs.exists(filePath);
  }

  // Simple polling watcher
  watch(dirPath, callback, interval = 1000) { // Reduced interval for faster feedback
    let previousSnapshot = '';
    
    const check = async () => {
      try {
        const entries = await this.readDir(dirPath);
        // Create a simple snapshot signature based on names and types
        // Also include length to catch additions/deletions quickly
        const snapshot = JSON.stringify(
          entries.map(e => ({ n: e.name, d: e.isDirectory })).sort((a, b) => a.n.localeCompare(b.n))
        );
        
        // Always trigger callback on first check if we want immediate population?
        // But usually the consumer calls readDir once themselves.
        
        if (snapshot !== previousSnapshot) {
          // If previousSnapshot is empty, it means this is the first check.
          // Depending on logic, we might want to fire it to ensure sync, 
          // or skip if the consumer already did an initial load.
          // Let's fire it if it's different, but maybe we can make the check more robust.
          
          callback(entries);
          previousSnapshot = snapshot;
        }
      } catch (error) {
        // console.error('Watch error:', error);
      }
    };

    // Initial check
    check();

    const timerId = setInterval(check, interval);
    
    return () => clearInterval(timerId); // Unsubscribe function
  }
}

export const fileSystem = new TauriFileSystem();