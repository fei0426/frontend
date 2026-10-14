<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = ref({ username: 'stu', password: '123456' })
const loading = ref(false)

// 演示用：点一下直接填好账号，避免现场手打
const demoAccounts = [
  { username: 'stu', label: '学生' },
  { username: 'tea', label: '教师' },
  { username: 'admin', label: '管理员' }
]

function fill(username) {
  form.value = { username, password: '123456' }
}

async function handleLogin() {
  if (!form.value.username || !form.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    await auth.login(form.value)
    ElMessage.success(`欢迎，${auth.name}`)
    router.push(route.query.redirect || '/profile')
  } catch (error) {
    ElMessage.error(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <el-card class="login-card">
      <h2 class="login-title">🎓 校园通</h2>
      <p class="login-subtitle">功能权限管理演示</p>

      <el-form label-position="top" @submit.prevent>
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="请输入密码"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
      </el-form>

      <el-button type="primary" class="login-button" :loading="loading" @click="handleLogin">
        登录
      </el-button>

      <div class="login-demo">
        <span class="login-demo-label">演示账号：</span>
        <el-button
          v-for="item in demoAccounts"
          :key="item.username"
          link
          type="primary"
          @click="fill(item.username)"
        >
          {{ item.label }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.login-card {
  width: 360px;
}

.login-title {
  margin: 0;
  font-size: 22px;
  text-align: center;
}

.login-subtitle {
  margin: 6px 0 24px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

.login-button {
  width: 100%;
}

.login-demo {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  font-size: 13px;
}

.login-demo-label {
  color: #909399;
}
</style>
