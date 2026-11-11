import request from './request'
import { getAuditLogs } from './audit'
import { getRoleList } from './role'
import { getUserList } from './user'

function unwrap(res) {
  if (!res || res.code !== 1) throw new Error((res && res.message) || '请求失败')
  return res.data
}

async function getCommonList(path) {
  const res = await request.get(path)
  return unwrap(res)
}

export async function getOperationsSnapshot() {
  const results = await Promise.allSettled([
    getUserList({ pageNum: 1, pageSize: 1 }),
    getRoleList({ pageNum: 1, pageSize: 1 }),
    getAuditLogs({ pageNum: 1, pageSize: 5 }),
    getCommonList('/common/service-items'),
    getCommonList('/common/classrooms'),
    getCommonList('/dict/request_status')
  ])

  const value = (index) =>
    results[index].status === 'fulfilled' ? results[index].value : null

  const users = value(0)
  const roles = value(1)
  const audit = value(2)
  const services = value(3)
  const classrooms = value(4)
  const requestStatuses = value(5)

  return {
    userCount: users?.total || 0,
    roleCount: roles?.total || 0,
    serviceCount: services?.length || 0,
    classroomCount: classrooms?.length || 0,
    dictCount: requestStatuses?.length || 0,
    auditTotal: audit?.total || 0,
    recentAudit: audit?.list || []
  }
}
