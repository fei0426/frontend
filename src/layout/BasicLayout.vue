<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Bell, Menu, School, SwitchButton, User } from '@element-plus/icons-vue'

import { useAuthStore } from '../stores/auth'
import { menuTree } from '../router/menu'
import { notices, markAllRead } from '../mock/notices'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const unreadCount = computed(() => notices.filter((item) => item.unread).length)
const pageTitle = computed(() => route.meta?.title || '工作台')
const authInitial = computed(() => (auth.name || '校园用户').trim().slice(0, 1))
const roleLabel = computed(() => auth.roles?.join(' / ') || '校园用户')

const noticeVisible = ref(false)
const mobileMenuOpen = ref(false)
const isMobile = ref(false)
let mediaQuery

function syncViewport(event) {
  isMobile.value = event.matches
  if (!event.matches) mobileMenuOpen.value = false
}

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 900px)')
  syncViewport(mediaQuery)
  mediaQuery.addEventListener('change', syncViewport)
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', syncViewport)
})

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

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '退出登录', {
      type: 'warning',
      confirmButtonText: '退出',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  auth.logout()
  router.push('/login')
}

function handleUserCommand(command) {
  if (command === 'profile') {
    router.push('/profile')
    return
  }
  if (command === 'logout') {
    handleLogout()
  }
}
</script>

<template>
  <el-container class="layout">
    <div v-if="isMobile && mobileMenuOpen" class="mobile-overlay" @click="mobileMenuOpen = false" />

    <el-aside
      width="244px"
      class="layout-aside"
      :class="{ 'is-mobile-open': mobileMenuOpen }"
    >
      <div class="layout-brand">
        <span class="layout-logo"><el-icon><School /></el-icon></span>
        <span class="layout-brand-copy">
          <strong>校园通</strong>
          <small>StudyPal Service Desk</small>
        </span>
      </div>

      <el-scrollbar class="layout-scroll">
        <el-menu
          :default-active="route.path"
          router
          class="layout-menu"
          @select="mobileMenuOpen = false"
        >
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

      <div class="layout-aside-foot">
        <span class="layout-status-dot" />
        <span>校园服务运行中</span>
      </div>
    </el-aside>

    <el-container class="layout-content">
      <el-header class="layout-header">
        <div class="header-left">
          <el-button
            v-if="isMobile"
            class="mobile-menu-button"
            :icon="Menu"
            text
            circle
            @click="mobileMenuOpen = !mobileMenuOpen"
          />
          <div class="layout-breadcrumb">
            <span>校园通</span>
            <i>/</i>
            <strong>{{ pageTitle }}</strong>
          </div>
        </div>

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

          <el-dropdown trigger="click" @command="handleUserCommand">
            <button class="layout-user-menu" type="button">
              <span class="layout-avatar">{{ authInitial }}</span>
              <span class="layout-user-copy">
                <strong>{{ auth.name || '校园用户' }}</strong>
                <small>{{ roleLabel }}</small>
              </span>
              <el-icon class="layout-user-arrow"><ArrowDown /></el-icon>
            </button>

            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile" :icon="User">
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="logout" :icon="SwitchButton" divided>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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
  background: var(--sp-canvas);
}

.layout-content {
  min-width: 0;
}

.layout-aside {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--sp-border);
  background: #f7f9f5;
  transition: transform 180ms ease;
}

.layout-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  height: 76px;
  flex: 0 0 76px;
  padding: 0 20px;
  border-bottom: 1px solid var(--sp-border);
}

.layout-logo {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  place-items: center;
  border-radius: 10px;
  background: var(--sp-primary);
  color: #fff;
  font-size: 19px;
  box-shadow: 0 5px 14px rgba(31, 107, 87, 0.18);
}

.layout-brand-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.layout-brand-copy strong {
  color: var(--sp-ink);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.2;
}

.layout-brand-copy small {
  color: var(--sp-muted);
  font-size: 10px;
  font-weight: 550;
  line-height: 1.2;
}

.layout-scroll {
  flex: 1;
  min-height: 0;
}

