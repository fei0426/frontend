<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import { confirmQrLoginApi, getCaptchaApi } from '../api/auth'

const route = useRoute()
const router = useRouter()

const ticketId = String(route.query.ticket || '')
const form = reactive({ username: '', password: '' })
const captcha = reactive({ id: '', image: '' })
const captchaCode = ref('')
const captchaLoading = ref(false)
const loading = ref(false)
const done = ref(false)

async function refreshCaptcha() {
  captchaLoading.value = true
  try {
    const data = await getCaptchaApi()
    captcha.id = data.captchaId || ''
    captcha.image = data.imageBase64 || ''
    captchaCode.value = ''
  } finally {
    captchaLoading.value = false
  }
}

async function submit() {
  if (!ticketId) {
    ElMessage.error('二维码链接无效，请在电脑上刷新二维码')
    return
  }
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  if (!captchaCode.value.trim()) {
    ElMessage.warning('请输入图形验证码')
    return
  }

  loading.value = true
  try {
    await confirmQrLoginApi({
      ticketId,
      username: form.username,
      password: form.password,
      captchaId: captcha.id,
      captchaCode: captchaCode.value.trim()
    })
    done.value = true
    ElMessage.success('已确认，电脑端即将自动登录')
  } catch {
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}

onMounted(refreshCaptcha)
</script>

<template>
  <div class="confirm-page">
    <section class="confirm-card">
      <h1>扫码登录确认</h1>
      <p class="subtitle">确认后，正在等待的电脑会自动登录你的账号</p>

      <template v-if="!done">
        <el-form label-position="top" @submit.prevent>
          <el-form-item label="用户名">
            <el-input v-model="form.username" size="large" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input
              v-model="form.password"
              size="large"
              type="password"
              show-password
              placeholder="请输入密码"
            />
          </el-form-item>
          <el-form-item label="图形验证码">
            <div class="captcha-row">
              <el-input
                v-model="captchaCode"
                size="large"
                maxlength="4"
                placeholder="4 位验证码"
                @keyup.enter="submit"
              />
              <button
                type="button"
                class="captcha-box"
                :disabled="captchaLoading"
                title="点击刷新验证码"
                @click="refreshCaptcha"
              >
                <img v-if="captcha.image" :src="captcha.image" alt="图形验证码" />
                <span v-else>加载中</span>
              </button>
            </div>
          </el-form-item>

          <el-button
            type="primary"
            size="large"
            class="submit-btn"
            :loading="loading"
            @click="submit"
          >
            确认登录
          </el-button>
        </el-form>
      </template>

      <template v-else>
        <el-result icon="success" title="确认成功" sub-title="请回到电脑端查看，页面会自动跳转" />
        <el-button class="submit-btn" @click="router.push('/login')">返回登录页</el-button>
      </template>
    </section>
  </div>
</template>

<style scoped>
.confirm-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(135deg, #eef4ff 0%, #f7fafc 100%);
}

.confirm-card {
  width: 100%;
  max-width: 380px;
  padding: 36px 32px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 18px 48px rgba(31, 77, 184, 0.12);
}

h1 {
  margin: 0 0 6px;
  font-size: 22px;
  color: #1f3a6e;
}

.subtitle {
  margin: 0 0 22px;
  font-size: 13px;
  color: #8797ae;
}

.captcha-row {
  display: flex;
  gap: 10px;
  width: 100%;
}

.captcha-box {
  flex: 0 0 120px;
  height: 40px;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  background: #f4f7fc;
  border: 1px solid #dce5f2;
  border-radius: 8px;
}

.captcha-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.submit-btn {
  width: 100%;
  margin-top: 8px;
}
</style>
