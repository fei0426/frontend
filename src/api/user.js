import request from './request'

function unwrap(res) {
  if (!res || res.code !== 1) throw new Error((res && res.message) || '请求失败')
  return res.data
}

/** 用户分页列表：后端使用 page/size，前端页面继续保留 pageNum/pageSize。 */
export async function getUserList({ pageNum = 1, pageSize = 10, keyword = '' } = {}) {
  const res = await request.get('/v1/users', {
    params: {
      page: pageNum,
      size: pageSize,
      keyword: keyword || undefined
    }
  })
  return unwrap(res)
}

export async function getUserDetail(userId) {
  const res = await request.get(`/v1/users/${userId}`)
  return unwrap(res)
}

/** 查询用户当前角色。后端详情返回 roles 编码数组，这里整理成页面需要的结构。 */
export async function getUserRole(userId) {
  const user = await getUserDetail(userId)
  const roles = user.roles || []
  return {
    roleCode: roles[0] || null,
    roles
  }
}

/** 重新分配用户角色：当前项目一个用户对应一个角色。 */
export async function assignUserRole(userId, roleCode) {
  const res = await request.put(`/v1/users/${userId}/roles`, {
    roleCodes: [roleCode]
  })
  return unwrap(res)
}
