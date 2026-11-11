<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'

import { getAuditLogDetail, getAuditLogs } from '../api/audit'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const query = reactive({
  pageNum: 1,
  pageSize: 20,
  operatorKeyword: '',
  actionType: '',
  result: '',
  timeRange: []
})

const drawerVisible = ref(false)
const detailLoading = ref(false)
const detail = ref(null)

async function fetchList() {
  loading.value = true
  try {
    const data = await getAuditLogs({
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      operatorKeyword: query.operatorKeyword,
      actionType: query.actionType,
      result: query.result,
      startTime: query.timeRange?.[0] || '',
      endTime: query.timeRange?.[1] || ''
    })
    list.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

function search() {
  query.pageNum = 1
  fetchList()
}

function reset() {
  Object.assign(query, {
    pageNum: 1,
    operatorKeyword: '',
    actionType: '',
    result: '',
    timeRange: []
  })
  fetchList()
}

async function openDetail(row) {
  drawerVisible.value = true
  detailLoading.value = true
  try {
    detail.value = await getAuditLogDetail(row.logId)
  } finally {
    detailLoading.value = false
  }
}

function resultTag(result) {
  return result === 'SUCCESS' ? 'success' : 'danger'
}

function resultText(result) {
  return result === 'SUCCESS' ? '成功' : '失败'
}

onMounted(fetchList)
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h2 class="page-title">审计日志</h2>
        <p class="page-desc">统一查看登录日志和关键操作记录，用于安全审计与问题追踪。</p>
      </div>
    </div>

    <div class="panel">
      <div class="toolbar">
        <el-input
          v-model="query.operatorKeyword"
          :prefix-icon="Search"
          placeholder="操作人账号或姓名"
          clearable
          style="width: 200px"
          @keyup.enter="search"
        />
        <el-input
          v-model="query.actionType"
          placeholder="操作类型，如 LOGIN"
          clearable
          style="width: 180px"
        />
        <el-select v-model="query.result" placeholder="全部结果" clearable style="width: 130px">
          <el-option label="成功" value="SUCCESS" />
          <el-option label="失败" value="FAIL" />
        </el-select>
        <el-date-picker
          v-model="query.timeRange"
          type="datetimerange"
          value-format="YYYY-MM-DDTHH:mm:ss"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          style="width: 360px"
        />
        <el-button type="primary" @click="search">查询</el-button>
        <el-button :icon="Refresh" @click="reset">重置</el-button>
      </div>

      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column prop="logId" label="日志编号" width="150" />
        <el-table-column prop="operatorName" label="操作人" width="120" />
        <el-table-column prop="actionType" label="操作类型" width="140" />
        <el-table-column prop="targetType" label="目标类型" width="120" />
        <el-table-column prop="targetId" label="目标编号" width="130" />
        <el-table-column label="结果" width="90">
          <template #default="{ row }">
            <el-tag :type="resultTag(row.result)" effect="plain">
              {{ resultText(row.result) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP 地址" width="135" />
        <el-table-column prop="createdAt" label="发生时间" min-width="175" />
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          :page-sizes="[20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          background
          @current-change="fetchList"
          @size-change="search"
        />
      </div>
    </div>

    <el-drawer v-model="drawerVisible" title="审计日志详情" size="560px">
      <div v-loading="detailLoading">
        <el-descriptions v-if="detail" :column="1" border>
          <el-descriptions-item label="日志编号">{{ detail.logId }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ detail.operatorName }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">{{ detail.actionType }}</el-descriptions-item>
          <el-descriptions-item label="目标">
            {{ detail.targetType }} {{ detail.targetId || '' }}
          </el-descriptions-item>
          <el-descriptions-item label="结果">{{ resultText(detail.result) }}</el-descriptions-item>
          <el-descriptions-item label="IP 地址">{{ detail.ip }}</el-descriptions-item>
          <el-descriptions-item label="发生时间">{{ detail.createdAt }}</el-descriptions-item>
        </el-descriptions>

        <h4 v-if="detail" class="detail-title">附加信息</h4>
        <pre v-if="detail" class="detail-json">{{ JSON.stringify(detail.detail || {}, null, 2) }}</pre>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.detail-title {
  margin: 24px 0 10px;
  font-size: 14px;
}

.detail-json {
  margin: 0;
  padding: 14px;
  overflow: auto;
  background: #f6f8fa;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #374151;
  font: 12px/1.6 Consolas, Monaco, monospace;
  white-space: pre-wrap;
}
</style>
