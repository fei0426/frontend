<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  Bell,
  ChatDotRound,
  Checked,
  Clock,
  Document,
  Location,
  Promotion,
  Reading,
  Tickets
} from '@element-plus/icons-vue'

import { useAuthStore } from '../stores/auth'
import { notices } from '../mock/notices'
import { serviceItems } from '../mock/services'
import { todayCourses } from '../mock/schedule'

const auth = useAuthStore()
const router = useRouter()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const todayText = new Intl.DateTimeFormat('zh-CN', {
  month: 'long',
  day: 'numeric',
  weekday: 'long'
}).format(new Date())

const unreadNotices = computed(() => notices.filter((item) => item.unread))

const tasks = [
  { id: 1, title: '宿舍报修', meta: '后勤保障处 · 处理中', status: '处理中', tone: 'warning' },
  { id: 2, title: '在读证明开具', meta: '学生工作处 · 已完成', status: '已完成', tone: 'success' },
  { id: 3, title: '教室预约', meta: '教务处 · 待审核', status: '待审核', tone: 'info' }
]

const quickServices = computed(() => {
  if (!auth.hasPermission('service:request:submit')) return []
  return serviceItems.slice(0, 4)
})

const serviceIcons = {
  repair: Promotion,
  'classroom-repair': Document,
  leave: Tickets,
  transcript: Reading,
  'classroom-book': Location,
  'sports-book': Checked
}

function iconForService(id) {
  return serviceIcons[id] || Tickets
}

function openService(item) {
  router.push(`/services/${item.id}/apply`)
}

function openChat() {
  router.push('/chat')
}
</script>

<template>
  <div class="home-page">
    <section class="home-intro">
      <div class="home-greeting">
        <p class="home-date">{{ todayText }}</p>
        <h1>{{ greeting }}，{{ auth.name || '同学' }}</h1>
        <p class="home-summary">
          今天有 <strong>{{ todayCourses.length }}</strong> 节课，
          <strong>{{ unreadNotices.length }}</strong> 条未读通知，
          还有 <strong>{{ tasks.length }}</strong> 项事项进度值得关注。
        </p>
      </div>

      <div class="home-overview" aria-label="今日概览">
        <div class="overview-item">
          <span>今日课程</span>
          <strong>{{ todayCourses.length }}</strong>
        </div>
        <div class="overview-item">
          <span>未读通知</span>
          <strong>{{ unreadNotices.length }}</strong>
        </div>
        <div class="overview-item">
          <span>进行中事项</span>
          <strong>{{ tasks.length }}</strong>
        </div>
      </div>
    </section>

    <section class="home-main">
      <article class="home-schedule panel">
        <div class="section-head">
          <div>
            <h2 class="panel-title">今日课程</h2>
            <p class="home-section-note">按时间梳理今天的校园节奏</p>
          </div>
          <el-button link type="primary" @click="router.push('/schedule')">
            完整课表
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>

        <ol class="course-timeline">
          <li
            v-for="course in todayCourses"
            :key="course.period"
            class="course-item"
            :class="`tone-${course.tone}`"
          >
            <div class="course-time">
              <strong>{{ course.time.slice(0, 5) }}</strong>
              <span>{{ course.period }}</span>
            </div>
            <div class="course-rail">
              <span class="course-dot" />
            </div>
            <div class="course-content">
              <div class="course-heading">
                <h3>{{ course.name }}</h3>
                <span>{{ course.room }}</span>
              </div>
              <p>{{ course.teacher }} · 提前 10 分钟到达教室</p>
            </div>
          </li>
        </ol>
      </article>

      <aside class="home-side">
        <section class="panel progress-panel">
          <div class="section-head">
            <h2 class="panel-title">事项进度</h2>
            <el-button link type="primary" @click="router.push('/my-requests')">
              全部
            </el-button>
          </div>

          <ul class="task-list">
            <li v-for="task in tasks" :key="task.id" class="task-item">
              <span class="task-marker" />
              <div class="task-copy">
                <strong>{{ task.title }}</strong>
                <small>{{ task.meta }}</small>
              </div>
              <el-tag :type="task.tone" effect="plain">{{ task.status }}</el-tag>
            </li>
          </ul>
        </section>

        <section class="panel notice-panel">
          <div class="section-head">
            <h2 class="panel-title">最新通知</h2>
            <el-button link type="primary" @click="router.push('/notices')">
              全部
            </el-button>
          </div>

          <ul class="notice-preview">
            <li
              v-for="notice in notices.slice(0, 3)"
              :key="notice.id"
              @click="router.push('/notices')"
            >
              <span class="notice-icon"><el-icon><Bell /></el-icon></span>
              <div>
                <strong>{{ notice.title }}</strong>
                <small>{{ notice.publisher }} · {{ notice.publishAt.slice(5) }}</small>
              </div>
              <span v-if="notice.unread" class="notice-unread" />
            </li>
          </ul>
        </section>
      </aside>
    </section>

    <section class="home-lower">
      <article v-if="quickServices.length" class="panel quick-panel">
        <div class="section-head">
          <div>
            <h2 class="panel-title">常用服务</h2>
            <p class="home-section-note">直接进入高频事项，减少查找步骤</p>
          </div>
          <el-button link type="primary" @click="router.push('/services')">
            服务大厅
          </el-button>
        </div>

        <div class="quick-grid">
          <button
            v-for="item in quickServices"
            :key="item.id"
            class="quick-item"
            type="button"
            @click="openService(item)"
          >
            <span class="quick-icon">
              <el-icon><component :is="iconForService(item.id)" /></el-icon>
            </span>
            <span class="quick-copy">
              <strong>{{ item.name }}</strong>
              <small>{{ item.department }} · {{ item.sla }}</small>
            </span>
            <el-icon class="quick-arrow"><ArrowRight /></el-icon>
          </button>
        </div>
      </article>

      <button class="ai-entry" type="button" @click="openChat">
        <span class="ai-mark"><el-icon><ChatDotRound /></el-icon></span>
        <span class="ai-copy">
          <small>校园通智能问答</small>
          <strong>有校园问题，直接问 StudyPal</strong>
          <span>支持办事流程、通知和校园服务查询</span>
        </span>
        <span class="ai-action">
          开始提问
          <el-icon><ArrowRight /></el-icon>
        </span>
      </button>
    </section>

    <section class="home-footnote">
      <el-icon><Clock /></el-icon>
      <span>课程、通知和事项状态已根据当前权限汇总展示</span>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  max-width: 1560px;
  margin: 0 auto;
}

