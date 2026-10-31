import request from './request'

/**
 * 认证接口：对接后端真实 JWT 认证（/api/v1/auth/login、/api/v1/users/me）。
 * 权限码命名规范：模块:资源:操作，与后端 sys_permission 表保持一致。
 */
const ROLE_LABELS = {
  STUDENT: '学生',
  TEACHER: '教师',
  ADMIN: '管理员',
  AUDITOR: '审核员'
}

export async function loginApi({ username, password }) {
  const response = await request.post('/v1/auth/login', { username, password })
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
