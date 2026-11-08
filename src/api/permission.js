import request from './request'

function unwrap(res) {
  if (!res || res.code !== 1) throw new Error((res && res.message) || '请求失败')
  return res.data
}

export async function getPermissionTree(type) {
  const res = await request.get('/v1/permissions', {
    params: { type: type || undefined }
  })
  return unwrap(res)
}

export async function getPermissionDetail(id) {
  const res = await request.get(`/v1/permissions/${id}`)
  return unwrap(res)
}

export async function createPermission(payload) {
  const res = await request.post('/v1/permissions', payload)
  return unwrap(res)
}

export async function updatePermission(payload) {
  const res = await request.put('/v1/permissions', payload)
  return unwrap(res)
}

export async function deletePermission(id) {
  const res = await request.delete(`/v1/permissions/${id}`)
  return unwrap(res)
}
