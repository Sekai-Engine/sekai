<script setup>
import { ref, onMounted, nextTick, computed } from "vue";
import Editor from "./components/Editor.vue";
import PreviewPanel from "./components/PreviewPanel.vue";
import FileManager from "./components/FileManager.vue";
import Settings from "./components/Settings.vue";

const message = ref("Sekai");
const isFileManagerVisible = ref(true);
const isMobile = ref(false);
const editorHeight = ref(window.innerHeight * 0.6);
const editorTopHeight = ref(window.innerHeight * 0.6);
const errorBarHeight = 30;
const isResizingVertical = ref(false);
const editorWidth = ref(isMobile.value ? 100 : 50);

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
  const availableHeight = window.innerHeight - 64 - errorBarHeight - 30;
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
    const availableHeight = window.innerHeight - 64 - errorBarHeight - 30;

    // VSCode-like auto-hide: 当拖拽到接近底部时自动隐藏文件管理器
    const threshold = 150; // 距离底部150px时触发自动隐藏
    if (isFileManagerVisible.value && newEditorTopHeight >= availableHeight - threshold) {
      isFileManagerVisible.value = false;
      editorTopHeight.value = availableHeight;
      return;
    }

    if (newEditorTopHeight >= 200 && newEditorTopHeight <= availableHeight - 100) {
      editorTopHeight.value = newEditorTopHeight;
      if (isFileManagerVisible.value) {
        editorHeight.value = newEditorTopHeight;
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
          <img src="./assets/icon.png" alt="Sekai" class="logo-icon" />
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
          <Editor v-if="!isMobile" :style="{ width: editorWidth + '%' }" />
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
        <div v-if="!isMobile && isFileManagerVisible" class="file-manager-content">
          <!-- 状态栏 -->
          <div class="status-bar" :style="{ height: errorBarHeight + 'px' }">
            <div class="status-content">
              <span class="status-icon">📝</span>
              <span class="status-text"></span>
            </div>
          </div>
          <FileManager />
          
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
          <FileManager class="mobile-file-manager" />
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

#app {
  height: 100vh;
  width: 100vw;
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
  flex: none;
  border-top: 1px solid #dee2e6;
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

/* 状态栏 */
.status-bar {
  background: linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%);
  border-top: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  padding: 0 16px;
  flex-shrink: 0;
}

.status-content {
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
