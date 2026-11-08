<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Bell, Plus, Refresh } from '@element-plus/icons-vue'

import { notices } from '../mock/notices'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const activeTab = ref('notices')
const dialogVisible = ref(false)
const formRef = ref(null)
const form = reactive({
  title: '',
  type: '通知',
  scope: 'ALL',
  sendMode: 'now',
  scheduleAt: '',
  content: ''
})

const deliveryRows = ref([
  {
    id: 'D20261108001',
    noticeTitle: '关于开展 2026 年秋季学期期中教学检查的通知',
    channel: '站内消息',
    target: '全体学生',
    status: '成功',
    sentAt: '2026-11-08 09:02'
  },
  {
    id: 'D20261108002',
    noticeTitle: '图书馆开放时间调整',
    channel: '短信提醒',
    target: '借阅逾期学生',
    status: '失败',
    retryCount: 2,
    sentAt: '2026-11-08 10:20'
  }
])

const scopes = [
  { label: '全体用户', value: 'ALL' },
  { label: '全体学生', value: 'STUDENT' },
  { label: '全体教师', value: 'TEACHER' },
  { label: '行政人员', value: 'STAFF' },
  { label: '指定院系', value: 'DEPT' }
]

const noticeRows = computed(() =>
  notices.map((item, index) => ({
    ...item,
    scope: item.scope || 'ALL',
    readCount: item.readCount ?? (item.unread ? 18 + index * 11 : 36 + index * 13),
    totalCount: item.totalCount || 120
  }))
)

const failedCount = computed(
  () => deliveryRows.value.filter((item) => item.status === '失败').length
)

function openPublish() {
  Object.assign(form, {
    title: '',
    type: '通知',
    scope: 'ALL',
    sendMode: 'now',
    scheduleAt: '',
    content: ''
  })
  dialogVisible.value = true
}

async function publish() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  notices.unshift({
    id: Date.now(),
    title: form.title,
    type: form.type,
    publisher: auth.name || '管理员',
    publishAt:
      form.sendMode === 'scheduled' && form.scheduleAt
        ? form.scheduleAt.replace('T', ' ')
        : new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    unread: true,
    content: form.content,
    attachments: [],
    scope: form.scope,
    readCount: 0,
    totalCount: form.scope === 'ALL' ? 1280 : 320
  })
  deliveryRows.value.unshift({
    id: `D${Date.now()}`,
    noticeTitle: form.title,
    channel: '站内消息',
    target: scopes.find((item) => item.value === form.scope)?.label || '全体用户',
    status: form.sendMode === 'scheduled' ? '待发送' : '成功',
    sentAt:
      form.sendMode === 'scheduled' && form.scheduleAt
        ? form.scheduleAt.replace('T', ' ')
        : new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
  })
  dialogVisible.value = false
  ElMessage.success(form.sendMode === 'scheduled' ? '通知已加入定时发送' : '通知已发布')
}

function retry(row) {
  row.status = '成功'
  row.retryCount = (row.retryCount || 0) + 1
  ElMessage.success('消息已重新发送')
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h2 class="page-title">通知发布管理</h2>
        <p class="page-desc">按用户范围发布通知，查看已读统计和消息投递状态。</p>
      </div>
      <el-button
        v-permission="'notice:notice:publish'"
        type="primary"
        :icon="Plus"
        @click="openPublish"
      >
        发布通知
      </el-button>
    </div>

    <div class="overview">
      <div class="panel metric">
        <div class="stat-label">通知总数</div>
        <div class="stat-value">{{ notices.length }}</div>
      </div>
      <div class="panel metric">
        <div class="stat-label">未读通知</div>
        <div class="stat-value">{{ notices.filter((item) => item.unread).length }}</div>
      </div>
      <div class="panel metric">
        <div class="stat-label">投递失败</div>
        <div class="stat-value danger">{{ failedCount }}</div>
      </div>
    </div>

    <div class="panel">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="已发布通知" name="notices">
          <el-table :data="noticeRows" border stripe>
            <el-table-column prop="title" label="通知标题" min-width="280" show-overflow-tooltip />
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column label="发布范围" width="120">
              <template #default="{ row }">
                {{ scopes.find((item) => item.value === row.scope)?.label || '全体用户' }}
              </template>
            </el-table-column>
            <el-table-column prop="publisher" label="发布人" width="120" />
            <el-table-column prop="publishAt" label="发布时间" width="170" />
            <el-table-column label="已读情况" width="190">
              <template #default="{ row }">
                <el-progress
                  :percentage="Math.round((row.readCount / row.totalCount) * 100)"
                  :stroke-width="8"
                />
                <span class="muted">{{ row.readCount }} / {{ row.totalCount }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane name="delivery">
          <template #label>
            消息投递
            <el-badge v-if="failedCount" :value="failedCount" class="tab-badge" />
          </template>
          <el-table :data="deliveryRows" border stripe>
            <el-table-column prop="id" label="投递编号" width="170" />
            <el-table-column prop="noticeTitle" label="关联通知" min-width="260" show-overflow-tooltip />
            <el-table-column prop="channel" label="渠道" width="110" />
            <el-table-column prop="target" label="发送范围" width="130" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="row.status === '成功' ? 'success' : row.status === '失败' ? 'danger' : 'info'"
                  effect="plain"
                >
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sentAt" label="时间" width="170" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === '失败'"
                  link
                  type="primary"
                  :icon="Refresh"
                  @click="retry(row)"
                >
                  重试
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog
      v-model="dialogVisible"
      title="发布通知"
      width="680px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        label-width="90px"
        :rules="{
          title: [{ required: true, message: '请输入通知标题', trigger: 'blur' }],
          content: [{ required: true, message: '请输入通知内容', trigger: 'blur' }]
        }"
      >
        <el-form-item label="通知标题" prop="title">
          <el-input v-model="form.title" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="通知类型">
          <el-select v-model="form.type" style="width: 180px">
            <el-option label="通知" value="通知" />
            <el-option label="公告" value="公告" />
            <el-option label="教学" value="教学" />
            <el-option label="服务" value="服务" />
          </el-select>
        </el-form-item>
        <el-form-item label="发布范围">
          <el-select v-model="form.scope" style="width: 220px">
            <el-option v-for="item in scopes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="发送方式">
          <el-radio-group v-model="form.sendMode">
            <el-radio value="now">立即发布</el-radio>
            <el-radio value="scheduled">定时发送</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.sendMode === 'scheduled'" label="发送时间">
          <el-date-picker
            v-model="form.scheduleAt"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            placeholder="选择发送时间"
          />
        </el-form-item>
        <el-form-item label="通知内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="8" maxlength="3000" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :icon="Bell" @click="publish">确认发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}

.metric {
  padding: 16px 20px;
}

.danger {
  color: #dc2626;
}

.tab-badge {
  margin-left: 5px;
}

@media (max-width: 780px) {
  .overview {
    grid-template-columns: 1fr;
  }
}
</style>
