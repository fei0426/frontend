<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import { useAuthStore } from '../stores/auth'
import {
  createQrLoginApi,
  getCaptchaApi,
  getQrStatusApi,
  registerApi,
  resetPasswordApi,
  sendRegisterCodeApi,
  sendResetCodeApi
} from '../api/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const tabs = [
  { key: 'login', label: '登录' },
  { key: 'register', label: '注册' },
  { key: 'forgot', label: '忘记密码' }
]
const activeTab = ref('login')

const loginForm = reactive({ username: 'stu', password: '123456' })
const registerForm = reactive({
  username: '',
  realName: '',
  userNo: '',
  grade: '',
  email: '',
  emailCode: '',
  phone: '',
  password: '',
  confirmPassword: ''
})
const resetForm = reactive({
  channel: 'email',
  username: '',
  email: '',
  phone: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})

const captcha = reactive({ id: '', image: '' })
const captchaCode = ref('')
const captchaLoading = ref(false)
const loginLoading = ref(false)
const registerLoading = ref(false)
const registerCodeLoading = ref(false)
const codeLoading = ref(false)
const resetLoading = ref(false)
const resetStep = ref(1)
const devCode = ref('')

// 登录方式：password（账号密码）| qr（扫码登录）
const loginMode = ref('password')
const qr = reactive({ ticketId: '', image: '', text: '' })
const qrLoading = ref(false)
let qrTimer = null

async function refreshQr() {
  stopQrPolling()
  qrLoading.value = true
  try {
    const data = await createQrLoginApi()
    qr.ticketId = data.ticketId || ''
    qr.image = data.imageBase64 || ''
    qr.text = '等待扫码…'
    qrTimer = window.setInterval(pollQr, 2000)
  } finally {
    qrLoading.value = false
  }
}

function stopQrPolling() {
  if (qrTimer) {
    window.clearInterval(qrTimer)
    qrTimer = null
  }
}

async function pollQr() {
  if (!qr.ticketId) return
  try {
    const data = await getQrStatusApi(qr.ticketId)
    if (data.status === 'CONFIRMED' && data.login && data.login.accessToken) {
      stopQrPolling()
      qr.text = '已确认，正在进入…'
      await auth.loginWithToken(data.login.accessToken)
      ElMessage.success(`欢迎，${auth.name}`)
      router.push(route.query.redirect || '/profile')
      return
    }
    if (data.status === 'SCANNED') {
      qr.text = '已扫码，请在手机上确认登录'
    } else if (data.status === 'EXPIRED') {
      qr.text = '二维码已过期，请刷新'
      stopQrPolling()
    } else {
      qr.text = '等待扫码…'
    }
  } catch {
    // 轮询期间的网络抖动忽略，下一轮继续
  }
}

function switchLoginMode(mode) {
  if (loginMode.value === mode) return
  loginMode.value = mode
  if (mode === 'qr') {
    refreshQr()
  } else {
    stopQrPolling()
    refreshCaptcha()
  }
}

const passwordHint = computed(() => '8-32 位，需同时包含大写字母、小写字母和数字')

const demoAccounts = [
  { username: 'stu', label: '学生' },
  { username: 'tea', label: '教师' },
  { username: 'admin', label: '管理员' }
]

function fill(username) {
  loginForm.username = username
  loginForm.password = '123456'
}

async function refreshCaptcha() {
  captchaLoading.value = true
  captchaCode.value = ''
  try {
    const data = await getCaptchaApi()
    captcha.id = data.captchaId || ''
    captcha.image = data.imageBase64 || ''
  } finally {
    captchaLoading.value = false
  }
}

function switchTab(key) {
  if (activeTab.value === key) return
  activeTab.value = key
  resetStep.value = 1
  devCode.value = ''
  stopQrPolling()
  refreshCaptcha()
}

function validateCaptcha() {
  if (!captcha.id) {
    ElMessage.warning('验证码未加载，请点击图片刷新')
    return false
  }
  if (!captchaCode.value.trim()) {
    ElMessage.warning('请输入图形验证码')
    return false
  }
  return true
}

function passwordStrong(value) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,32}$/.test(value)
}