.home-intro {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  padding: 10px 2px 28px;
}

.home-date {
  margin: 0 0 12px;
  color: var(--sp-primary);
  font-size: 12px;
  font-weight: 650;
}

.home-greeting h1 {
  margin: 0;
  color: var(--sp-ink);
  font-size: 34px;
  font-weight: 680;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.home-summary {
  max-width: 660px;
  margin: 12px 0 0;
  color: var(--sp-muted);
  font-size: 14px;
  line-height: 1.7;
}

.home-summary strong {
  color: var(--sp-ink);
  font-weight: 650;
}

.home-overview {
  display: flex;
  gap: 0;
  padding: 8px 0;
  border-top: 1px solid var(--sp-border);
  border-bottom: 1px solid var(--sp-border);
}

.overview-item {
  min-width: 126px;
  padding: 2px 22px;
  border-left: 1px solid var(--sp-border);
}

.overview-item:first-child {
  border-left: 0;
}

.overview-item span {
  display: block;
  color: var(--sp-muted);
  font-size: 11px;
  font-weight: 550;
}

.overview-item strong {
  display: block;
  margin-top: 4px;
  color: var(--sp-ink);
  font-size: 24px;
  font-weight: 680;
  line-height: 1;
}

.home-main {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(330px, 0.75fr);
  gap: 20px;
}

.home-schedule,
.progress-panel,
.notice-panel,
.quick-panel {
  padding: 22px;
}

.home-section-note {
  margin: 4px 0 0;
  color: var(--sp-muted);
  font-size: 12px;
}

.course-timeline {
  margin: 0;
  padding: 2px 0;
  list-style: none;
}

.course-item {
  display: grid;
  grid-template-columns: 92px 22px minmax(0, 1fr);
  min-height: 92px;
}

.course-time {
  padding-top: 3px;
  text-align: right;
}

.course-time strong {
  display: block;
  color: var(--sp-ink);
  font-size: 14px;
  font-weight: 650;
}

.course-time span {
  display: block;
  margin-top: 3px;
  color: var(--sp-muted);
  font-size: 11px;
}

.course-rail {
  position: relative;
  display: flex;
  justify-content: center;
}

.course-rail::before {
  position: absolute;
  top: 8px;
  bottom: 0;
  width: 1px;
  background: var(--sp-border);
  content: "";
}

.course-item:last-child .course-rail::before {
  display: none;
}

.course-dot {
  position: relative;
  z-index: 1;
  width: 9px;
  height: 9px;
  margin-top: 6px;
  border: 2px solid var(--sp-surface);
  border-radius: 50%;
  background: var(--sp-primary);
  box-shadow: 0 0 0 2px var(--sp-sage-strong);
}

.course-content {
  margin: 0 0 14px 8px;
  padding: 15px 17px;
  border: 1px solid var(--sp-border);
  border-radius: 10px;
  background: var(--sp-surface-soft);
}

.course-item.tone-blue .course-content {
  border-color: #d9e2ef;
  background: #f4f7fb;
}

.course-item.tone-amber .course-content {
  border-color: #eadfcb;
  background: #fbf8f1;
}

.course-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.course-heading h3 {
  margin: 0;
  color: var(--sp-ink);
  font-size: 15px;
  font-weight: 650;
}

.course-heading span {
  padding: 2px 7px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.78);
  color: var(--sp-muted);
  font-size: 11px;
  font-weight: 600;
}

