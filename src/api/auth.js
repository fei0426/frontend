import request from './request'

/**
 * 后端认证接口还没做好的时候，用下面的假数据先跑通前端流程。
 * 后端就绪后，把 USE_MOCK 改成 false 即可，其他代码不用动。
 */
export const USE_MOCK = true

/**
 * 权限码命名规范：模块:资源:操作
 * 这份表也是给后端同学的约定，两边必须一致。
 *
 * card:account:view       查看一卡通
 * card:library:view       查看图书馆
 * card:schedule:view      查看日程课表
 * service:item:list       查看服务事项目录
 * service:request:list    查看我提交的申请
 * service:request:submit  提交申请
 * service:approval:handle 处理审批（教师）
 * service:lost:list       浏览失物招领
 * notice:notice:view      查看通知公告
 *
 * 最后四个属于管理后台，为了保留权限对比效果暂时留在菜单里。
 */
export const MOCK_ACCOUNTS = {
  stu: {
    password: '123456',
    name: '张同学',
    no: '2023001',
    dept: '计算机学院 · 软件工程 2023 级',
    roles: ['学生'],
    permissions: [
      'qa:chat:use',
      'card:account:view',
      'card:library:view',
      'card:schedule:view',
      'service:item:list',
      'service:request:list',
      'service:request:submit',
      'service:lost:list',
      'notice:notice:view'
    ]
  },
  tea: {
    password: '123456',
    name: '李老师',
    no: 'T20180326',
    dept: '计算机学院 · 软件工程系',
    roles: ['教师'],
    permissions: [
      'qa:chat:use',
      'card:account:view',
      'card:library:view',
      'card:schedule:view',
      'service:item:list',
      'service:request:list',
      'service:request:submit',
      'service:approval:handle',
      'service:lost:list',
      'notice:notice:view',
      'qa:knowledge:list'
    ]
  },
  admin: {
    password: '123456',
    name: '王管理员',
    no: 'A0001',
    dept: '信息化建设办公室',
    roles: ['管理员'],
    permissions: [
      'qa:chat:use',
      'card:account:view',
      'card:library:view',
      'card:schedule:view',
      'service:item:list',
      'service:request:list',
      'service:request:submit',
      'service:approval:handle',
      'service:lost:list',
      'notice:notice:view',
      'qa:knowledge:list',
      'qa:knowledge:edit',
      'notice:notice:publish',
      'system:user:list',
      'system:role:assign'
    ]
  }
}

export async function loginApi({ username, password }) {
  if (USE_MOCK) {
    const account = MOCK_ACCOUNTS[username]
    if (!account || account.password !== password) {
      throw new Error('用户名或密码错误')
    }
    localStorage.setItem('rbac_mock_user', username)
    return { token: `mock-token-${username}` }
  }
  return request.post('/auth/login', { username, password })
}

export async function getUserInfoApi() {
  if (USE_MOCK) {
    const username = localStorage.getItem('rbac_mock_user')
    const account = MOCK_ACCOUNTS[username]
    if (!account) {
      throw new Error('登录状态已失效')
    }
    return {
      username,
      name: account.name,
      no: account.no,
      dept: account.dept,
      roles: account.roles,
      permissions: account.permissions
    }
  }
  return request.get('/auth/me')
}
