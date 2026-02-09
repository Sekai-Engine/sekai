<script setup>
import { ref, computed, nextTick, watch } from 'vue';

const props = defineProps({
  initialContent: {
    type: String,
    default: ''
  },
  currentFile: {
    type: Object,
    default: null
  },
  openedFiles: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:content', 'create-file', 'switch-file', 'close-file']);

const content = ref(props.initialContent);
const textareaRef = ref(null);

watch(() => props.initialContent, (newValue) => {
  content.value = newValue;
});

const handleAddTab = () => {
  emit('create-file');
};

const lineCount = computed(() => {
  if (!content.value) return 1;
  return content.value.split('\n').length;
});

const updateContent = () => {
  emit('update:content', content.value);
};

const syncScroll = (event) => {
  const lineNumbers = event.target.previousElementSibling;
  if (lineNumbers) {
    lineNumbers.scrollTop = event.target.scrollTop;
  }
};

const handleTab = (event) => {
  if (event.key === 'Tab') {
    event.preventDefault();
    const start = event.target.selectionStart;
    const end = event.target.selectionEnd;
    
    const newContent = content.value.substring(0, start) + '    ' + content.value.substring(end);
    content.value = newContent;
    
    nextTick(() => {
      event.target.selectionStart = event.target.selectionEnd = start + 4;
    });
  }
};
</script>

<template>
  <div class="editor-container">
    <div class="editor-header">
      <div class="file-tabs">
        <div 
          v-for="file in openedFiles" 
          :key="file.path" 
          class="tab" 
          :class="{ active: currentFile && currentFile.path === file.path }"
          @click="$emit('switch-file', file)"
        >
          <span class="tab-name">{{ file.name }}</span>
          <span class="tab-close" @click.stop="$emit('close-file', file)">×</span>
        </div>
        <div v-if="openedFiles.length === 0" class="tab active">
          <span class="tab-name">Untitled</span>
        </div>
        <div class="add-tab" @click="handleAddTab" title="New File">+</div>
      </div>
      <div class="editor-actions">
        <button class="action-button">📋</button>
      </div>
    </div>
    
    <div class="editor-body">
      <div class="line-numbers">
        <div
          v-for="lineNumber in lineCount"
          :key="lineNumber"
          class="line-number"
        >
          {{ lineNumber }}
        </div>
      </div>
      <textarea
        ref="textareaRef"
        v-model="content"
        class="text-input"
        @input="updateContent"
        @scroll="syncScroll"
        @keydown="handleTab"
        placeholder="在这里开始写你的故事..."
        spellcheck="false"
      ></textarea>
    </div>
  </div>
</template>

<style scoped>
.editor-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}

.editor-container:not(:last-child) {
  border-right: 1px solid #dee2e6;
}

.editor-header {
  height: 40px;
  background: linear-gradient(90deg, #f8f9fa 0%, #ffffff 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}

.file-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-bottom: none;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  transition: all 0.2s ease;
}

.tab.active {
  background: #ffffff;
  border-color: #dee2e6;
  color: #2d3436;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.tab:hover:not(.active) {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.tab-name {
  font-size: 13px;
  font-weight: 400;
  font-family: 'Georgia', serif;
  color: #495057;
}

.tab.active .tab-name {
  color: #2d3436;
  font-weight: 500;
}

.tab-close {
  font-size: 14px;
  opacity: 0.6;
  color: #6c757d;
  cursor: pointer;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.tab-close:hover {
  opacity: 1;
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.add-tab {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  color: #6c757d;
  cursor: pointer;
  font-size: 14px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.add-tab:hover {
  background: #e9ecef;
  border-color: #adb5bd;
  color: #495057;
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid #dee2e6;
  color: #6c757d;
  cursor: pointer;
  font-size: 14px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.action-button:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
  color: #495057;
}

.editor-body {
  flex: 1;
  display: flex;
  height: 100%;
  overflow: hidden;
}

.line-numbers {
  width: 60px;
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
  border-right: 1px solid #e9ecef;
  padding: 20px 12px;
  overflow: hidden;
  user-select: none;
  flex-shrink: 0;
}

.line-number {
  height: 27px; /* Matches line-height 1.7 * 16px font-size ≈ 27.2px */
  display: flex;
  align-items: center;
  justify-content: flex-end;
  color: #adb5bd;
  font-family: 'Georgia', serif;
  font-size: 14px; /* Line numbers usually smaller */
  padding-right: 12px;
  transition: color 0.2s ease;
}

.text-input {
  flex: 1;
  background: #ffffff;
  border: none;
  outline: none;
  padding: 20px 24px;
  resize: none;
  font-family: 'Georgia', serif;
  font-size: 16px;
  line-height: 27px; /* Explicit line-height in px to match line numbers */
  color: #2d3436;
  overflow-y: auto;
  caret-color: #4361ee;
  tab-size: 4;
}

.text-input::selection {
  background: rgba(67, 97, 238, 0.2);
}

.text-input:focus {
  box-shadow: inset 0 0 0 2px rgba(67, 97, 238, 0.1);
}

.text-input::placeholder {
  color: #adb5bd;
  font-style: italic;
  font-family: 'Georgia', serif;
}

/* Custom scrollbar */
.text-input::-webkit-scrollbar {
  width: 12px;
}

.text-input::-webkit-scrollbar-track {
  background: #f8f9fa;
}

.text-input::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 6px;
  border: 1px solid #ffffff;
}

.text-input::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}

.line-numbers::-webkit-scrollbar {
  width: 0;
}
</style>