<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { fileSystem } from '../services/FileSystem';
import { listen } from '@tauri-apps/api/event';

const route = useRoute();
const files = ref([]);
const selectedFile = ref(null);
let unwatch = null;

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  file: null
});

const handleContextMenu = (e, file) => {
  e.preventDefault();
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    file: file
  };
  
  if (file) {
    // Select the file as well
    if (file.type === 'file') {
      selectedFile.value = file;
    } else {
      selectedFile.value = file; // Also select folder for context
    }
  } else {
    selectedFile.value = null;
  }
};

const closeContextMenu = () => {
  contextMenu.value.visible = false;
};

// Close context menu on click outside
onMounted(async () => {
  document.addEventListener('click', closeContextMenu);
  window.addEventListener('mousemove', updateMousePosition);
  
  try {
    unlistenFileDrop = await listen('tauri://drag-drop', (event) => {
      // Check if mouse is over file manager
      // Note: In async callback, ref value might be lost if component unmounted, but here it shouldn't be.
      // However, if we are in a sub-component or if the ref is not bound correctly?
      // Let's use document.elementFromPoint as a fallback or just check if paths exist.
      // Actually, if fileManagerRef is null, it means the DOM element is not bound or component is gone.
      // Let's check if we can get the element by ID or class if ref fails.
      
      const fileManagerEl = fileManagerRef.value || document.querySelector('.file-manager-container');
      
      if (fileManagerEl) {
        const rect = fileManagerEl.getBoundingClientRect();
        // Use event.payload.position if available (Tauri v2 drag-drop usually has it)
        // Or fallback to our tracked mouse position if needed, but event.payload.position is better
        let dropX = mouseX.value;
        let dropY = mouseY.value;
        
        if (event.payload.position) {
            // Note: payload position is usually physical screen coordinates or window coordinates?
            // Usually client coordinates relative to window content area.
            dropX = event.payload.position.x;
            dropY = event.payload.position.y;
        }

        const isOver = dropX >= rect.left && 
                       dropX <= rect.right && 
                       dropY >= rect.top && 
                       dropY <= rect.bottom;
        if (isOver) {
            const paths = event.payload.paths; // In v2 drag-drop, paths is inside payload object
            if (paths && paths.length > 0) {
              processDroppedPaths(paths);
            }
        }
      }
    });
  } catch (e) {
    console.warn('Failed to setup tauri file drop listener', e);
  }
});

onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu);
  window.removeEventListener('mousemove', updateMousePosition);
  if (unwatch) {
    unwatch();
    unwatch = null;
  }
  if (unlistenFileDrop) {
    unlistenFileDrop();
  }
});

const deleteFile = async () => {
  const file = contextMenu.value.file;
  if (!file) return;
  
  // Use Tauri native confirm dialog
  const confirmed = await fileSystem.confirm(`确定要删除 ${file.name} 吗?`, '删除确认');

  if (!confirmed) return;
  
  try {
    await fileSystem.remove(file.path);
    emit('file-deleted', file);
    
    // Refresh folder view if deleted file was in a folder
    // We can iterate files to find parent folder and reload its children
    const findParentFolder = (items) => {
      for (const item of items) {
        if (item.type === 'folder' && item.children) {
           const found = item.children.find(c => c.path === file.path);
           if (found) return item;
           const deepFound = findParentFolder(item.children);
           if (deepFound) return deepFound;
        }
      }
      return null;
    };
    
    const parentFolder = findParentFolder(files.value);
    if (parentFolder) {
      await loadFolderChildren(parentFolder);
    } else {
      // If it's a root file, the watcher should handle it, but we can force reload too if needed
      // But watcher might be slow or not triggered if we don't have watcher on root properly set up for deep?
      // Our watcher is only on root projectPath. 
      // If we deleted a file in subfolder, root watcher might not detect it if it's not recursive or if implementation details vary.
      // But typically we rely on watcher. However, for immediate feedback on subfolders (which are loaded manually on expand),
      // we need to reload the parent folder manually as we did above.
    }
  } catch (error) {
    console.error('Failed to delete file:', error);
    alert('删除失败: ' + error.message);
  }
};

