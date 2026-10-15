<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ChatDotRound,
  EditPen,
  Key,
  Search,
  SwitchButton,
  Tickets,
  User
} from '@element-plus/icons-vue'

import { useAuthStore } from '../stores/auth'
import { notices } from '../mock/notices'

const auth = useAuthStore()
const router = useRouter()

// 个人信息不再直接铺在页面上，改为按钮打开弹窗查看
const infoVisible = ref(false)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const today = new Date().toLocaleDateString('zh-CN', {
  month: 'long',
  day: 'numeric',
  weekday: 'long'
})

// 快捷入口按权限显示，学生和教师看到的按钮不一样
const shortcuts = [
  { label: '我要报修', path: '/services/repair/apply', permission: 'service:request:submit', icon: EditPen },
  { label: '智能问答', path: '/chat', permission: 'qa:chat:use', icon: ChatDotRound },
  { label: '我的申请', path: '/my-requests', permission: 'service:request:list', icon: Tickets },
  { label: '失物招领', path: '/lostfound', permission: 'service:lost:list', icon: Search }
]
const visibleShortcuts = computed(() =>
  shortcuts.filter((item) => auth.hasPermission(item.permission))
)

const canApprove = computed(() => auth.hasPermission('service:approval:handle'))

// 以下为模拟数据，接口就绪后替换
const myRequests = [
  { id: 'RQ2026101401', name: '宿舍报修', status: '处理中', time: '10-14 09:20' },
  { id: 'RQ2026101208', name: '在读证明开具', status: '已完成', time: '10-12 15:40' },
  { id: 'RQ2026100903', name: '教室预约', status: '待审批', time: '10-09 11:05' }
]

const pendingApprovals = [
  { id: 'RQ2026101405', name: '请假申请', from: '李同学 · 计算机学院', time: '10-14 10:12' },
  { id: 'RQ2026101402', name: '宿舍报修', from: '王同学 · 3 号楼', time: '10-14 08:55' },
  { id: 'RQ2026101309', name: '体育场地预约', from: '篮球社', time: '10-13 19:30' }
]

const latestNotices = computed(() => notices.slice(0, 3))

const statusType = {
  待审批: 'warning',
  处理中: 'primary',
  已完成: 'success',
  已驳回: 'danger',
  已撤销: 'info'
}

// 权限码按模块分组展示，方便对照菜单和按钮的变化
const permissionGroups = computed(() => {
  const groups = {}
  auth.permissions.forEach((code) => {
    const [module] = code.split(':')
    if (!groups[module]) groups[module] = []
    groups[module].push(code)
  })
  return groups
})

const moduleLabel = {
  qa: '智能问答',
  card: '校园服务',
  service: '事务办理',
  notice: '通知公告',
  system: '系统管理'
}

