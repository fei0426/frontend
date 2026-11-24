import request from './request'

/**
 * 认证接口：登录、注册、图形验证码、忘记密码、当前用户信息。
 * 权限码命名规范：模块:资源:操作，与后端 sys_permission 表保持一致。
 */
const ROLE_LABELS = {
  STUDENT: '学生',
  TEACHER: '教师',
  ADMIN: '管理员',
  AUDITOR: '审核员'
}

export async function loginApi({ username, password, captchaId, captchaCode }) {
  const response = await request.post('/v1/auth/login', {
    username,
    password,
    captchaId,
    captchaCode
  })
  const data = response.data || {}
  return { token: data.accessToken }
}

export async function getUserInfoApi() {
  const response = await request.get('/v1/users/me')
  const data = response.data || {}
  return {
    id: data.userId || '',
    username: data.username,
    name: data.name || data.username,
    no: data.userNo || '',
    dept: data.deptName || '',
    roles: (data.roles || []).map((role) => ROLE_LABELS[role] || role),
    permissions: data.permissions || []
  }
}

/** 获取图形验证码：返回 { captchaId, imageBase64, expiresIn } */
export async function getCaptchaApi() {
  const response = await request.get('/v1/auth/captcha')
  return response.data || {}
}

/** 学生自助注册，成功后默认获得 STUDENT 角色 */
export async function registerApi(payload) {
  await request.post('/v1/auth/register', payload)
}

/** 注册前发送邮箱验证码（需先通过图形验证码） */
export async function sendRegisterCodeApi(payload) {
  const response = await request.post('/v1/auth/register-code', payload)
  return response.data || {}
}

/** 忘记密码：发送验证码（channel=email 走邮箱，channel=sms 走短信） */
export async function sendResetCodeApi(payload) {
  const response = await request.post('/v1/auth/password/reset-code', payload)
  return response.data || {}
}

/** 忘记密码：校验验证码并重置密码（channel 需与发送时一致） */
export async function resetPasswordApi(payload) {
  await request.post('/v1/auth/password/reset', payload)
}

/** 扫码登录：生成二维码，返回 { ticketId, imageBase64, expiresIn } */
export async function createQrLoginApi() {
  const response = await request.post('/v1/auth/qr/create')
  return response.data || {}
}

/** 扫码登录：轮询状态，返回 { status, login } */
export async function getQrStatusApi(ticketId) {
  const response = await request.get(`/v1/auth/qr/status/${ticketId}`)
  return response.data || {}
}

/** 扫码登录：手机端确认登录 */
export async function confirmQrLoginApi(payload) {
  const response = await request.post('/v1/auth/qr/confirm', payload)
  return response.data || {}
}

/** 扫码登录：手机端已登录时一键确认（自动携带本机令牌） */
export async function confirmQrLoginByTokenApi(ticketId) {
  await request.post('/v1/auth/qr/confirm-token', { ticketId })
}

/** SSO 票据兑换令牌：用授权码(code)换本地 JWT，返回 { token, type, enabled, tip } */
export async function ssoExchangeApi({ code, redirectUri, state }) {
  const response = await request.post('/v1/auth/sso/exchange', {
    ticket: code,
    redirectUri,
    state
  })
  const data = response.data || {}
  return {
    token: data.accessToken,
    refreshToken: data.refreshToken,
    type: data.type,
    enabled: data.enabled,
    tip: data.tip
  }
}

/**
 * 获取 SSO 登录跳转地址。
 * 返回 { loginUrl, type, enabled, tip }
 * enabled=false 时表示未配置 SSO，可隐藏 SSO 登录按钮或显示提示
 */
export async function getSsoLoginUrlApi(redirectUri) {
  const response = await request.get('/v1/auth/sso/login-url', {
    params: { redirectUri }
  })
  const data = response.data || {}
  return {
    loginUrl: data.loginUrl,
    type: data.type,
    enabled: data.enabled,
    tip: data.tip
  }
}