const mergeFiles = (currentFiles, newEntries) => {
  // Helper to find file in array
  const findFile = (arr, name) => arr.find(f => f.name === name);

  // Map new entries to preserve state
  return newEntries.map(entry => {
    const existing = findFile(currentFiles, entry.name);
    
    // Create base object
    const newFile = {
      name: entry.name,
      type: entry.isDirectory ? 'folder' : 'file',
      path: route.query.path + (route.query.path.endsWith('/') || route.query.path.endsWith('\\') ? '' : '/') + entry.name,
      expanded: false,
      children: []
    };

    // Restore state if exists
    if (existing) {
      newFile.expanded = existing.expanded;
      if (existing.children && existing.children.length > 0) {
        // If we had children, we keep them. 
        // Ideally we should recursively merge/watch subfolders too, 
        // but for root watch, we might just keep existing loaded children 
        // or clear them if we want fresh state. 
        // For now, let's keep them to avoid collapse.
        newFile.children = existing.children;
      }
    }
    
    return newFile;
  }).sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'folder' ? -1 : 1;
  });
};

const loadProjectFiles = async () => {
  const projectPath = route.query.path;
  if (!projectPath) {
    console.warn('No project path provided');
    return;
  }

  // Start watching if not already
  if (!unwatch) {
    unwatch = fileSystem.watch(projectPath, (entries) => {
      // Update files preserving state
      files.value = mergeFiles(files.value, entries);
    });
  }

  try {
    const entries = await fileSystem.readDir(projectPath);
    
    // Initial load - also use merge to be consistent or just map
    // Transform entries to our file structure
    files.value = entries.map(entry => ({
      name: entry.name,
      type: entry.isDirectory ? 'folder' : 'file',
      path: projectPath + (projectPath.endsWith('/') || projectPath.endsWith('\\') ? '' : '/') + entry.name, // Construct full path
      expanded: false,
      children: [] // Children will be loaded on expand
    })).sort((a, b) => {
      // Sort folders first
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    });
  } catch (error) {
    console.error('Failed to load project files:', error);
  }
};

onUnmounted(() => {
  if (unwatch) {
    unwatch();
    unwatch = null;
  }
});

const createFolder = async () => {
  const parentPath = selectedFile.value?.type === 'folder' 
    ? selectedFile.value.path 
    : (selectedFile.value && selectedFile.value.path ? selectedFile.value.path.split('/').slice(0, -1).join('/') : route.query.path);
    
  if (!parentPath) return;

  const folderName = prompt('请输入文件夹名称:', 'New Folder');
  if (!folderName) return;

  try {
    await fileSystem.createDirectory(await fileSystem.join(parentPath, folderName));
    // Refresh parent folder or root
    if (selectedFile.value?.type === 'folder') {
      await loadFolderChildren(selectedFile.value);
      selectedFile.value.expanded = true;
    } else {
      await loadProjectFiles();
    }
  } catch (error) {
    console.error('Failed to create folder:', error);
    alert('创建文件夹失败: ' + error.message);
  }
};

const createFile = async () => {
  const parentPath = selectedFile.value?.type === 'folder' 
    ? selectedFile.value.path 
    : (selectedFile.value && selectedFile.value.path ? selectedFile.value.path.split('/').slice(0, -1).join('/') : route.query.path);
    
  if (!parentPath) return;

  const fileName = prompt('请输入文件名称 (包含后缀):', 'untitled.txt');
  if (!fileName) return;

  try {
    await fileSystem.writeFile(await fileSystem.join(parentPath, fileName), '');
    // Refresh parent folder or root
    if (selectedFile.value?.type === 'folder') {
      await loadFolderChildren(selectedFile.value);
      selectedFile.value.expanded = true;
    } else {
      await loadProjectFiles();
    }
  } catch (error) {
    console.error('Failed to create file:', error);
    alert('创建文件失败: ' + error.message);
  }
};

const importFile = () => {
  alert('导入功能暂未实现');
};