async function handleLogin() {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  if (!validateCaptcha()) return

  loginLoading.value = true
  try {
    await auth.login({
      ...loginForm,
      captchaId: captcha.id,
      captchaCode: captchaCode.value.trim()
    })
    ElMessage.success(`欢迎，${auth.name}`)
    router.push(route.query.redirect || '/profile')
  } catch {
    // 验证码一次性使用，失败后立即换一张
    refreshCaptcha()
  } finally {
    loginLoading.value = false
  }
}

async function handleRegister() {
  const form = registerForm
  if (!form.username || !form.realName || !form.email || !form.password) {
    ElMessage.warning('请填写用户名、姓名、邮箱和密码')
    return
  }
  if (!passwordStrong(form.password)) {
    ElMessage.warning(passwordHint.value)
    return
  }
  if (!form.emailCode || !form.emailCode.trim()) {
    ElMessage.warning('请输入邮箱验证码')
    return
  }
  if (form.password !== form.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }

  registerLoading.value = true
  try {
    await registerApi({
      ...form,
      emailCode: form.emailCode.trim()
    })
    ElMessage.success('注册成功，请使用新账号登录')
    loginForm.username = form.username
    loginForm.password = ''
    activeTab.value = 'login'
    refreshCaptcha()
  } catch {
    refreshCaptcha()
  } finally {
    registerLoading.value = false
  }
}

async function handleSendRegisterCode() {
  const form = registerForm
  if (!form.username || !form.email) {
    ElMessage.warning('请先填写用户名和邮箱')
    return
  }
  if (!validateCaptcha()) return

  registerCodeLoading.value = true
  try {
    const data = await sendRegisterCodeApi({
      username: form.username.trim(),
      email: form.email.trim(),
      captchaId: captcha.id,
      captchaCode: captchaCode.value.trim()
    })
    if (data.devCode) {
      form.emailCode = data.devCode
      ElMessage.success(`演示环境验证码：${data.devCode}（已自动填入）`)
    } else {
      ElMessage.success(data.message || '验证码已发送，请查收邮箱')
    }
    refreshCaptcha()
  } catch {
    refreshCaptcha()
  } finally {
    registerCodeLoading.value = false
  }
}

async function handleSendCode() {
  const isSms = resetForm.channel === 'sms'
  if (!resetForm.username || (isSms ? !resetForm.phone : !resetForm.email)) {
    ElMessage.warning(isSms ? '请输入用户名和注册手机号' : '请输入用户名和注册邮箱')
    return
  }
  if (!validateCaptcha()) return

  codeLoading.value = true
  try {
    const data = await sendResetCodeApi({
      username: resetForm.username,
      channel: resetForm.channel,
      email: resetForm.email,
      phone: resetForm.phone,
      captchaId: captcha.id,
      captchaCode: captchaCode.value.trim()
    })
    devCode.value = data.devCode || ''
    if (devCode.value) {
      resetForm.code = devCode.value
    }
    resetStep.value = 2
    ElMessage.success(data.message || '验证码已发送')
    refreshCaptcha()
  } catch {
    refreshCaptcha()
  } finally {
    codeLoading.value = false
  }
}

async function handleReset() {
  const form = resetForm
  if (!form.code) {
    ElMessage.warning(form.channel === 'sms' ? '请输入短信验证码' : '请输入邮箱验证码')
    return
  }
  if (!passwordStrong(form.newPassword)) {
    ElMessage.warning(passwordHint.value)
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }

  resetLoading.value = true
  try {
    await resetPasswordApi({
      username: form.username,
      channel: form.channel,
      email: form.email,
      phone: form.phone,
      code: form.code,
      newPassword: form.newPassword,
      confirmPassword: form.confirmPassword
    })
    ElMessage.success('密码已重置，请使用新密码登录')
    loginForm.username = form.username
    loginForm.password = ''
    activeTab.value = 'login'
    resetStep.value = 1
    resetForm.code = ''
    resetForm.newPassword = ''
    resetForm.confirmPassword = ''
    devCode.value = ''
    refreshCaptcha()
  } finally {
    resetLoading.value = false
  }
}

function backToSend() {
  resetStep.value = 1
  devCode.value = ''
  refreshCaptcha()
}

