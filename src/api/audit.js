import request from './request'

function unwrap(res) {
  if (!res || res.code !== 1) throw new Error((res && res.message) || '请求失败')
  return res.data
}

export async function getAuditLogs({
  pageNum = 1,
  pageSize = 20,
  operatorKeyword = '',
  actionType = '',
  result = '',
  startTime = '',
  endTime = ''
} = {}) {
  const res = await request.get('/v1/audit-logs', {
    params: {
      page: pageNum,
      size: pageSize,
      operatorKeyword: operatorKeyword || undefined,
      actionType: actionType || undefined,
      result: result || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined
    }
  })
  return unwrap(res)
}

export async function getAuditLogDetail(logId) {
  const res = await request.get(`/v1/audit-logs/${logId}`)
  return unwrap(res)
}
