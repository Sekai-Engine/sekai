<script setup>
import { ref, onMounted } from 'vue';

const files = ref([
  {
    name: '场景设置',
    type: 'folder',
    expanded: true,
    children: [
      {
        name: '背景音乐',
        type: 'folder',
        expanded: false,
        children: [
          { name: '开场音乐.mp3', type: 'file' },
          { name: '高潮音乐.mp3', type: 'file' },
          { name: '结局音乐.mp3', type: 'file' }
        ]
      },
      {
        name: '背景图片',
        type: 'folder',
        expanded: false,
        children: [
          { name: '城堡背景.jpg', type: 'file' },
          { name: '森林场景.png', type: 'file' },
          { name: '城市夜景.jpg', type: 'file' }
        ]
      },
      {
        name: '角色立绘',
        type: 'folder',
        expanded: false,
        children: [
          { name: '主角形象.png', type: 'file' },
          { name: '反派形象.png', type: 'file' },
          { name: '配角立绘.jpg', type: 'file' }
        ]
      }
    ]
  },
  {
    name: '剧本文件',
    type: 'folder',
    expanded: true,
    children: [
      { name: '第一章.txt', type: 'file' },
      { name: '第二章.txt', type: 'file' },
      { name: '对话记录.txt', type: 'file' }
    ]
  },
  {
    name: '特效素材',
    type: 'folder',
    expanded: false,
    children: [
      { name: '魔法效果.gif', type: 'file' },
      { name: '转场动画.mp4', type: 'file' },
      { name: '音效合集.zip', type: 'file' }
    ]
  }
]);

const selectedFile = ref(null);

const toggleFolder = (folder) => {
  folder.expanded = !folder.expanded;
};

const selectFile = (file) => {
  if (file.type === 'file') {
    selectedFile.value = file;
  }
};

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