const loadFolderChildren = async (folder) => {
  if (!folder.path) return;
  
  try {
    const entries = await fileSystem.readDir(folder.path);
    
    const childrenWithPaths = await Promise.all(entries.map(async entry => ({
      name: entry.name,
      type: entry.isDirectory ? 'folder' : 'file',
      path: await fileSystem.join(folder.path, entry.name),
      expanded: false,
      children: []
    })));

    folder.children = childrenWithPaths.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    });
  } catch (error) {
    console.error(`Failed to load children for ${folder.name}:`, error);
  }
};

const toggleFolder = async (folder) => {
  if (!folder.expanded && (!folder.children || folder.children.length === 0)) {
    // Load children on first expand
    await loadFolderChildren(folder);
  }
  folder.expanded = !folder.expanded;
};

const fileManagerRef = ref(null);
const mouseX = ref(0);
const mouseY = ref(0);
let unlistenFileDrop = null;

const updateMousePosition = (e) => {
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;
};

const handleDragEnter = (e) => {
  e.preventDefault();
};

const handleDragLeave = (e) => {
  e.preventDefault();
};

const handleDragOver = (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
};

const processDroppedPaths = async (paths) => {
  let targetDir = route.query.path;
  
  if (selectedFile.value) {
      if (selectedFile.value.type === 'folder') {
          targetDir = selectedFile.value.path;
      } else {
           const parts = selectedFile.value.path.split(/[/\\]/);
           parts.pop();
           targetDir = parts.join('/');
      }
  }
  
  if (!targetDir) targetDir = route.query.path;

  for (const sourcePath of paths) {
    try {
        // Extract filename from path
        const fileName = sourcePath.split(/[/\\]/).pop();
        const destPath = await fileSystem.join(targetDir, fileName);
        
        await fileSystem.copyFile(sourcePath, destPath);
    } catch (err) {
        console.error('Copy failed', err);
        alert(`导入失败 ${sourcePath}: ${err.message}`);
    }
  }
  
  if (selectedFile.value?.type === 'folder' && selectedFile.value.path === targetDir) {
      await loadFolderChildren(selectedFile.value);
  } else {
      await loadProjectFiles();
  }
};

const handleDrop = async (e) => {
  e.preventDefault();
  
  // Delay reset to allow tauri://file-drop to see the active state
  // Tauri event typically fires after the native drop event
  setTimeout(() => {
    dragCounter = 0;
    isDragOver.value = false;
  }, 100);
};

const emit = defineEmits(['select-file', 'file-deleted']);

const selectFile = (file) => {
  if (file.type === 'file') {
    selectedFile.value = file;
    emit('select-file', file);
  } else {
    // Also update selectedFile for folder creation context
    selectedFile.value = file;
  }
};

onMounted(() => {
  loadProjectFiles();
});

const getFileIcon = (file) => {
  if (file.type === 'folder') {
    return file.expanded ? '📂' : '📁';
  }
  
  const ext = file.name.split('.').pop().toLowerCase();
  const iconMap = {
    'mp3': '🎵',
    'wav': '🎵',
    'jpg': '🖼️',
    'png': '🖼️',
    'gif': '🎬',
    'mp4': '🎬',
    'txt': '📄',
    'zip': '📦',
    'pdf': '📋'
  };
  
  return iconMap[ext] || '📄';
};

const getFileColor = (file) => {
  if (file.type === 'folder') {
    return '#f39c12';
  }
  
  const ext = file.name.split('.').pop().toLowerCase();
  const colorMap = {
    'mp3': '#3498db',
    'wav': '#3498db',
    'jpg': '#e74c3c',
    'png': '#e74c3c',
    'gif': '#9b59b6',
    'mp4': '#9b59b6',
    'txt': '#2ecc71',
    'zip': '#f39c12',
    'pdf': '#e67e22'
  };
  
  return colorMap[ext] || '#95a5a6';
};
</script>

