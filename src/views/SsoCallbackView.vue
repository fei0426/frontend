<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, CircleCloseFilled } from '@element-plus/icons-vue'

import { useAuthStore } from '../stores/auth'
import { ssoExchangeApi } from '../api/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const loading = ref(true)
const errorMsg = ref('')

onMounted(async () => {
  const code = route.query.code
  const state = route.query.state

  if (!code) {
    errorMsg.value = '缺少授权码，无法完成 SSO 登录'
    loading.value = false
    redirectToLogin()
    return
  }

  try {
    const redirectUri = window.location.origin + '/#/sso-callback'
    const data = await ssoExchangeApi({ code, redirectUri, state })
    await auth.ssoLogin({ token: data.token })
    ElMessage.success(`欢迎，${auth.name || auth.username}`)
    const redirect = localStorage.getItem('sso_redirect') || '/profile'
    localStorage.removeItem('sso_redirect')
    router.replace(redirect)
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || 'SSO 登录失败，请稍后重试'
    loading.value = false
    redirectToLogin()
  }
})

function redirectToLogin() {
  setTimeout(() => {
    router.push('/login')
  }, 3000)
}
</script>

<template>
  <div class="sso-callback-page">
    <div class="sso-callback-box">
      <el-icon v-if="loading" class="loading-icon" :size="48">
        <Loading />
      </el-icon>
      <el-icon v-else class="error-icon" :size="48">
        <CircleCloseFilled />
      </el-icon>
      <h2 v-if="loading">正在通过统一身份认证登录...</h2>
      <h2 v-else class="error-title">登录失败</h2>
      <p v-if="loading" class="sso-desc">请稍候，正在验证身份并跳转</p>
      <p v-else class="error-desc">{{ errorMsg }}</p>
      <p v-if="!loading" class="redirect-tip">3 秒后自动返回登录页...</p>
    </div>
  </div>
</template>

<style scoped>
.sso-callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 12% 18%, rgba(59, 130, 246, 0.18), transparent 34%),
    radial-gradient(circle at 88% 82%, rgba(14, 165, 233, 0.16), transparent 32%),
    #eef2ff;
}

.sso-callback-box {
  width: 400px;
  padding: 48px 32px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.15);
  text-align: center;
}

.loading-icon {
  color: #2563eb;
  animation: spin 1s linear infinite;
}

.error-icon {
  color: #ef4444;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.sso-callback-box h2 {
  margin: 20px 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
}

.error-title {
  color: #ef4444;
}

.sso-desc {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.error-desc {
  margin: 0;
  font-size: 14px;
  color: #ef4444;
}

.redirect-tip {
  margin: 16px 0 0;
  font-size: 13px;
  color: #94a3b8;
}
</style>

<style scoped>
.sso-callback-page {
  background: var(--sp-canvas);
}

.sso-callback-box {
  border: 1px solid var(--sp-border);
  border-radius: 16px;
  box-shadow: var(--sp-shadow-float);
}

.loading-icon {
  color: var(--sp-primary);
}

.error-icon,
.error-title,
.error-desc {
  color: var(--sp-danger);
}

.error-title {
  color: var(--sp-ink);
}

.sso-desc,
.redirect-tip {
  color: var(--sp-muted);
}
</style>
