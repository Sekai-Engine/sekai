<template>
  <div v-if="visible" class="modal-overlay" @click.self="handleCancel">
    <div class="modal">
      <h2>下载二进制文件</h2>
      
      <div class="binary-info">
        <span class="binary-name">{{ binaryName }}</span>
      </div>
      <div class="mirror-select">
        <label>
          <input type="radio" v-model="selectedMirror" value="github.com" />
          GitHub
        </label>
        <label>
          <input type="radio" v-model="selectedMirror" value="atomgit.com" />
          AtomGit
        </label>
      </div>
      <div class="modal-actions">
        <button @click="handleCancel">取消</button>
        <button @click="handleDownload" :disabled="downloading">
          {{ downloading ? '下载中...' : '下载' }}
        </button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
const props = defineProps({
  visible: Boolean,
  binaryKey: { type: String, default: 'template' },
  binaryName: { type: String, default: 'Sekai Engine' },
  osType: { type: String, required: true }
});
const emit = defineEmits(['close', 'success']);
const selectedMirror = ref('github.com');
const downloading = ref(false);
const handleDownload = async () => {
  downloading.value = true;
  try {
    await invoke('download_binary', {
      key: props.binaryKey,
      source: selectedMirror.value,
      osType: props.osType
    });
    emit('success');
    emit('close');
  } catch (error) {
    alert('下载失败: ' + error);
  } finally {
    downloading.value = false;
  }
};
const handleCancel = () => {
  emit('close');
};
</script>
