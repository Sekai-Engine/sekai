<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { fileSystem } from '../services/FileSystem';

const router = useRouter();

const currentTab = ref('games'); // 'games' or 'templates'

// Load projects from localStorage
const storedProjects = localStorage.getItem('sekai_projects');
const projects = ref(storedProjects ? JSON.parse(storedProjects) : []);

// Watch for changes and save to localStorage
watch(projects, (newProjects) => {
  localStorage.setItem('sekai_projects', JSON.stringify(newProjects));
}, { deep: true });

const createNewProject = async () => {
  try {
    // Both Desktop and Web now use "App Install Directory" (Resource Dir or OPFS)
    // This provides a fixed path without prompting user every time
    const baseDir = await fileSystem.getAppInstallDir();

    if (baseDir) {
      // Prompt user for project name
      const defaultName = 'New Project';
      const projectName = prompt('请输入项目名称:', defaultName);
      
      if (!projectName) return; // User cancelled prompt

      const projectPath = await fileSystem.join(baseDir, projectName);

      // Check if directory already exists to prevent overwriting (basic check)
      // Note: FileSystem.js createDirectory implementation might throw or handle this
      // Ideally we check existence first, but for now we proceed.
      
      // 创建项目目录结构
      await fileSystem.createDirectory(projectPath);
      await fileSystem.createDirectory(await fileSystem.join(projectPath, 'assets'));
      await fileSystem.createDirectory(await fileSystem.join(projectPath, 'data'));
      
      // 创建项目配置文件
      const config = {
        name: projectName,
        version: '0.0.1',
        created: new Date().toISOString(),
        description: 'New Sekai Project'
      };
      
      await fileSystem.writeFile(
        await fileSystem.join(projectPath, 'project.json'), 
        JSON.stringify(config, null, 2)
      );

      // 添加到项目列表
      projects.value.unshift({
        id: Date.now(),
        name: projectName,
        description: config.description,
        image: '/placeholder-game.jpg',
        lastModified: new Date().toLocaleDateString()
      });

      console.log('Project created at:', projectPath);
    }
  } catch (error) {
    console.error('Failed to create project:', error);
    alert('创建项目失败: ' + error.message);
  }
};

const openProject = (id) => {
  router.push('/editor');
};

const deleteProject = (id) => {
  if (confirm('确定要删除这个项目吗？')) {
    projects.value = projects.value.filter(p => p.id !== id);
  }
};

const editProject = (id) => {
  console.log('Edit project settings', id);
};
</script>

<template>
  <div class="project-list-container">
    <div class="sidebar">
      <div class="logo-area">
        <img src="../assets/icon.png" alt="Sekai" class="logo-icon" />
        <h1>Sekai Engine</h1>
      </div>
      
      <nav class="nav-menu">
        <div 
          class="nav-item" 
          :class="{ active: currentTab === 'games' }"
          @click="currentTab = 'games'"
        >
          <span class="icon">🎮</span>
          <span class="label">游戏</span>
        </div>
        <div 
          class="nav-item" 
          :class="{ active: currentTab === 'templates' }"
          @click="currentTab = 'templates'"
        >
          <span class="icon">回</span>
          <span class="label">模板</span>
        </div>
      </nav>
    </div>
    
    <div class="main-content">
      <header class="content-header">
        <h2>游戏列表</h2>
        <div class="header-actions">
          <button class="btn-primary" @click="createNewProject">
            <span class="icon">+</span> 新建游戏
          </button>
          <button class="btn-icon">
            <span>↻</span>
          </button>
        </div>
      </header>
      
      <div class="projects-grid">
        <div v-for="project in projects" :key="project.id" class="project-card">
          <div class="card-image">
            <div class="placeholder-image">
              <span>{{ project.name[0] }}</span>
            </div>
          </div>
          <div class="card-body">
            <h3>{{ project.name }}</h3>
            <p class="description">{{ project.description }}</p>
            <div class="card-actions">
              <button class="btn-primary btn-block" @click="openProject(project.id)">
                编辑游戏
              </button>
              <div class="dropdown-menu-container">
                <button class="btn-icon-small" @click.stop="project.showMenu = !project.showMenu" @blur="setTimeout(() => project.showMenu = false, 200)">
                  ⋮
                </button>
                <div v-if="project.showMenu" class="dropdown-menu">
                  <div class="dropdown-item delete" @click.stop="deleteProject(project.id)">
                    🗑️ 删除
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-list-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #f8f9fa;
  font-family: 'Georgia', 'Times New Roman', serif;
  color: #2d3436;
}

.sidebar {
  width: 240px;
  background-color: #ffffff;
  border-right: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
  padding: 24px 0;
}

.logo-area {
  padding: 0 24px 32px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 32px;
  height: 32px;
}

.logo-area h1 {
  font-size: 18px;
  font-weight: 500;
  color: #4361ee;
  margin: 0;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  padding: 0 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
  color: #6c757d;
}

.nav-item:hover {
  background-color: #f8f9fa;
  color: #495057;
}

.nav-item.active {
  background-color: #eef2ff;
  color: #4361ee;
  font-weight: 500;
}

.main-content {
  flex: 1;
  padding: 32px 48px;
  overflow-y: auto;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.content-header h2 {
  font-size: 24px;
  font-weight: 500;
  color: #4361ee;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-primary {
  background-color: #4361ee;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #3f37c9;
}

.btn-block {
  width: 100%;
  justify-content: center;
}

.btn-icon {
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6c757d;
  font-size: 16px;
}

.btn-icon:hover {
  background-color: #f8f9fa;
  color: #495057;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.project-card {
  background-color: #ffffff;
  border-radius: 12px;
  overflow: visible; /* 允许子元素溢出 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #f1f3f5;
  position: relative; /* 建立定位上下文 */
  z-index: 1;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  z-index: 10; /* 悬停时提高层级，防止菜单被其他卡片遮挡 */
}

.card-image {
  height: 160px;
  background-color: #e9ecef;
  position: relative;
  border-radius: 12px 12px 0 0; /* 手动设置圆角 */
  overflow: hidden; /* 图片本身依然需要裁剪 */
}

.placeholder-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%);
  color: white;
  font-size: 48px;
  font-weight: 300;
}

.card-body {
  padding: 16px;
}

.card-body h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
}

.description {
  color: #adb5bd;
  font-size: 13px;
  margin: 0 0 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.btn-icon-small {
  background: transparent;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  width: 32px;
  height: 32px; /* 显式设置高度 */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6c757d;
}

.btn-icon-small:hover {
  background-color: #f8f9fa;
  color: #495057;
}

.dropdown-menu-container {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  min-width: 120px;
  z-index: 1000;
  overflow: hidden;
}

.dropdown-item {
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

.dropdown-item.delete {
  color: #e03131;
}

.dropdown-item.delete:hover {
  background-color: #fff5f5;
}
</style>