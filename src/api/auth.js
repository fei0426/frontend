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

/** 忘记密码：发送邮箱验证码 */
export async function sendResetCodeApi(payload) {
  const response = await request.post('/v1/auth/password/reset-code', payload)
  return response.data || {}
}

/** 忘记密码：校验邮箱验证码并重置密码 */
export async function resetPasswordApi(payload) {
  await request.post('/v1/auth/password/reset', payload)
}