.layout-menu {
  border-right: none;
  padding: 10px 0 18px;
}

.layout-aside-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 16px 18px;
  padding: 11px 12px;
  border: 1px solid var(--sp-border);
  border-radius: 10px;
  background: var(--sp-surface);
  color: var(--sp-muted);
  font-size: 11px;
  font-weight: 550;
}

.layout-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--sp-primary);
  box-shadow: 0 0 0 3px rgba(31, 107, 87, 0.12);
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 64px;
  padding: 0 var(--sp-page-gutter);
  border-bottom: 1px solid var(--sp-border);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(12px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.layout-breadcrumb {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  color: var(--sp-faint);
  font-size: 12px;
  font-weight: 550;
}

.layout-breadcrumb i {
  color: #bdc7c0;
  font-style: normal;
}

.layout-breadcrumb strong {
  overflow: hidden;
  color: var(--sp-text);
  font-weight: 620;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-menu-button {
  display: none;
}

.layout-header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.layout-user-menu {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 7px 4px 4px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--sp-text);
  cursor: pointer;
  transition:
    background-color 160ms ease,
    border-color 160ms ease;
}

.layout-user-menu:hover {
  border-color: var(--sp-border);
  background: var(--sp-surface-soft);
}

.layout-avatar {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 50%;
  background: var(--sp-sage);
  color: var(--sp-primary-strong);
  font-size: 14px;
  font-weight: 700;
}

.layout-user-copy {
  display: grid;
  min-width: 90px;
  gap: 1px;
  text-align: left;
}

.layout-user-copy strong {
  color: var(--sp-ink);
  font-size: 13px;
  font-weight: 650;
}

.layout-user-copy small {
  max-width: 150px;
  overflow: hidden;
  color: var(--sp-muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layout-user-arrow {
  color: var(--sp-faint);
  font-size: 12px;
}

.layout-main {
  overflow: auto;
  background: var(--sp-canvas);
  padding: 26px var(--sp-page-gutter) 32px;
}

.mobile-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.38);
}

@media (max-width: 900px) {
  .layout-aside {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 1001;
    width: 244px !important;
    transform: translateX(-100%);
  }

  .layout-aside.is-mobile-open {
    transform: translateX(0);
  }

  .mobile-menu-button {
    display: inline-flex;
  }

  .layout-header {
    padding: 0 16px;
  }

  .layout-user-copy,
  .layout-user-arrow {
    display: none;
  }

  .layout-main {
    padding: 18px 16px 24px;
  }

  .layout-breadcrumb {
    overflow: hidden;
    max-width: 170px;
  }

  .layout-breadcrumb span,
  .layout-breadcrumb i {
    display: none;
  }
}
</style>

<style>
.notice-popover.el-popover {
  padding: 14px;
  border: 1px solid var(--sp-border);
  border-radius: 14px;
  box-shadow: var(--sp-shadow-float);
}

.notice-popover .notice-popover-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 4px 12px;
  border-bottom: 1px solid var(--sp-border);
}

.notice-popover .notice-popover-title {
  font-size: 15px;
  font-weight: 650;
}

.notice-popover .notice-list {
  max-height: 320px;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.notice-popover .notice-item {
  padding: 12px 6px;
  border-bottom: 1px solid #edf1ee;
  cursor: pointer;
}

.notice-popover .notice-item:hover {
  background: var(--sp-surface-soft);
}

.notice-popover .notice-item-title {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--sp-text);
  font-size: 13px;
  line-height: 1.55;
}

.notice-popover .notice-item.is-unread .notice-item-title {
  color: var(--sp-ink);
  font-weight: 600;
}

.notice-popover .notice-dot {
  width: 6px;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 50%;
  background: var(--sp-amber);
}

.notice-popover .notice-item-meta {
  margin-top: 5px;
  color: var(--sp-muted);
  font-size: 12px;
}

.notice-popover .notice-popover-foot {
  padding-top: 12px;
  border-top: 1px solid var(--sp-border);
  text-align: center;
}
</style>