onMounted(refreshCaptcha)

onBeforeUnmount(stopQrPolling)
</script>

<template>
  <div class="auth-page">
    <div class="auth-shell">
      <aside class="brand-panel">
        <div class="brand-mark">SP</div>
        <h1>校园通</h1>
        <p class="brand-sub">StudyPal · 统一身份门户</p>


        <div class="brand-foot">JWT 无状态认证 · 登录即签发访问凭证</div>
      </aside>

      <section class="auth-card">
        <header class="card-head">
          <h2 v-if="activeTab === 'login'">欢迎回来</h2>
          <h2 v-else-if="activeTab === 'register'">创建学生账号</h2>
          <h2 v-else>重置登录密码</h2>
          <p v-if="activeTab === 'login'">登录后按角色展示可用功能</p>
          <p v-else-if="activeTab === 'register'">注册账号默认授予学生角色</p>
          <p v-else>通过注册邮箱验证身份</p>
        </header>

        <nav class="tab-bar">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            :class="['tab-item', { active: activeTab === tab.key }]"
            @click="switchTab(tab.key)"
          >
            {{ tab.label }}
          </button>
        </nav>

        <!-- 登录方式切换 -->
        <div v-if="activeTab === 'login'" class="mode-switch">
          <button
            type="button"
            :class="['mode-item', { active: loginMode === 'password' }]"
            @click="switchLoginMode('password')"
          >
            账号密码
          </button>
          <button
            type="button"
            :class="['mode-item', { active: loginMode === 'qr' }]"
            @click="switchLoginMode('qr')"
          >
            扫码登录
          </button>
        </div>

        <!-- 登录 -->
        <el-form
          v-if="activeTab === 'login' && loginMode === 'password'"
          label-position="top"
          class="auth-form"
          @submit.prevent
        >
          <el-form-item label="用户名">
            <el-input
              v-model="loginForm.username"
              size="large"
              placeholder="请输入用户名"
              autocomplete="username"
            />
          </el-form-item>

          <el-form-item label="密码">
            <el-input
              v-model="loginForm.password"
              size="large"
              type="password"
              show-password
              placeholder="请输入密码"
              autocomplete="current-password"
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-form-item label="图形验证码">
            <div class="captcha-row">
              <el-input
                v-model="captchaCode"
                size="large"
                maxlength="4"
                placeholder="4 位验证码"
                @keyup.enter="handleLogin"
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
            :loading="loginLoading"
            @click="handleLogin"
          >
            登录
          </el-button>

          <div class="demo-row">
            <span>演示账号</span>
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
        </el-form>

        <!-- 扫码登录 -->
        <div v-else-if="activeTab === 'login' && loginMode === 'qr'" class="qr-panel">
          <div v-loading="qrLoading" class="qr-box" @click="refreshQr">
            <img v-if="qr.image" :src="qr.image" alt="登录二维码" />
            <span v-else class="qr-placeholder">点击生成二维码</span>
          </div>
          <p class="qr-status">{{ qr.text }}</p>
          <p class="qr-tip">
            用手机浏览器扫描二维码（或直接打开里面的地址），
            在确认页输入账号密码，电脑端会自动登录。
          </p>
          <el-button link type="primary" @click="refreshQr">刷新二维码</el-button>
        </div>

        <!-- 注册 -->
        <el-form
          v-else-if="activeTab === 'register'"
          label-position="top"
          class="auth-form"
          @submit.prevent
        >
          <div class="form-grid">
            <el-form-item label="用户名">
              <el-input
                v-model="registerForm.username"
                size="large"
                placeholder="字母开头，4-20 位"
              />
            </el-form-item>
            <el-form-item label="姓名">
              <el-input
                v-model="registerForm.realName"
                size="large"
                placeholder="真实姓名"
              />
            </el-form-item>
            <el-form-item label="学号（选填）">
              <el-input
                v-model="registerForm.userNo"
                size="large"
                placeholder="4-20 位字母或数字"
              />
            </el-form-item>
            <el-form-item label="年级（选填）">
              <el-input v-model="registerForm.grade" size="large" placeholder="如 2024" />
            </el-form-item>
          </div>

          <el-form-item label="邮箱">
            <el-input
              v-model="registerForm.email"
              size="large"
              placeholder="用于接收注册验证码与找回密码"
            />
          </el-form-item>

          <el-form-item label="邮箱验证码">
            <div class="captcha-row">
              <el-input
                v-model="registerForm.emailCode"
                size="large"
                maxlength="6"
                placeholder="6 位数字验证码"
                @keyup.enter="handleRegister"
              />
              <el-button
                type="primary"
                class="code-btn"
                :loading="registerCodeLoading"
                @click="handleSendRegisterCode"
              >
                获取验证码
              </el-button>
            </div>
          </el-form-item>

          <el-form-item label="手机号（选填）">
            <el-input
              v-model="registerForm.phone"
              size="large"
              maxlength="11"
              placeholder="11 位手机号"
            />
          </el-form-item>

          <div class="form-grid">
            <el-form-item label="密码">
              <el-input
                v-model="registerForm.password"
                size="large"
                type="password"
                show-password
                placeholder="设置登录密码"
              />
            </el-form-item>
            <el-form-item label="确认密码">
              <el-input
                v-model="registerForm.confirmPassword"
                size="large"
                type="password"
                show-password
                placeholder="再次输入密码"
                @keyup.enter="handleRegister"
              />
            </el-form-item>
          </div>
          <p class="field-hint">{{ passwordHint }}</p>

          <el-form-item label="图形验证码">
            <div class="captcha-row">
              <el-input
                v-model="captchaCode"
                size="large"
                maxlength="4"
                placeholder="发码前填写图形码"
                @keyup.enter="handleSendRegisterCode"
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
            :loading="registerLoading"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form>

        <!-- 忘记密码 -->
        <div v-else class="auth-form">
          <el-form v-if="resetStep === 1" label-position="top" @submit.prevent>
            <el-form-item label="用户名">
              <el-input
                v-model="resetForm.username"
                size="large"
                placeholder="请输入用户名"
              />
            </el-form-item>

            <el-form-item label="验证方式">
              <el-radio-group v-model="resetForm.channel" @change="refreshCaptcha">
                <el-radio-button label="email">邮箱验证码</el-radio-button>
                <el-radio-button label="sms">短信验证码</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item v-if="resetForm.channel === 'email'" label="注册邮箱">
              <el-input
                v-model="resetForm.email"
                size="large"
                placeholder="请输入注册时填写的邮箱"
              />
            </el-form-item>

            <el-form-item v-else label="注册手机号">
              <el-input
                v-model="resetForm.phone"
                size="large"
                maxlength="11"
                placeholder="请输入注册时填写的手机号"
              />
            </el-form-item>

            <el-form-item label="图形验证码">
              <div class="captcha-row">
                <el-input
                  v-model="captchaCode"
                  size="large"
                  maxlength="4"
                  placeholder="4 位验证码"
                  @keyup.enter="handleSendCode"
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
              :loading="codeLoading"
              @click="handleSendCode"
            >
              {{ resetForm.channel === 'sms' ? '发送短信验证码' : '发送邮箱验证码' }}
            </el-button>
          </el-form>

          <el-form v-else label-position="top" @submit.prevent>
            <el-alert
              v-if="devCode"
              type="success"
              :closable="false"
              show-icon
              class="dev-code-tip"
              :title="`演示环境验证码：${devCode}（已自动填入）`"
            />

            <el-form-item :label="resetForm.channel === 'sms' ? '短信验证码' : '邮箱验证码'">
              <el-input
                v-model="resetForm.code"
                size="large"
                maxlength="6"
                placeholder="6 位数字验证码"
              />
            </el-form-item>

            <el-form-item label="新密码">
              <el-input
                v-model="resetForm.newPassword"
                size="large"
                type="password"
                show-password
                placeholder="设置新密码"
              />
            </el-form-item>

            <el-form-item label="确认新密码">
              <el-input
                v-model="resetForm.confirmPassword"
                size="large"
                type="password"
                show-password
                placeholder="再次输入新密码"
                @keyup.enter="handleReset"
              />
            </el-form-item>
            <p class="field-hint">{{ passwordHint }}</p>

            <el-button
              type="primary"
              size="large"
              class="submit-btn"
              :loading="resetLoading"
              @click="handleReset"
            >
              重置密码
            </el-button>

            <div class="demo-row">
              <span>没收到验证码？</span>
              <el-button link type="primary" :loading="codeLoading" @click="backToSend">
                重新发送
              </el-button>
            </div>
          </el-form>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background:
    radial-gradient(circle at 12% 18%, rgba(59, 130, 246, 0.18), transparent 34%),
    radial-gradient(circle at 88% 82%, rgba(14, 165, 233, 0.16), transparent 32%),
    #eef2ff;
}

