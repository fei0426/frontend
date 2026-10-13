<script setup>
import { ref } from 'vue'
import CampusTree from './components/CampusTree.vue'
import CampusCascader from './components/CampusCascader.vue'

const activeTab = ref('tree')
</script>

<template>
  <div class="campus-page">
    <header class="campus-header">
      <h1>🗺️ 校园通 · 校区数据插件</h1>
      <p>独立于对话窗口的校区 / 学院 / 专业浏览界面</p>
    </header>

    <main class="campus-main">
      <div class="campus-card">
        <el-tabs v-model="activeTab" class="campus-tabs">
          <el-tab-pane label="树形图" name="tree">
            <CampusTree />
          </el-tab-pane>
          <el-tab-pane label="级联选择器" name="cascader">
            <CampusCascader />
          </el-tab-pane>
        </el-tabs>
      </div>
    </main>

    <footer class="campus-footer">
      <p>StudyPal-AI &copy; 2026</p>
    </footer>
  </div>
</template>

<style scoped>
.campus-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.campus-header {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
  text-align: center;
  padding: 20px;
}

.campus-header h1 {
  margin: 0;
  font-size: 28px;
}

.campus-header p {
  margin: 6px 0 0;
  opacity: 0.8;
  font-size: 14px;
}

.campus-main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 24px 16px;
}

.campus-card {
  width: 100%;
  max-width: 720px;
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.campus-footer {
  text-align: center;
  padding: 12px;
  color: #94a3b8;
  font-size: 13px;
}
</style>
