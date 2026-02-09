<script setup>
import { ref, onMounted, nextTick, computed } from "vue";
import { useRouter } from 'vue-router';
import Editor from "../components/Editor.vue";
import PreviewPanel from "../components/PreviewPanel.vue";
import FileManager from "../components/FileManager.vue";
import Settings from "../components/Settings.vue";
import { fileSystem } from '../services/FileSystem';

const normalizePath = (path) => {
  return path ? path.replace(/\\/g, '/') : '';
};

const router = useRouter();
const message = ref("Sekai");
const isFileManagerVisible = ref(true);
const isMobile = ref(false);
const editorHeight = ref(window.innerHeight * 0.6);
const editorTopHeight = ref(window.innerHeight * 0.6);
const errorBarHeight = ref(30); // Changed to ref to be reactive
const isErrorPanelExpanded = ref(false); // New state for error panel
const isResizingVertical = ref(false);
const editorWidth = ref(isMobile.value ? 100 : 50);

const currentFile = ref(null);
const fileContent = ref('');
const openedFiles = ref([]); // Manage list of opened files

const handleFileSelect = async (file) => {
  // Check if file is already opened
  const existingFile = openedFiles.value.find(f => normalizePath(f.path) === normalizePath(file.path));
  if (!existingFile) {
    openedFiles.value.push(file);
  } else {
    // If switching to an existing dirty file, use its in-memory content
    if (existingFile.isDirty && existingFile.content !== undefined) {
      currentFile.value = existingFile;
      fileContent.value = existingFile.content;
      return;
    }
    // Update reference to the existing file object in openedFiles to ensure state consistency
    file = existingFile;
  }
  
  currentFile.value = file;

  // If it's a new unsaved file, content is already in memory
  if (file.isUnsaved) {
    fileContent.value = file.content || '';
    return;
  }

  try {
    // Basic binary check by extension
    const binaryExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'webp', 'mp3', 'wav', 'ogg', 'mp4', 'webm', 'exe', 'dll', 'so', 'dylib', 'bin', 'obj', 'fbx', 'gltf', 'glb', 'pdf', 'zip', 'tar', 'gz', '7z', 'rar'];
    const ext = file.name.split('.').pop().toLowerCase();
    
    if (binaryExtensions.includes(ext)) {
      fileContent.value = `[Binary file: ${file.name}]\n(Preview not supported)`;
      return;
    }

    // Check file size (optional, requires fs.stat which we don't have exposed yet in simple wrapper)
    // For now we just read. If it fails or is huge, we catch error.
    
    const content = await fileSystem.readFile(file.path);
    
    // Simple heuristic check for binary content if extension check passed
    // (e.g. looking for null bytes in first few chars)
    if (content.includes('\0')) {
       fileContent.value = `[Binary file detected]\n(Content contains null bytes)`;
       return;
    }

    fileContent.value = content;
    file.originalContent = content; // Store original content for dirty check
    file.isDirty = false;
  } catch (error) {
    console.error('Failed to read file:', error);
    fileContent.value = `Error reading file: ${error.message}`;
  }
};

const handleSwitchFile = async (file) => {
  // Save current file content to memory before switching
  if (currentFile.value) {
     currentFile.value.content = fileContent.value;
  }
  
  if (currentFile.value && normalizePath(currentFile.value.path) === normalizePath(file.path)) return;
  await handleFileSelect(file);
};

const handleCloseFile = (file) => {
  const index = openedFiles.value.findIndex(f => f.path === file.path);
  if (index !== -1) {
    openedFiles.value.splice(index, 1);
    
    // If closed file was active, switch to another one
    if (currentFile.value && currentFile.value.path === file.path) {
      if (openedFiles.value.length > 0) {
        // Switch to the previous one or the first one
        const newFile = openedFiles.value[Math.max(0, index - 1)];
        handleSwitchFile(newFile);
      } else {
        currentFile.value = null;
        fileContent.value = '';
      }
    }
  }
};

const handleFileDeleted = (deletedFile) => {
  const file = openedFiles.value.find(f => normalizePath(f.path) === normalizePath(deletedFile.path));
  if (file) {
    file.isDirty = true;
  }
};

const handleContentUpdate = async (newContent) => {
  if (currentFile.value) {
    if (currentFile.value.isUnsaved) {
       fileContent.value = newContent;
       currentFile.value.content = newContent;
    } else {
      // Mark as dirty instead of auto-saving immediately
      if (newContent !== currentFile.value.originalContent) {
        currentFile.value.isDirty = true;
      } else {
        currentFile.value.isDirty = false;
      }
      
      // Update in openedFiles list to reflect dirty state
      const index = openedFiles.value.findIndex(f => f.path === currentFile.value.path);
      if (index !== -1) {
         openedFiles.value[index].isDirty = currentFile.value.isDirty;
      }
      
      fileContent.value = newContent;
    }
  }
};