.course-content p {
  margin: 6px 0 0;
  color: var(--sp-muted);
  font-size: 12px;
}

.home-side {
  display: grid;
  align-content: start;
  gap: 20px;
}

.task-list,
.notice-preview {
  margin: 0;
  padding: 0;
  list-style: none;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 0;
  border-bottom: 1px solid #edf1ee;
}

.task-item:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.task-marker {
  width: 5px;
  height: 28px;
  flex: 0 0 5px;
  border-radius: 4px;
  background: var(--sp-sage-strong);
}

.task-copy {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 3px;
}

.task-copy strong {
  color: var(--sp-ink);
  font-size: 13px;
  font-weight: 620;
}

.task-copy small {
  overflow: hidden;
  color: var(--sp-muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice-preview li {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid #edf1ee;
  cursor: pointer;
}

.notice-preview li:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.notice-icon {
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  place-items: center;
  border-radius: 8px;
  background: var(--sp-surface-tint);
  color: var(--sp-primary);
}

.notice-preview div {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.notice-preview strong {
  overflow: hidden;
  color: var(--sp-text);
  font-size: 12px;
  font-weight: 580;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice-preview small {
  color: var(--sp-muted);
  font-size: 10px;
}

.notice-unread {
  position: absolute;
  top: 15px;
  right: 2px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--sp-amber);
}

.home-lower {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(330px, 0.75fr);
  gap: 20px;
  margin-top: 20px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.quick-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 13px 14px;
  border: 1px solid var(--sp-border);
  border-radius: 10px;
  background: var(--sp-surface);
  color: var(--sp-text);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background-color 160ms ease;
}

.quick-item:hover {
  border-color: var(--sp-primary);
  background: var(--sp-surface-soft);
}

.quick-icon {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  place-items: center;
  border-radius: 9px;
  background: var(--sp-sage);
  color: var(--sp-primary-strong);
  font-size: 17px;
}

.quick-copy {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 3px;
}

.quick-copy strong {
  color: var(--sp-ink);
  font-size: 13px;
  font-weight: 620;
}

.quick-copy small {
  overflow: hidden;
  color: var(--sp-muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-arrow {
  color: var(--sp-faint);
  font-size: 13px;
}

.ai-entry {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 100%;
  gap: 16px;
  overflow: hidden;
  padding: 26px;
  border: 0;
  border-radius: var(--sp-radius-panel);
  background: var(--sp-ink);
  color: #fff;
  text-align: left;
  cursor: pointer;
}

.ai-entry::after {
  position: absolute;
  right: -36px;
  bottom: -58px;
  width: 180px;
  height: 180px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 50%;
  content: "";
}

.ai-mark {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  place-items: center;
  border-radius: 12px;
  background: var(--sp-primary);
  font-size: 21px;
}

.ai-copy {
  display: grid;
  flex: 1;
  gap: 4px;
}

.ai-copy small {
  color: #a8c7bb;
  font-size: 10px;
  font-weight: 650;
}

.ai-copy strong {
  color: #fff;
  font-size: 16px;
  font-weight: 650;
  line-height: 1.4;
}

.ai-copy span {
  color: rgba(255, 255, 255, 0.58);
  font-size: 11px;
}

.ai-action {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #d8e8df;
  font-size: 12px;
  font-weight: 650;
  white-space: nowrap;
}

.home-footnote {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 18px 2px 0;
  color: var(--sp-faint);
  font-size: 11px;
}

@media (max-width: 1280px) {
  .home-main,
  .home-lower {
    grid-template-columns: minmax(0, 1.45fr) minmax(300px, 0.75fr);
  }

  .overview-item {
    min-width: 104px;
    padding-inline: 16px;
  }
}
</style>
