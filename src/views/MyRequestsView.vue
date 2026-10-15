<script setup>
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('all')

// 模拟数据，接口就绪后替换为 GET /api/service/requests?scope=mine
const requests = ref([
  {
    id: 'RQ2026101401',
    name: '宿舍报修',
    submitAt: '2026-10-14 09:20',
    status: '处理中',
    fields: [
      { label: '故障地点', value: '3 号楼 201' },
      { label: '故障类型', value: '水电' },
      { label: '故障描述', value: '洗手池下水管漏水，地面有积水' }
    ],
    timeline: [
      { node: '提交申请', time: '2026-10-14 09:20', by: '张同学' },
      { node: '规则校验通过', time: '2026-10-14 09:21', by: '系统自动校验' },
      { node: '审批通过', time: '2026-10-14 10:05', by: '李老师', note: '同意，转后勤处理' },
      { node: '处理中', time: '2026-10-14 11:30', by: '后勤保障处', note: '维修师傅已接单' }
    ]
  },
  {
    id: 'RQ2026101208',
    name: '在读证明开具',
    submitAt: '2026-10-12 15:40',
    status: '已完成',
    fields: [
      { label: '用途', value: '实习' },
      { label: '份数', value: '2' }
    ],
    timeline: [
      { node: '提交申请', time: '2026-10-12 15:40', by: '张同学' },
      { node: '审批通过', time: '2026-10-13 09:10', by: '学生工作处' },
      { node: '已完成', time: '2026-10-13 14:00', by: '学生工作处', note: '可到行政楼 102 领取' }
    ]
  },
  {
    id: 'RQ2026100903',
    name: '教室预约',
    submitAt: '2026-10-09 11:05',
    status: '待审批',
    fields: [
      { label: '预约教室', value: '第一教学楼 205' },
      { label: '使用日期', value: '2026-10-18' },
      { label: '活动内容', value: '班级团日活动' }
    ],
    timeline: [
      { node: '提交申请', time: '2026-10-09 11:05', by: '张同学' },
      { node: '规则校验通过', time: '2026-10-09 11:06', by: '系统自动校验' },
      { node: '待审批', time: '2026-10-09 11:06', by: '教务处', note: '等待管理员处理' }
    ]
  }
])

const statusType = {
  待审批: 'warning',
  处理中: 'primary',
  已完成: 'success',
  已驳回: 'danger',
  已撤销: 'info'
}

const filtered = computed(() => {
  if (activeTab.value === 'doing') {
    return requests.value.filter((r) => r.status === '待审批' || r.status === '处理中')
  }
  if (activeTab.value === 'done') {
    return requests.value.filter((r) => r.status === '已完成' || r.status === '已驳回')
  }
  return requests.value
})

const current = ref(null)
const drawerVisible = ref(false)

function openDetail(row) {
  current.value = row
  drawerVisible.value = true
}

async function handleCancel(row) {
  try {
    await ElMessageBox.confirm(`确定要撤销申请 ${row.id} 吗？`, '撤销确认', { type: 'warning' })
  } catch {
    return
  }
  row.status = '已撤销'
  row.timeline.push({ node: '已撤销', time: new Date().toLocaleString('zh-CN'), by: '张同学' })
  ElMessage.success('申请已撤销')
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h2 class="page-title">我的申请</h2>
        <p class="page-desc">查看自己提交的申请走到哪一步，进行中的可以撤销。</p>
      </div>
    </div>

    <div class="panel">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="进行中" name="doing" />
        <el-tab-pane label="已完成" name="done" />
      </el-tabs>

      <el-empty v-if="!filtered.length" description="这里还没有申请记录" />

      <el-table v-else :data="filtered" border>
        <el-table-column prop="id" label="申请编号" width="170" />
        <el-table-column prop="name" label="事项" width="150" />
        <el-table-column prop="submitAt" label="提交时间" width="170" />
        <el-table-column label="当前状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]" size="small" effect="plain">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看进度</el-button>
            <el-button
              v-if="row.status === '待审批'"
              link
              type="danger"
              @click="handleCancel(row)"
            >
              撤销
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-drawer v-model="drawerVisible" title="申请详情" size="520px">
      <template v-if="current">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="申请编号">{{ current.id }}</el-descriptions-item>
          <el-descriptions-item label="事项">{{ current.name }}</el-descriptions-item>
          <el-descriptions-item
            v-for="field in current.fields"
            :key="field.label"
            :label="field.label"
          >
            {{ field.value }}
          </el-descriptions-item>
        </el-descriptions>

        <h4 class="timeline-title">办理进度</h4>
        <el-timeline>
          <el-timeline-item
            v-for="(node, index) in current.timeline"
            :key="index"
            :timestamp="node.time"
            placement="top"
          >
            <div class="timeline-node">{{ node.node }}</div>
            <div class="muted">{{ node.by }}<template v-if="node.note"> · {{ node.note }}</template></div>
          </el-timeline-item>
        </el-timeline>

        <el-button
          v-if="current.status === '待审批'"
          type="danger"
          plain
          @click="handleCancel(current)"
        >
          撤销申请
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.timeline-title {
  margin: 24px 0 16px;
  font-size: 14px;
  font-weight: 500;
}

.timeline-node {
  font-size: 14px;
  margin-bottom: 2px;
}
</style>
