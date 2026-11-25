
/**
 * 菜单项工厂。meta.permission 为空表示所有登录用户可见。
 * component 一律传懒加载函数，让每个页面单独打包，避免首屏把 20 个页面全部下载。
 */
// 说明：菜单图标统一用字符串名，真正的图标组件在 layout/BasicLayout.vue 里注册。
// 这样登录页不需要为了侧边栏图标而加载整个图标库（约 40KB gzip）。
function item(path, name, load, title, permission, icon) {
  return { path, name, component: load, meta: { title, permission, icon } }
}

/**
 * 侧边栏菜单树。带 children 的节点渲染成可折叠分组，其余渲染成单项。
 * 菜单和路由表共用这一份数据，避免两头维护对不上。
 */
export const menuTree = [
  item('/chat', 'chat', () => import('../views/ChatView.vue'), '智能问答', 'qa:chat:list', 'chat-dot-round'),
  {
    key: 'campus',
    title: '校园服务',
    icon: 'school',
    children: [
      item('/card', 'card', () => import('../views/CardView.vue'), '一卡通', 'campus:card:list', 'credit-card'),
      item('/library', 'library', () => import('../views/LibraryView.vue'), '图书馆', 'campus:library:list', 'reading'),
      item('/schedule', 'schedule', () => import('../views/ScheduleView.vue'), '日程课表', 'campus:schedule:list', 'calendar')
    ]
  },
  {
    key: 'service',
    title: '事务办理',
    icon: 'grid',
    children: [
      item('/services', 'services', () => import('../views/ServicesView.vue'), '服务事项', 'service:item:list', 'grid'),
      item('/my-requests', 'my-requests', () => import('../views/MyRequestsView.vue'), '我的申请', 'service:request:list', 'tickets'),
      item('/approvals', 'approvals', () => import('../views/ApprovalView.vue'), '待办审批', 'service:approval:list', 'checked')
    ]
  },
  {
    key: 'file',
    title: '文件中心',
    icon: 'upload-filled',
    children: [
      item('/files/upload', 'file-upload', () => import('../views/FileUploadView.vue'), '文件上传', 'file:storage:upload', 'upload-filled'),
      item('/files/download', 'file-download', () => import('../views/FileDownloadView.vue'), '文件下载', 'file:storage:download', 'download')
    ]
  },
  item('/lostfound', 'lostfound', () => import('../views/LostFoundView.vue'), '失物招领', 'lost:item:list', 'search'),
  item('/profile', 'profile', () => import('../views/ProfileView.vue'), '个人中心', '', 'user'),
  {
    key: 'admin',
    title: '管理后台',
    icon: 'setting',
    children: [
      item('/ops', 'ops', () => import('../views/OperationDashboardView.vue'), '运营分析', 'system:audit:view', 'data-analysis'),
      item('/users', 'users', () => import('../views/UserManageView.vue'), '用户管理', 'system:user:list', 'user'),
      item('/roles', 'roles', () => import('../views/RoleManageView.vue'), '角色管理', 'system:role:list', 'key'),
      item('/permissions', 'permissions', () => import('../views/PermissionManageView.vue'), '权限管理', 'system:permission:list', 'lock'),
      item('/audit-logs', 'audit-logs', () => import('../views/AuditLogView.vue'), '审计日志', 'system:audit:view', 'data-analysis'),
      item('/notices/manage', 'notice-manage', () => import('../views/NoticeManageView.vue'), '通知发布', 'notice:notice:publish', 'bell'),
      item('/knowledge', 'knowledge', () => import('../views/KnowledgeView.vue'), '知识库管理', 'qa:knowledge:list', 'grid')
    ]
  }
]

/**
 * 不出现在菜单里、但需要注册路由的页面。
 * 事项申请页从服务事项大厅点进来；通知公告改由右上角通知图标进入，都不进菜单。
 */
export const extraRoutes = [
  {
    path: '/services/:id/apply',
    name: 'service-apply',
    component: () => import('../views/ServiceApplyView.vue'),
    meta: { title: '事项申请', permission: 'service:request:submit' }
  },
  {
    path: '/notices',
    name: 'notices',
    component: () => import('../views/NoticeView.vue'),
    meta: { title: '通知公告', permission: 'notice:notice:list' }
  }
]

/** 把菜单树拍平成路由表 */
export const menuRoutes = menuTree.flatMap((node) =>
  node.children ? node.children : [node]
)
