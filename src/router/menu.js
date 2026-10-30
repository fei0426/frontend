import {
  Calendar,
  ChatDotRound,
  Checked,
  CreditCard,
  Download,
  Grid,
  Reading,
  School,
  Search,
  Setting,
  Tickets,
  UploadFilled,
  User
} from '@element-plus/icons-vue'

import ChatView from '../views/ChatView.vue'
import CardView from '../views/CardView.vue'
import LibraryView from '../views/LibraryView.vue'
import ScheduleView from '../views/ScheduleView.vue'
import ServicesView from '../views/ServicesView.vue'
import ServiceApplyView from '../views/ServiceApplyView.vue'
import MyRequestsView from '../views/MyRequestsView.vue'
import ApprovalView from '../views/ApprovalView.vue'
import LostFoundView from '../views/LostFoundView.vue'
import NoticeView from '../views/NoticeView.vue'
import ProfileView from '../views/ProfileView.vue'
import KnowledgeView from '../views/KnowledgeView.vue'
import UserManageView from '../views/UserManageView.vue'
import FileUploadView from '../views/FileUploadView.vue'
import FileDownloadView from '../views/FileDownloadView.vue'

/** 菜单项工厂。meta.permission 为空表示所有登录用户可见。 */
function item(path, name, component, title, permission, icon) {
  return { path, name, component, meta: { title, permission, icon } }
}

/**
 * 侧边栏菜单树。带 children 的节点渲染成可折叠分组，其余渲染成单项。
 * 菜单和路由表共用这一份数据，避免两头维护对不上。
 */
export const menuTree = [
  item('/chat', 'chat', ChatView, '智能问答', 'qa:chat:use', ChatDotRound),
  {
    key: 'campus',
    title: '校园服务',
    icon: School,
    children: [
      item('/card', 'card', CardView, '一卡通', 'card:account:view', CreditCard),
      item('/library', 'library', LibraryView, '图书馆', 'card:library:view', Reading),
      item('/schedule', 'schedule', ScheduleView, '日程课表', 'card:schedule:view', Calendar)
    ]
  },
  {
    key: 'service',
    title: '事务办理',
    icon: Grid,
    children: [
      item('/services', 'services', ServicesView, '服务事项', 'service:item:list', Grid),
      item('/my-requests', 'my-requests', MyRequestsView, '我的申请', 'service:request:list', Tickets),
      item('/approvals', 'approvals', ApprovalView, '待办审批', 'service:approval:handle', Checked)
    ]
  },
  {
    key: 'file',
    title: '文件中心',
    icon: UploadFilled,
    children: [
      item('/files/upload', 'file-upload', FileUploadView, '文件上传', '', UploadFilled),
      item('/files/download', 'file-download', FileDownloadView, '文件下载', '', Download)
    ]
  },
  item('/lostfound', 'lostfound', LostFoundView, '失物招领', 'service:lost:list', Search),
  item('/profile', 'profile', ProfileView, '个人中心', '', User),
  {
    key: 'admin',
    title: '管理后台',
    icon: Setting,
    children: [
      item('/knowledge', 'knowledge', KnowledgeView, '知识库管理', 'qa:knowledge:list', Grid),
      item('/users', 'users', UserManageView, '用户管理', 'system:user:list', User)
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
    component: ServiceApplyView,
    meta: { title: '事项申请', permission: 'service:request:submit' }
  },
  {
    path: '/notices',
    name: 'notices',
    component: NoticeView,
    meta: { title: '通知公告', permission: 'notice:notice:view' }
  }
]

/** 把菜单树拍平成路由表 */
export const menuRoutes = menuTree.flatMap((node) =>
  node.children ? node.children : [node]
)
