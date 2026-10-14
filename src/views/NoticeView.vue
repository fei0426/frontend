<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

import { notices, markAllRead as markAllNoticesRead } from '../mock/notices'

const activeTab = ref('all')
const current = ref(null)
const drawerVisible = ref(false)

const unreadCount = computed(() => notices.filter((n) => n.unread).length)

const list = computed(() =>
  activeTab.value === 'unread' ? notices.filter((n) => n.unread) : notices
)

function openDetail(item) {
  current.value = item
  item.unread = false
  drawerVisible.value = true
}

function markAllRead() {
  markAllNoticesRead()
  ElMessage.success('已全部标记为已读')
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h2 class="page-title">通知公告</h2>
        <p class="page-desc">学校发布的通知，打开即视为已读。</p>
      </div>
      <el-button :disabled="!unreadCount" @click="markAllRead">全部标记已读</el-button>
    </div>

    <div class="panel">
      <el-tabs v-model="activeTab">
        <el-tab-pane name="all">
          <template #label>全部通知</template>
        </el-tab-pane>
        <el-tab-pane name="unread">
          <template #label>未读 {{ unreadCount }}</template>
        </el-tab-pane>
      </el-tabs>

      <el-empty v-if="!list.length" description="没有未读通知" />

      <ul v-else class="notice-list">
        <li v-for="item in list" :key="item.id" class="notice" @click="openDetail(item)">
          <div class="notice-main">
            <div class="notice-title">
              <span v-if="item.unread" class="unread-dot" />
              {{ item.title }}
            </div>
            <div class="muted">{{ item.publisher }} · {{ item.publishAt }}</div>
          </div>
          <el-tag size="small" type="info" effect="plain">{{ item.type }}</el-tag>
        </li>
      </ul>
    </div>

    <el-drawer v-model="drawerVisible" title="通知详情" size="560px">
      <template v-if="current">
        <h3 class="detail-title">{{ current.title }}</h3>
        <div class="muted detail-meta">
          {{ current.publisher }} · {{ current.publishAt }}
        </div>
        <p class="detail-content">{{ current.content }}</p>

        <template v-if="current.attachments.length">
          <h4 class="attachment-title">附件</h4>
          <ul class="attachment-list">
            <li v-for="file in current.attachments" :key="file">
              <el-button link type="primary">{{ file }}</el-button>
            </li>
          </ul>
        </template>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.notice-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid #f2f3f5;
  cursor: pointer;
}

.notice:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.notice:hover .notice-title {
  color: #409eff;
}

.notice-main {
  min-width: 0;
}

.notice-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  margin-bottom: 4px;
}

.unread-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f56c6c;
  flex: 0 0 6px;
}

.detail-title {
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 500;
  line-height: 1.5;
}

.detail-meta {
  padding-bottom: 16px;
  border-bottom: 1px solid #f2f3f5;
}

.detail-content {
  margin: 16px 0;
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
}

.attachment-title {
  margin: 20px 0 8px;
  font-size: 14px;
  font-weight: 500;
}

.attachment-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