const handleCreateFile = async () => {
  // Create a new in-memory file
  const newFile = {
    name: 'untitled',
    path: null, // No path yet
    type: 'file',
    isUnsaved: true,
    content: '',
    isDirty: true // New unsaved files are dirty by default
  };
  
  await handleFileSelect(newFile);
};

const saveCurrentFile = async () => {
  if (!currentFile.value) return;

  if (currentFile.value.isUnsaved) {
    // ... existing save logic for new file
    const fileName = prompt('请输入保存的文件名 (包含后缀):', 'untitle');
    if (!fileName) return;

    let parentPath = null;
    const route = router.currentRoute.value;
    parentPath = route.query.path;
    
    if (!parentPath) {
       alert("无法确定保存位置");
       return;
    }

    try {
      const newFilePath = await fileSystem.join(parentPath, fileName);
      await fileSystem.writeFile(newFilePath, currentFile.value.content || '');
      
      currentFile.value.name = fileName;
      currentFile.value.path = newFilePath;
      currentFile.value.isUnsaved = false;
      currentFile.value.isDirty = false; // Clear dirty flag
      currentFile.value.originalContent = currentFile.value.content; // Update original content baseline
      delete currentFile.value.content;
      
      const index = openedFiles.value.indexOf(currentFile.value);
      if (index !== -1) {
         openedFiles.value[index] = { ...currentFile.value };
      }
      
      // alert('保存成功'); // Removed alert
    } catch (error) {
      console.error('Failed to save file:', error);
      alert('保存失败: ' + error.message);
    }
  } else {
    try {
      await fileSystem.writeFile(currentFile.value.path, fileContent.value);
      currentFile.value.isDirty = false;
      currentFile.value.originalContent = fileContent.value;
      
      const index = openedFiles.value.findIndex(f => f.path === currentFile.value.path);
      if (index !== -1) {
         openedFiles.value[index].isDirty = false;
      }
      
      // alert('保存成功'); // Removed alert
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  }
};

// Add keyboard listener for Ctrl+S
onMounted(() => {
  // ... existing onMounted code
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveCurrentFile();
    }
  });
});


const errors = ref([
  // Mock data for testing
  { type: 'error', message: 'Syntax error in script.json at line 15', time: '10:23:45' },
  { type: 'warning', message: 'Unused variable "player_name"', time: '10:24:12' },
  { type: 'info', message: 'Project saved successfully', time: '10:25:00' }
]);

const toggleErrorPanel = () => {
  isErrorPanelExpanded.value = !isErrorPanelExpanded.value;
  errorBarHeight.value = isErrorPanelExpanded.value ? 150 : 30;
};

const handleRun = () => {
  console.log("Running code...");
};

const handleDebug = () => {
  console.log("Debugging code...");
};

const toggleFileManager = () => {
  isFileManagerVisible.value = !isFileManagerVisible.value;
  nextTick(() => {
    adjustPanelSizes();
  });
};

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
  if (isMobile.value) {
    editorWidth.value = 100;
  } else {
    editorWidth.value = 50;
  }
};

const adjustPanelSizes = () => {
  const availableHeight = window.innerHeight - 64 - errorBarHeight.value - 30 - 6; // 6 magic number
  editorTopHeight.value = isFileManagerVisible.value ? availableHeight * 0.7 : availableHeight;

  if (isFileManagerVisible.value && !isMobile.value) {
    editorHeight.value = editorTopHeight.value;
  }
};

const startVerticalResize = (event) => {
  if (isMobile.value) return;
  isResizingVertical.value = true;
  event.preventDefault();
  
  const startY = event.clientY;
  const startEditorTopHeight = editorTopHeight.value;

  const doResize = (e) => {
    if (!isResizingVertical.value) return;
    
    const deltaY = e.clientY - startY;
    const newEditorTopHeight = startEditorTopHeight + deltaY;
    const availableHeight = window.innerHeight - 64 - errorBarHeight.value - 30 + 24; // 24 magic number

    if (newEditorTopHeight >= 200 && newEditorTopHeight <= availableHeight - 30) {
      editorTopHeight.value = newEditorTopHeight;
      if (isFileManagerVisible.value) {
        editorHeight.value = newEditorTopHeight;
        if (Math.floor(editorHeight.value) === 826) {
          isFileManagerVisible.value = false;
        }
      }
    }
  };

  const stopResize = () => {
    isResizingVertical.value = false;
    document.removeEventListener('mousemove', doResize);
    document.removeEventListener('mouseup', stopResize);
  };

  document.addEventListener('mousemove', doResize);
  document.addEventListener('mouseup', stopResize);
};