function handleChangePassword() {
  ElMessage.info('统一身份认证由学校提供，密码修改请前往学校认证平台')
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
  } catch {
    return
  }
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h2 class="page-title">个人中心</h2>
        <p class="page-desc">原来的工作台已经并入这里，账号资料改为按钮入口查看。</p>
      </div>
      <el-button :icon="User" @click="infoVisible = true">查看个人信息</el-button>
    </div>

    <div class="panel hello">
      <div>
        <div class="hello-title">{{ greeting }}，{{ auth.name }}</div>
        <div class="muted">{{ auth.roles.join(' / ') }} · {{ today }}</div>
      </div>
      <div class="hello-actions">
        <el-button
          v-for="item in visibleShortcuts"
          :key="item.path"
          :icon="item.icon"
          @click="router.push(item.path)"
        >
          {{ item.label }}
        </el-button>
      </div>
    </div>

    <div class="columns">
      <div class="panel">
        <div class="panel-head">
          <h3 class="panel-title">我的申请</h3>
          <el-button link type="primary" @click="router.push('/my-requests')">全部</el-button>
        </div>
        <ul class="row-list">
          <li v-for="item in myRequests" :key="item.id" class="row">
            <div class="row-main">
              <div class="row-title">{{ item.name }}</div>
              <div class="muted">{{ item.id }} · {{ item.time }}</div>
            </div>
            <el-tag :type="statusType[item.status]" size="small" effect="plain">
              {{ item.status }}
            </el-tag>
          </li>
        </ul>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h3 class="panel-title">最新通知</h3>
          <el-button link type="primary" @click="router.push('/notices')">全部</el-button>
        </div>
        <ul class="row-list">
          <li v-for="item in latestNotices" :key="item.id" class="row">
            <div class="row-main">
              <div class="row-title">
                <span v-if="item.unread" class="unread-dot" />
                {{ item.title }}
              </div>
              <div class="muted">{{ item.publishAt }}</div>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="canApprove" class="panel">
      <div class="panel-head">
        <h3 class="panel-title">待我审批</h3>
        <el-button link type="primary" @click="router.push('/approvals')">全部</el-button>
      </div>
      <ul class="row-list">
        <li v-for="item in pendingApprovals" :key="item.id" class="row">
          <div class="row-main">
            <div class="row-title">{{ item.name }}</div>
            <div class="muted">{{ item.from }} · {{ item.time }}</div>
          </div>
          <el-button size="small" type="primary" @click="router.push('/approvals')">
            去处理
          </el-button>
        </li>
      </ul>
    </div>

    <div class="panel">
      <h3 class="panel-title">我的权限</h3>
      <p class="muted permission-tip">
        下面是当前账号拿到的全部权限码，共 {{ auth.permissions.length }} 项。
        左侧菜单和页面上的按钮都按这些权限码显示。
      </p>

      <div v-for="(codes, module) in permissionGroups" :key="module" class="permission-group">
        <div class="permission-module">{{ moduleLabel[module] || module }}</div>
        <el-tag v-for="code in codes" :key="code" effect="plain" class="permission-tag">
          <span class="perm-code">{{ code }}</span>
        </el-tag>
      </div>
    </div>

    <div class="panel">
      <h3 class="panel-title">安全设置</h3>
      <div class="actions">
        <el-button :icon="Key" @click="handleChangePassword">修改密码</el-button>
        <el-button :icon="SwitchButton" type="danger" plain @click="handleLogout">
          退出登录
        </el-button>
      </div>
    </div>

    <el-dialog v-model="infoVisible" title="个人信息" width="520px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="姓名">{{ auth.name }}</el-descriptions-item>
        <el-descriptions-item label="账号">{{ auth.username }}</el-descriptions-item>
        <el-descriptions-item label="学号 / 工号">{{ auth.no || '—' }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ auth.roles.join(' / ') }}</el-descriptions-item>
        <el-descriptions-item label="院系 / 单位">{{ auth.dept || '—' }}</el-descriptions-item>
      </el-descriptions>
      <p class="muted info-tip">账号资料以学校统一身份认证为准，本系统不保存密码。</p>
      <template #footer>
        <el-button @click="infoVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.hello {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.hello-title {
  font-size: 18px;
  font-weight: 500;
}

.hello-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

/* 两列并排时不要触发全局的 .panel + .panel 上边距 */
.columns .panel + .panel {
  margin-top: 0;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.panel-head .panel-title {
  margin-bottom: 0;
}

.row-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f2f3f5;
}

.row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.row-main {
  min-width: 0;
}

.row-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  margin-bottom: 2px;
}

.unread-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f56c6c;
  flex: 0 0 6px;
}

.permission-tip {
  margin: 0 0 16px;
  line-height: 1.6;
}

.permission-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 0;
  border-bottom: 1px solid #f2f3f5;
}

.permission-group:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.permission-module {
  flex: 0 0 84px;
  font-size: 13px;
  color: #909399;
}

.permission-tag {
  font-family: Consolas, Monaco, monospace;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.info-tip {
  margin: 12px 0 0;
  line-height: 1.6;
}
</style>