.auth-shell {
  width: min(1060px, 100%);
  min-height: 640px;
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  background: #ffffff;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.18);
}

.brand-panel {
  display: flex;
  flex-direction: column;
  padding: 52px 48px;
  color: #ffffff;
  background: linear-gradient(160deg, #172554 0%, #1d4ed8 52%, #0ea5e9 100%);
}

.brand-mark {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.28);
  font-weight: 700;
  letter-spacing: 1px;
}

.brand-panel h1 {
  margin: 28px 0 6px;
  font-size: 34px;
  font-weight: 700;
  letter-spacing: 2px;
}

.brand-sub {
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  letter-spacing: 1px;
}

.brand-list {
  list-style: none;
  margin: 48px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.brand-list li {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.brand-list span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex: none;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.22);
  font-size: 11px;
  letter-spacing: 0.5px;
}

.brand-foot {
  margin-top: auto;
  padding-top: 40px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.62);
  border-top: 1px solid rgba(255, 255, 255, 0.16);
}

.auth-card {
  display: flex;
  flex-direction: column;
  padding: 44px 48px;
}

.card-head h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #0f172a;
}

.card-head p {
  margin: 8px 0 24px;
  font-size: 13px;
  color: #94a3b8;
}

.tab-bar {
  display: flex;
  gap: 6px;
  padding: 4px;
  margin-bottom: 22px;
  background: #f1f5f9;
  border-radius: 12px;
}

