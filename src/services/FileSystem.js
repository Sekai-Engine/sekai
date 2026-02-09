// File System Service (Tauri only)
import { open } from '@tauri-apps/plugin-dialog';
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

  async getDocumentDir() {
    return await path.documentDir();
  }

  async getAppInstallDir() {
    return await path.resourceDir();
  }

  async createDirectory(dirPath) {
    return await fs.mkdir(dirPath);
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
}

export const fileSystem = new TauriFileSystem();