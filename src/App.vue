<template>
  <router-view />
  <DownloadModal
    :visible="showDownloadModal"
    :binary-key="pendingBinaryKey"
    :binary-name="pendingBinaryName"
    :os-type="pendingOsType"
    @close="showDownloadModal = false"
    @success="onDownloadSuccess"
  />
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import DownloadModal from './components/DownloadModal.vue';
const showDownloadModal = ref(false);
const pendingBinaryKey = ref('template');
const pendingBinaryName = ref('Sekai Engine');
const pendingOsType = ref('linux');
const checkBinary = async () => {
  try {
    const result = await invoke('check_binary_exists', { key: 'template' });
    
    if (result !== 'exists') {
      pendingOsType.value = result;
      showDownloadModal.value = true;
    }
  } catch (error) {
    console.error('检测二进制文件失败:', error);
  }
};
const onDownloadSuccess = () => {
  console.log('下载成功');
};
onMounted(() => {
  checkBinary();
});
defineExpose({ checkBinary });
</script>