.tab-item {
  flex: 1;
  padding: 9px 0;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.tab-item.active {
  background: #ffffff;
  color: #2563eb;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.auth-form {
  flex: 1;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 14px;
}

.captcha-row {
  display: flex;
  gap: 10px;
  width: 100%;
}

.captcha-box {
  width: 124px;
  height: 40px;
  flex: none;
  padding: 0;
  overflow: hidden;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #eff6ff;
  cursor: pointer;
}

.captcha-box img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.captcha-box span {
  font-size: 12px;
  color: #94a3b8;
}

.submit-btn {
  width: 100%;
  margin-top: 4px;
}

.code-btn {
  width: 124px;
  height: 40px;
  flex: none;
}

.field-hint {
  margin: -8px 0 12px;
  font-size: 12px;
  color: #94a3b8;
}

.demo-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  font-size: 13px;
  color: #94a3b8;
}

.dev-code-tip {
  margin-bottom: 16px;
}

@media (max-width: 860px) {
  .auth-page {
    padding: 16px;
  }

  .auth-shell {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .brand-panel {
    display: none;
  }

  .auth-card {
    padding: 32px 24px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}

/* 登录方式切换 */
.mode-switch {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  margin-bottom: 18px;
  background: #f1f5fb;
  border-radius: 10px;
}

.mode-item {
  padding: 6px 16px;
  font-size: 13px;
  color: #5b6b84;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 8px;
  transition: all 0.2s;
}

.mode-item.active {
  color: #1f4db8;
  background: #fff;
  box-shadow: 0 1px 4px rgba(31, 77, 184, 0.16);
}

/* 扫码登录 */
.qr-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0 4px;
}

.qr-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 214px;
  height: 214px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e3e9f4;
  border-radius: 14px;
}

.qr-box img {
  width: 196px;
  height: 196px;
}

.qr-placeholder {
  font-size: 13px;
  color: #9aa8bd;
}

.qr-status {
  margin: 14px 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: #2f4f7a;
}

.qr-tip {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.6;
  color: #8797ae;
  text-align: center;
}
</style>
