<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  DataAnalysis,
  Document,
  Refresh,
  Setting,
  Tickets,
  UserFilled
} from '@element-plus/icons-vue'

import { getOperationsSnapshot } from '../api/operations'

const router = useRouter()
const loading = ref(false)
const snapshot = ref({
  userCount: 0,
  roleCount: 0,
  serviceCount: 0,
  classroomCount: 0,
  dictCount: 0,
  auditTotal: 0,
  recentAudit: []
})

const stats = computed(() => [
  { label: '系统用户', value: snapshot.value.userCount, icon: UserFilled, tone: 'blue' },
  { label: '角色数量', value: snapshot.value.roleCount, icon: Setting, tone: 'cyan' },
  { label: '服务事项', value: snapshot.value.serviceCount, icon: Tickets, tone: 'green' },
  { label: '可用教室', value: snapshot.value.classroomCount, icon: Document, tone: 'orange' },
  { label: '审计记录', value: snapshot.value.auditTotal, icon: DataAnalysis, tone: 'rose' }
])

const maxValue = computed(() => Math.max(...stats.value.map((item) => item.value), 1))

async function load() {
  loading.value = true
  try {
    snapshot.value = await getOperationsSnapshot()
  } finally {
    loading.value = false
  }
}

function open(path) {
  router.push(path)
}

onMounted(load)
</script>

<template>
  <div v-loading="loading">
    <div class="page-head">
      <div>
        <h2 class="page-title">运营分析</h2>
        <p class="page-desc">汇总用户、角色、服务数据、教室资源和最近审计活动。</p>
      </div>
      <el-button :icon="Refresh" @click="load">刷新数据</el-button>
    </div>

    <div class="stats-grid">
      <div v-for="item in stats" :key="item.label" class="stat-card panel">
        <div class="stat-icon" :class="item.tone">
          <el-icon><component :is="item.icon" /></el-icon>
        </div>
        <div>
          <div class="stat-label">{{ item.label }}</div>
          <div class="stat-value">{{ item.value }}</div>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <section class="panel">
        <h3 class="panel-title">数据规模</h3>
        <div class="bars">
          <div v-for="item in stats" :key="item.label" class="bar-row">
            <span class="bar-label">{{ item.label }}</span>
            <div class="bar-track">
              <span
                class="bar-fill"
                :class="item.tone"
                :style="{ width: `${Math.max(6, (item.value / maxValue) * 100)}%` }"
              />
            </div>
            <span class="bar-value">{{ item.value }}</span>
          </div>
        </div>
      </section>

      <section class="panel">
        <h3 class="panel-title">快捷入口</h3>
        <div class="quick-grid">
          <button class="quick-item" @click="open('/users')">
            <el-icon><UserFilled /></el-icon>
            <span>用户管理</span>
          </button>
          <button class="quick-item" @click="open('/roles')">
            <el-icon><Setting /></el-icon>
            <span>角色授权</span>
          </button>
          <button class="quick-item" @click="open('/knowledge')">
            <el-icon><Document /></el-icon>
            <span>知识维护</span>
          </button>
          <button class="quick-item" @click="open('/audit-logs')">
            <el-icon><DataAnalysis /></el-icon>
            <span>审计日志</span>
          </button>
        </div>
      </section>
    </div>

    <section class="panel">
      <div class="section-head">
        <h3 class="panel-title">最近审计活动</h3>
        <el-button link type="primary" @click="open('/audit-logs')">查看全部</el-button>
      </div>
      <el-empty v-if="!snapshot.recentAudit.length" description="暂无审计数据" />
      <el-table v-else :data="snapshot.recentAudit" border>
        <el-table-column prop="operatorName" label="操作人" width="130" />
        <el-table-column prop="actionType" label="操作类型" width="150" />
        <el-table-column prop="targetType" label="目标类型" width="130" />
        <el-table-column prop="result" label="结果" width="90">
          <template #default="{ row }">
            <el-tag :type="row.result === 'SUCCESS' ? 'success' : 'danger'" effect="plain">
              {{ row.result === 'SUCCESS' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="发生时间" />
      </el-table>
    </section>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(150px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
}

.stat-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 8px;
  color: #fff;
  font-size: 20px;
}

.blue { background: #2563eb; }
.cyan { background: #0891b2; }
.green { background: #16a34a; }
.orange { background: #d97706; }
.rose { background: #be123c; }

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.bars {
  display: grid;
  gap: 14px;
}

.bar-row {
  display: grid;
  grid-template-columns: 90px 1fr 40px;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.bar-track {
  height: 10px;
  overflow: hidden;
  background: #eef2f7;
  border-radius: 5px;
}

.bar-fill {
  display: block;
  height: 100%;
  border-radius: 5px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.quick-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 52px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  color: #374151;
  cursor: pointer;
}

.quick-item:hover {
  border-color: #93c5fd;
  background: #eff6ff;
  color: #1d4ed8;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@media (max-width: 1000px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