<template>
  <div 
    class="file-manager-container"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @dragover="handleDragOver" 
    @drop="handleDrop"
  >
    <div class="file-manager-body" @contextmenu.prevent="handleContextMenu($event, null)">
      <div class="file-tree">
        <div 
          v-for="file in files" 
          :key="file.name"
          class="file-item"
          @click="file.type === 'folder' ? toggleFolder(file) : selectFile(file)"
          @contextmenu.stop="handleContextMenu($event, file)"
        >
          <div 
            class="file-content"
            :class="{ selected: selectedFile === file, 'is-folder': file.type === 'folder' }"
            :style="{ paddingLeft: (file.level || 0) * 16 + 8 + 'px' }"
          >
            <span class="file-icon" :style="{ color: getFileColor(file) }">
              {{ getFileIcon(file) }}
            </span>
            <span class="file-name">{{ file.name }}</span>
            <span v-if="file.type === 'file'" class="file-size">2.1 MB</span>
          </div>
          
          <!-- Render children recursively -->
          <template v-if="file.type === 'folder' && file.expanded && file.children">
            <div 
              v-for="child in file.children" 
              :key="child.name"
              class="file-item"
              @click.stop="child.type === 'folder' ? toggleFolder(child) : selectFile(child)"
              @contextmenu.stop="handleContextMenu($event, child)"
              :style="{ marginLeft: '20px' }"
            >
              <div 
                class="file-content"
                :class="{ selected: selectedFile === child, 'is-folder': child.type === 'folder' }"
                :style="{ paddingLeft: 8 + 'px' }"
              >
                <span class="file-icon" :style="{ color: getFileColor(child) }">
                  {{ getFileIcon(child) }}
                </span>
                <span class="file-name">{{ child.name }}</span>
                <span v-if="child.type === 'file'" class="file-size">1.8 MB</span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
    
    <!-- Context Menu -->
    <div 
      v-if="contextMenu.visible" 
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
    >
      <div class="menu-item" @click="createFolder">
        <span class="menu-icon">📁</span>
        新建文件夹
      </div>
      <div class="menu-item" @click="createFile">
        <span class="menu-icon">📄</span>
        新建文件
      </div>
      <div class="menu-separator" v-if="contextMenu.file"></div>
      <div class="menu-item delete" @click="deleteFile" v-if="contextMenu.file">
        <span class="menu-icon">🗑️</span>
        删除
      </div>
    </div>
  </div>
</template>

<style scoped>
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  z-index: 1000;
  min-width: 140px;
}

.menu-separator {
  height: 1px;
  background-color: #e9ecef;
  margin: 4px 0;
}

.menu-item {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #495057;
  font-family: 'Georgia', serif;
}

.menu-item:hover {
  background-color: #f8f9fa;
}

.menu-item.delete {
  color: #e03131;
}

.menu-item.delete:hover {
  background-color: #fff5f5;
}

.menu-icon {
  font-size: 14px;
}

.file-manager-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}

.toolbar {
  display: flex;
  gap: 4px;
  padding: 8px 16px;
  border-bottom: 1px solid #f1f3f5;
  background-color: #f8f9fa;
}

.toolbar-btn {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #495057;
  font-size: 12px;
}

.toolbar-btn:hover {
  background-color: #e9ecef;
  border-color: #dee2e6;
}

.icon {
  font-size: 14px;
}

.file-manager-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  min-height: 0; /* 允许flex收缩 */
}

.file-tree {
  font-family: 'Georgia', serif;
  font-size: 14px;
}

.file-item {
  cursor: pointer;
}

.file-content {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.2s ease;
  margin: 0 8px;
}

.file-content:hover {
  background-color: rgba(67, 97, 238, 0.05);
}

.file-content.selected {
  background-color: rgba(67, 97, 238, 0.1);
  border-left: 3px solid #4361ee;
}

.file-content.is-folder {
  font-weight: 500;
}

.file-icon {
  margin-right: 12px;
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.file-name {
  flex: 1;
  color: #2d3436;
}

.file-size {
  font-size: 12px;
  color: #6c757d;
  margin-left: 8px;
}

/* Scrollbar */
.file-manager-body::-webkit-scrollbar {
  width: 8px;
}

.file-manager-body::-webkit-scrollbar-track {
  background: #f8f9fa;
}

.file-manager-body::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 4px;
}

.file-manager-body::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}
</style>