onMounted(() => {
  checkMobile();
  adjustPanelSizes();
  
  window.addEventListener('resize', () => {
    checkMobile();
    adjustPanelSizes();
  });
});
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="header-left">
        <div class="logo">
          <img src="../assets/icon.png" alt="Sekai" class="logo-icon" />
          <h1>{{ message }}</h1>
        </div>
      </div>
      <div class="header-controls">
        <button @click="handleRun" class="action-button primary">
          开始
        </button>
        <button @click="handleDebug" class="action-button secondary">
          构建
        </button>
        <Settings />
      </div>
    </header>
    
    <main class="app-main">
      <!-- 编辑器区域 -->
      <div class="editor-section" :style="{ height: editorTopHeight + 'px' }">
        <div class="editor-with-preview" :class="{ mobile: isMobile }">
          <Editor 
            v-if="!isMobile" 
            :style="{ width: editorWidth + '%' }" 
            :initial-content="fileContent"
            :current-file="currentFile"
            :opened-files="openedFiles"
            @update:content="handleContentUpdate"
            @create-file="handleCreateFile"
            @switch-file="handleSwitchFile"
            @close-file="handleCloseFile"
          />
          <Editor v-else />
          
          <!-- 水平拖动手柄 (仅桌面) -->
          <div 
            v-if="!isMobile"
            class="horizontal-resize-handle" 
            :class="{ active: isResizingHorizontal }"
          >
            <div class="horizontal-resize-line"></div>
          </div>
          
          <PreviewPanel v-if="!isMobile" :style="{ width: (100 - editorWidth) + '%' }" />
        </div>
      </div>
      
      <!-- 垂直拖动手柄 (仅桌面) -->
      <div 
        v-if="!isMobile"
        class="vertical-resize-handle" 
        @mousedown="startVerticalResize"
        :class="{ active: isResizingVertical }"
      >
        <div class="vertical-resize-line"></div>
      </div>
      
      <!-- 底部区域 -->
      <div class="bottom-section" :class="{ mobile: isMobile }">
        <!-- 桌面模式的文件管理器内容 -->
        <div v-if="!isMobile" class="file-manager-content">
          <!-- 状态栏 / 错误面板 -->
          <div 
            class="status-bar" 
            :class="{ expanded: isErrorPanelExpanded }"
            :style="{ height: errorBarHeight + 'px' }"
            @click="toggleErrorPanel"
          >
            <div class="status-header">
              <div class="status-title">
                <span class="status-icon">⚠️</span>
                <span class="status-text">
                  {{ errors.length }} 个问题
                </span>
              </div>
              <span class="toggle-icon">{{ isErrorPanelExpanded ? '▲' : '▼' }}</span>
            </div>
            
            <!-- 错误列表内容 -->
            <div v-if="isErrorPanelExpanded" class="error-list" @click.stop>
              <div v-for="(error, index) in errors" :key="index" class="error-item" :class="error.type">
                <span class="error-icon">
                  {{ error.type === 'error' ? '❌' : error.type === 'warning' ? '⚠️' : 'ℹ️' }}
                </span>
                <span class="error-time">[{{ error.time }}]</span>
                <span class="error-message">{{ error.message }}</span>
              </div>
            </div>
          </div>
          <FileManager @select-file="handleFileSelect" @file-deleted="handleFileDeleted" />
          
          <!-- 文件管理器头部 (移到底部) -->
          <div class="file-manager-header" @click="toggleFileManager">
            <div class="file-manager-title">素材库</div>
            <div class="file-manager-controls">
              <button class="toggle-button">
                <span class="toggle-icon">▼</span>
              </button>
            </div>
          </div>
        </div>
        
        <!-- 文件管理器头部 (当文件管理器隐藏时单独显示) -->
        <div v-else-if="!isMobile" class="file-manager-header" @click="toggleFileManager">
          <div class="file-manager-title">素材库</div>
          <div class="file-manager-controls">
            <button class="toggle-button">
              <span class="toggle-icon">▲</span>
            </button>
          </div>
        </div>
        
        <!-- 手机模式的额外内容 -->
        <template v-if="isMobile">
          <PreviewPanel class="mobile-preview" />
          <FileManager class="mobile-file-manager" @file-deleted="handleFileDeleted" />
        </template>
      </div>
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  overflow: hidden;
}
</style>

<style scoped>
.app {
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  font-family: 'Georgia', 'Times New Roman', serif;
  display: flex;
  flex-direction: column;
  color: #2d3436;
  overflow: hidden;
}

