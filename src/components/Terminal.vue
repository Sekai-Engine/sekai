<script setup>
import { ref, nextTick, onMounted } from 'vue';

const output = ref([]);
const currentInput = ref('');
const terminalBody = ref(null);
const terminalInput = ref(null);
const commandHistory = ref([]);
const historyIndex = ref(-1);

const executeCommand = () => {
  if (!currentInput.value.trim()) return;
  
  const command = currentInput.value.trim();
  output.value.push({
    type: 'command',
    content: `$ ${command}`
  });
  
  // Add to history
  commandHistory.value.push(command);
  historyIndex.value = commandHistory.value.length;
  
  // Command processing
  if (command === 'clear') {
    output.value = [];
  } else if (command === 'help') {
    output.value.push({
      type: 'info',
      content: '可用命令: clear, help, ls'
    });
  } else if (command === 'ls') {
    output.value.push({ type: 'info', content: 'src/' });
    output.value.push({ type: 'info', content: 'package.json' });
    output.value.push({ type: 'info', content: 'README.md' });
  } else {
    output.value.push({
      type: 'error',
      content: `命令未找到: ${command}`
    });
  }
  
  currentInput.value = '';
  
  // Scroll to bottom
  nextTick(() => {
    if (terminalBody.value) {
      terminalBody.value.scrollTop = terminalBody.value.scrollHeight;
    }
  });
};

const handleKeyNavigation = (event) => {
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (historyIndex.value > 0) {
      historyIndex.value--;
      currentInput.value = commandHistory.value[historyIndex.value];
    }
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (historyIndex.value < commandHistory.value.length - 1) {
      historyIndex.value++;
      currentInput.value = commandHistory.value[historyIndex.value];
    } else {
      historyIndex.value = commandHistory.value.length;
      currentInput.value = '';
    }
  }
};

const focusInput = () => {
  if (terminalInput.value) {
    terminalInput.value.focus();
  }
};

const getLineClass = (type) => {
  const baseClass = 'terminal-line';
  switch (type) {
    case 'command':
      return `${baseClass} command`;
    case 'error':
      return `${baseClass} error`;
    case 'info':
      return baseClass;
    default:
      return baseClass;
  }
};

onMounted(() => {
  focusInput();
});
</script>

<template>
  <div class="terminal-container" @click="focusInput">
    <div class="terminal-body" ref="terminalBody">
      <div 
        v-for="(line, index) in output" 
        :key="index" 
        :class="getLineClass(line.type)"
      >
        {{ line.content }}
      </div>
      <div class="terminal-input-line">
        <span class="prompt">$</span>
        <input
          ref="terminalInput"
          v-model="currentInput"
          @keydown.enter="executeCommand"
          @keydown.up="handleKeyNavigation"
          @keydown.down="handleKeyNavigation"
          class="terminal-input"
          spellcheck="false"
          placeholder="输入命令..."
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.terminal-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000000;
  overflow: hidden;
}

.terminal-body {
  flex: 1;
  padding: 12px 16px;
  overflow-y: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.4;
  color: #00ff00;
}

.terminal-line {
  margin-bottom: 2px;
  word-wrap: break-word;
}

.terminal-line.command {
  color: #ffffff;
  font-weight: 500;
}

.terminal-line.error {
  color: #ff6b6b;
}

.terminal-input-line {
  display: flex;
  align-items: center;
  margin-top: 4px;
  border: 1px solid #333;
  background: #0a0a0a;
  padding: 4px 8px;
}

.prompt {
  color: #00ff00;
  margin-right: 8px;
  font-weight: bold;
  user-select: none;
}

.terminal-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}

.terminal-input::placeholder {
  color: #666;
  font-style: italic;
}

.terminal-body::-webkit-scrollbar {
  width: 8px;
}

.terminal-body::-webkit-scrollbar-track {
  background: #000000;
}

.terminal-body::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 4px;
}

.terminal-body::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>