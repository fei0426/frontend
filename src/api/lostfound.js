import request from './request'

function unwrap(response) {
  if (!response || response.code !== 1) {
    throw new Error(response?.message || '请求失败')
  }
  return response.data
}

export const lostCategoryOptions = [
  { code: 1, label: '证件卡片' },
  { code: 2, label: '数码产品' },
  { code: 3, label: '衣物' },
  { code: 4, label: '其他' },
  { code: 5, label: '箱包类' },
  { code: 6, label: '钥匙' }
]

export async function listLostItems(params) {
  const response = await request.get('/lostfound/items', { params })
  return unwrap(response)
}

export async function getLostItem(id) {
  const response = await request.get(`/lostfound/items/${id}`)
  return unwrap(response)
}

export async function createLostItem(formData) {
  const response = await request.post('/lostfound/items', formData, {
    timeout: 0
  })
  return unwrap(response)
}

export async function claimLostItem(id) {
  const response = await request.post(`/lostfound/items/${id}/claim`)
  return unwrap(response)
}

export async function listLostComments(id, params = { page: 1, size: 20 }) {
  const response = await request.get(`/lostfound/items/${id}/comments`, { params })
  return unwrap(response)
}

export async function addLostComment(id, content) {
  const response = await request.post(`/lostfound/items/${id}/comments`, { content })
  return unwrap(response)
}

export async function deleteLostComment(commentId) {
  const response = await request.delete(`/lostfound/comments/${commentId}`)
  return unwrap(response)
}
