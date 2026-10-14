<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell } from '@element-plus/icons-vue'

import { useAuthStore } from '../stores/auth'
import { menuTree } from '../router/menu'
import { notices, markAllRead } from '../mock/notices'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

// 未读数量跟着通知数据走，标记已读后角标会立刻减少
const unreadCount = computed(() => notices.filter((item) => item.unread).length)

const noticeVisible = ref(false)

/** 点一条就标为已读，弹窗保持打开，方便看出角标在减 */
function openNotice(item) {
  item.unread = false
}

function handleMarkAllRead() {
  markAllRead()
  ElMessage.success('已全部标记为已读')
}

function goAllNotices() {
  noticeVisible.value = false
  router.push('/notices')
}

/**
 * 菜单级权限控制。
 * 分组先过滤子项，子项全被过滤掉的分组整组不渲染，避免出现空分组。
 */
const visibleMenus = computed(() =>
  menuTree
    .map((node) => {
      if (!node.children) {
        return auth.hasPermission(node.meta?.permission) ? node : null
      }
      const children = node.children.filter((child) =>
        auth.hasPermission(child.meta?.permission)
      )
      return children.length ? { ...node, children } : null
    })
    .filter(Boolean)
)

const pageTitle = computed(() => route.meta?.title || '')

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
  <el-container class="layout">
    <el-aside width="220px" class="layout-aside">
      <div class="layout-brand">
        <span class="layout-logo">🎓</span>
        <span class="layout-brand-text">校园通</span>
      </div>

      <el-scrollbar class="layout-scroll">
        <el-menu :default-active="route.path" router class="layout-menu">
          <template v-for="node in visibleMenus" :key="node.key || node.path">
            <el-sub-menu v-if="node.children" :index="node.key">
              <template #title>
                <el-icon><component :is="node.icon" /></el-icon>
                <span>{{ node.title }}</span>
              </template>
              <el-menu-item
                v-for="child in node.children"
                :key="child.path"
                :index="child.path"
              >
                <el-icon><component :is="child.meta.icon" /></el-icon>
                <span>{{ child.meta.title }}</span>
              </el-menu-item>
            </el-sub-menu>

            <el-menu-item v-else :index="node.path">
              <el-icon><component :is="node.meta.icon" /></el-icon>
              <span>{{ node.meta.title }}</span>
            </el-menu-item>
          </template>
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <h1 class="layout-page-title">{{ pageTitle }}</h1>

        <div class="layout-header-right">
          <el-popover
            v-model:visible="noticeVisible"
            placement="bottom-end"
            :width="380"
            trigger="click"
            popper-class="notice-popover"
          >
            <template #reference>
              <el-badge :value="unreadCount" :hidden="!unreadCount" :max="99">
                <el-button :icon="Bell" text circle aria-label="通知公告" />
              </el-badge>
            </template>

            <div class="notice-popover-head">
              <span class="notice-popover-title">通知公告</span>
              <el-button
                link
                type="primary"
                :disabled="!unreadCount"
                @click="handleMarkAllRead"
              >
                全部已读
              </el-button>
            </div>

            <ul class="notice-list">
              <li
                v-for="item in notices"
                :key="item.id"
                class="notice-item"
                :class="{ 'is-unread': item.unread }"
                @click="openNotice(item)"
              >
                <div class="notice-item-title">
                  <span v-if="item.unread" class="notice-dot" />
                  {{ item.title }}
                </div>
                <div class="notice-item-meta">{{ item.publisher }} · {{ item.publishAt }}</div>
              </li>
            </ul>

            <div class="notice-popover-foot">
              <el-button link type="primary" @click="goAllNotices">查看全部通知</el-button>
            </div>
          </el-popover>

          <el-divider direction="vertical" />

          <el-tag
            v-for="role in auth.roles"
            :key="role"
            size="small"
            type="info"
            effect="plain"
          >
            {{ role }}
          </el-tag>
          <span class="layout-user">{{ auth.name }}</span>

          <el-button link type="primary" @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout {
  height: 100vh;
}

.layout-aside {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-right: 1px solid #e4e7ed;
}

.layout-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 60px;
  flex: 0 0 60px;
  padding: 0 18px;
  font-size: 16px;
  font-weight: 500;
  border-bottom: 1px solid #e4e7ed;
}

.layout-logo {
  font-size: 20px;
}

.layout-scroll {
  flex: 1;
  min-height: 0;
}

.layout-menu {
  border-right: none;
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 60px;
  background: #ffffff;
  border-bottom: 1px solid #e4e7ed;
}

.layout-page-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.layout-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.layout-user {
  font-size: 14px;
}

.layout-main {
  background: #f5f7fa;
  padding: 20px;
}
</style>

<style>
/*
  el-popover 的内容会被挂到 body 上，scoped 样式覆盖不到，
  所以用 popper-class 配一段全局样式。
*/
.notice-popover .notice-popover-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid #f2f3f5;
}

.notice-popover .notice-popover-title {
  font-size: 14px;
  font-weight: 500;
}

/* 消息多了可以滚动查看 */
.notice-popover .notice-list {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 320px;
  overflow-y: auto;
}

.notice-popover .notice-item {
  padding: 10px 6px;
  border-bottom: 1px solid #f7f8fa;
  cursor: pointer;
}

.notice-popover .notice-item:hover {
  background: #f5f7fa;
}

.notice-popover .notice-item-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  line-height: 1.5;
}

.notice-popover .notice-item.is-unread .notice-item-title {
  font-weight: 500;
}

.notice-popover .notice-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f56c6c;
  flex: 0 0 6px;
}

.notice-popover .notice-item-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.notice-popover .notice-popover-foot {
  padding-top: 8px;
  text-align: center;
  border-top: 1px solid #f2f3f5;
}
</style>