.app-header {
  height: 64px;
  background: linear-gradient(90deg, #ffffff 0%, #f8f9fa 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid #dee2e6;
  flex-shrink: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.app-header h1 {
  color: #2d3436;
  margin: 0;
  font-size: 24px;
  font-weight: 300;
  letter-spacing: 1px;
  font-family: 'Georgia', serif;
}

.header-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.action-button {
  background: #ffffff;
  color: #495057;
  border: 1px solid #dee2e6;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-family: 'Georgia', serif;
}

.action-button:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-button.primary {
  background: #4361ee;
  color: white;
  border-color: #4361ee;
}

.action-button.primary:hover {
  background: #3f37c9;
  border-color: #3f37c9;
}

.action-button.secondary {
  background: #7209b7;
  color: white;
  border-color: #7209b7;
}

.action-button.secondary:hover {
  background: #560bad;
  border-color: #560bad;
}

.button-icon {
  font-size: 14px;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-section {
  flex: none;
  background: #ffffff;
  border-bottom: 1px solid #dee2e6;
  overflow: hidden;
}

.editor-with-preview {
  display: flex;
  height: 100%;
}

.editor-with-preview.mobile {
  flex-direction: column;
}

/* 水平拖动手柄 (桌面) */
.horizontal-resize-handle {
  width: 4px;
  background: #f8f9fa;
  cursor: ew-resize;
  position: relative;
  flex: none;
}

.horizontal-resize-handle:hover, .horizontal-resize-handle.active {
  background: #4361ee;
}

.horizontal-resize-line {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 1px;
  height: 40px;
  background: #dee2e6;
}

.horizontal-resize-handle:hover .horizontal-resize-line,
.horizontal-resize-handle.active .horizontal-resize-line {
  background: #4361ee;
  height: 60px;
}

/* 垂直拖动手柄 (桌面) */
.vertical-resize-handle {
  height: 4px;
  background: #f8f9fa;
  cursor: ns-resize;
  position: relative;
  flex: none;
}

.vertical-resize-handle:hover, .vertical-resize-handle.active {
  background: #4361ee;
}

.vertical-resize-line {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 1px;
  background: #dee2e6;
}

.vertical-resize-handle:hover .vertical-resize-line,
.vertical-resize-handle.active .vertical-resize-line {
  background: #4361ee;
  width: 60px;
}

/* 底部区域 */
.bottom-section {
  display: flex;
  flex-direction: column;
  flex: 1;
  border-top: 1px solid #dee2e6;
  min-height: 0;
}

.bottom-section.mobile {
  flex: 1;
}

/* 文件管理器内容 (桌面) */
.file-manager-content {
  background: #ffffff;
  border-bottom: 1px solid #dee2e6;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* 状态栏 / 错误面板 */
.status-bar {
  background: linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%);
  border-top: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
  padding: 0 16px;
  flex-shrink: 0;
  transition: height 0.3s ease;
  overflow: hidden;
  cursor: pointer;
}

.status-header {
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.status-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-icon {
  font-size: 14px;
}

.status-text {
  font-size: 13px;
  color: #6c757d;
  font-family: 'Georgia', serif;
}

.toggle-icon {
  font-size: 10px;
  color: #6c757d;
}

.error-list {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 8px;
  border-top: 1px solid #dee2e6;
}

.error-item {
  padding: 4px 0;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px dashed #eee;
  font-family: 'Consolas', monospace;
}

.error-item:last-child {
  border-bottom: none;
}

.error-time {
  color: #adb5bd;
}

.error-message {
  color: #495057;
}

.error-item.error .error-message { color: #e03131; }
.error-item.warning .error-message { color: #f08c00; }
.error-item.info .error-message { color: #1c7ed6; }

/* 文件管理器头部 */
.file-manager-header {
  height: 30px;
  background: linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  cursor: pointer;
  flex-shrink: 0;
  border-top: 1px solid #dee2e6;
  order: 2; /* 确保头部在底部 */
}

.file-manager-title {
  color: #495057;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Georgia', serif;
}

.file-manager-controls {
  display: flex;
  gap: 8px;
}

.toggle-button {
  background: transparent;
  border: 1px solid #dee2e6;
  color: #6c757d;
  padding: 2px 6px;
  cursor: pointer;
  font-size: 10px;
  border-radius: 4px;
}

.toggle-button:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
  color: #495057;
}

/* 手机模式样式 */
.mobile-preview {
  height: 200px;
  border-bottom: 1px solid #dee2e6;
}

.mobile-file-manager {
  flex: 1;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .app-header {
    padding: 0 12px;
  }
  
  .logo-icon {
    width: 24px;
    height: 24px;
  }
  
  .app-header h1 {
    font-size: 18px;
  }
  
  .action-button {
    padding: 6px 10px;
    font-size: 12px;
  }
}
</style>