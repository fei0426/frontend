<script setup>
import ChatBox from './components/ChatBox.vue'
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>🎓 校园通 StudyPal AI</h1>
      <p>校园服务智能助手</p>
    </header>
    <main class="app-main">
      <ChatBox />
    </main>
    <footer class="app-footer">
      <p>StudyPal-AI &copy; 2026</p>
    </footer>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
  text-align: center;
  padding: 20px;
}

.app-header h1 {
  margin: 0;
  font-size: 28px;
}

.app-header p {
  margin: 6px 0 0;
  opacity: 0.8;
  font-size: 14px;
}

.app-main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 24px 16px;
}

.app-footer {
  text-align: center;
  padding: 12px;
  color: #94a3b8;
  font-size: 13px;
}
</style>
