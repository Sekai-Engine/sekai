<script setup>
import { ref } from 'vue';

const imageUrl = ref('');
const videoUrl = ref('');

const handleFileSelect = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,video/*';
  
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      clearPreview();
      
      if (file.type.startsWith('image/')) {
        imageUrl.value = URL.createObjectURL(file);
      } else if (file.type.startsWith('video/')) {
        videoUrl.value = URL.createObjectURL(file);
      }
    }
  };
  
  input.click();
};

const clearPreview = () => {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value);
    imageUrl.value = '';
  }
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value);
    videoUrl.value = '';
  }
};
</script>

<template>
  <div class="preview-container">
    <div class="preview-body">
      <img 
        v-if="imageUrl" 
        :src="imageUrl" 
        alt="Preview" 
        class="preview-image"
      />
      <video 
        v-else-if="videoUrl" 
        :src="videoUrl" 
        controls 
        class="preview-video"
      />
      <div v-else class="black-screen">
        <div class="black-screen-content">
          <div class="aspect-ratio-container">
            <div class="black-display"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}

.preview-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 20px;
  background: #ffffff;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.preview-video {
  max-width: 100%;
  max-height: 100%;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}



.black-screen {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
}

.black-screen-content {
  width: 90%;
  height: 90%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.aspect-ratio-container {
  width: 100%;
  position: relative;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
}

.black-display {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000000;
  border: 1px solid #dee2e6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
