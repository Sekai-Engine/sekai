<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { fileSystem } from '../services/FileSystem';

const route = useRoute();
const files = ref([]);
const selectedFile = ref(null);

const loadProjectFiles = async () => {
  const projectPath = route.query.path;
  if (!projectPath) {
    console.warn('No project path provided');
    return;
  }

  try {
    const entries = await fileSystem.readDir(projectPath);
    
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

  const fileName = prompt('请输入文件名称 (包含后缀):', 'new_file.txt');
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
    folder.children = entries.map(entry => ({
      name: entry.name,
      type: entry.isDirectory ? 'folder' : 'file',
      path: fileSystem.join(folder.path, entry.name),
      expanded: false,
      children: []
    })).sort((a, b) => {
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

const emit = defineEmits(['select-file']);

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
  <div class="file-manager-container">
    <div class="toolbar">
      <button class="toolbar-btn" title="新建文件夹" @click="createFolder">
        <span class="icon">📁+</span>
      </button>
      <button class="toolbar-btn" title="新建文件" @click="createFile">
        <span class="icon">📄+</span>
      </button>
      <button class="toolbar-btn" title="导入文件" @click="importFile">
        <span class="icon">📥</span>
      </button>
    </div>
    <div class="file-manager-body">
      <div class="file-tree">
        <div 
          v-for="file in files" 
          :key="file.name"
          class="file-item"
          @click="file.type === 'folder' ? toggleFolder(file) : selectFile(file)"
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
  </div>
</template>

<style scoped>
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