<script setup>
import { ref } from 'vue';

const isSettingsOpen = ref(false);
const theme = ref('light');
const autoSave = ref(true);
const fontSize = ref(14);

const openSettings = () => {
  isSettingsOpen.value = true;
};

const closeSettings = () => {
  isSettingsOpen.value = false;
};

const saveSettings = () => {
  // Save settings logic here
  console.log('Settings saved:', {
    theme: theme.value,
    autoSave: autoSave.value,
    fontSize: fontSize.value
  });
  closeSettings();
};
</script>

<template>
  <div class="settings-container">
    <button @click="openSettings" class="settings-button" title="设置">
      ⚙️
    </button>
    
    <!-- Settings Modal -->
    <div v-if="isSettingsOpen" class="settings-modal" @click.self="closeSettings">
      <div class="settings-content">
        <div class="settings-header">
          <h2>设置</h2>
          <button @click="closeSettings" class="close-button">×</button>
        </div>
        
        <div class="settings-body">
          <div class="setting-group">
            <label class="setting-label">主题</label>
            <select v-model="theme" class="setting-select">
              <option value="light">浅色</option>
              <option value="dark">深色</option>
              <option value="auto">自动</option>
            </select>
          </div>
          
          <div class="setting-group">
            <label class="setting-label">自动保存</label>
            <label class="switch">
              <input type="checkbox" v-model="autoSave">
              <span class="slider"></span>
            </label>
          </div>
          
          <div class="setting-group">
            <label class="setting-label">字体大小</label>
            <input 
              type="range" 
              v-model="fontSize" 
              min="10" 
              max="20" 
              class="setting-range"
            />
            <span class="range-value">{{ fontSize }}px</span>
          </div>
        </div>
        
        <div class="settings-footer">
          <button @click="closeSettings" class="cancel-button">取消</button>
          <button @click="saveSettings" class="save-button">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  position: relative;
}

.settings-button {
  background: transparent;
  border: 1px solid #dee2e6;
  color: #495057;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
}

.settings-button:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.settings-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.settings-content {
  background: #ffffff;
  border-radius: 12px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.settings-header {
  background: linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20px;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-header h2 {
  margin: 0;
  color: #2d3436;
  font-size: 20px;
  font-weight: 400;
  font-family: 'Georgia', serif;
}

.close-button {
  background: transparent;
  border: none;
  color: #6c757d;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #f8f9fa;
  color: #495057;
}

.settings-body {
  padding: 20px;
}

.setting-group {
  margin-bottom: 20px;
}

.setting-group:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: block;
  margin-bottom: 8px;
  color: #495057;
  font-size: 14px;
  font-weight: 500;
  font-family: 'Georgia', serif;
}

.setting-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: #ffffff;
  color: #495057;
  font-size: 14px;
  font-family: 'Georgia', serif;
}

.setting-select:focus {
  outline: none;
  border-color: #4361ee;
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #dee2e6;
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #4361ee;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.setting-range {
  width: calc(100% - 50px);
  margin-right: 10px;
}

.range-value {
  color: #6c757d;
  font-size: 14px;
  font-family: 'Georgia', serif;
}

.settings-footer {
  background: linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20px;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-button {
  background: #ffffff;
  color: #495057;
  border: 1px solid #dee2e6;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-family: 'Georgia', serif;
}

.cancel-button:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.save-button {
  background: #4361ee;
  color: white;
  border: 1px solid #4361ee;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-family: 'Georgia', serif;
}

.save-button:hover {
  background: #3f37c9;
  border-color: #3f37c9;
}
</style>