import request from './request'

function unwrap(res) {
  if (!res || res.code !== 1) throw new Error((res && res.message) || '请求失败')
  return res.data
}

/** 查询全部角色，供用户分配角色下拉框使用。 */
export async function getAllRoles() {
  const res = await request.get('/v1/roles/all')
  return unwrap(res)
}

export async function getRoleList({ pageNum = 1, pageSize = 10, keyword = '' } = {}) {
  const res = await request.get('/v1/roles', {
    params: {
      page: pageNum,
      size: pageSize,
      keyword: keyword || undefined
    }
  })
  return unwrap(res)
}

export async function getRoleDetail(roleId) {
  const res = await request.get(`/v1/roles/${roleId}`)
  return unwrap(res)
}

export async function createRole(payload) {
  const res = await request.post('/v1/roles', payload)
  return unwrap(res)
}

export async function updateRole(roleId, payload) {
  const res = await request.put(`/v1/roles/${roleId}`, payload)
  return unwrap(res)
}

export async function deleteRole(roleId) {
  const res = await request.delete(`/v1/roles/${roleId}`)
  return unwrap(res)
}

export async function getRolePermissionIds(roleId) {
  const res = await request.get(`/v1/roles/${roleId}/permissions`)
  return unwrap(res)
}

export async function saveRolePermissions(roleId, permIds) {
  const res = await request.put(`/v1/roles/${roleId}/permissions`, { permIds })
  return unwrap(res)
}
