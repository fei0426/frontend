<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 模拟数据，接口就绪后替换为 GET /api/service/approvals?scope=todo
const todoList = ref([
  {
    id: 'RQ2026101405',
    name: '请假申请',
    applicant: '李同学',
    department: '计算机学院',
    submitAt: '2026-10-14 10:12',
    urgent: true,
    fields: [
      { label: '请假类型', value: '病假' },
      { label: '起止日期', value: '2026-10-15 至 2026-10-17' },
      { label: '请假事由', value: '感冒发烧，需要居家休息' },
      { label: '证明材料', value: '门诊病历.pdf' }
    ]
  },
  {
    id: 'RQ2026101402',
    name: '宿舍报修',
    applicant: '王同学',
    department: '3 号楼',
    submitAt: '2026-10-14 08:55',
    urgent: false,
    fields: [
      { label: '故障地点', value: '3 号楼 412' },
      { label: '故障类型', value: '门窗' },
      { label: '故障描述', value: '阳台推拉门卡住，无法正常开关' }
    ]
  },
  {
    id: 'RQ2026101309',
    name: '体育场地预约',
    applicant: '篮球社',
    department: '社团联合会',
    submitAt: '2026-10-13 19:30',
    urgent: false,
    fields: [
      { label: '场地', value: '篮球场' },
      { label: '使用日期', value: '2026-10-20' },
      { label: '使用时段', value: '下午' },
      { label: '使用人数', value: '24' }
    ]
  }
])

const current = ref(null)
const drawerVisible = ref(false)
const opinion = ref('')

function openHandle(row) {
  current.value = row
  opinion.value = ''
  drawerVisible.value = true
}

async function decide(action) {
  const needOpinion = action !== 'agree'
  if (needOpinion && !opinion.value.trim()) {
    ElMessage.warning('请填写办理意见')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定对该工单执行「${actionLabel(action)}」吗？`,
      '操作确认',
      { type: 'warning' }
    )
  } catch {
    return
  }
  // 接口就绪后改成 POST /api/service/approvals/{id}/decide
  console.log('审批操作', { id: current.value.id, action, opinion: opinion.value })
  todoList.value = todoList.value.filter((item) => item.id !== current.value.id)
  drawerVisible.value = false
  ElMessage.success(`已${actionLabel(action)}`)
}

function actionLabel(action) {
  return { agree: '同意', reject: '驳回', return: '退回补充', transfer: '转派' }[action]
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h2 class="page-title">待办审批</h2>
        <p class="page-desc">需要你处理的申请，处理后会从这里移除。</p>
      </div>
      <el-tag type="warning" effect="plain">待处理 {{ todoList.length }} 条</el-tag>
    </div>

    <div class="panel">
      <el-empty v-if="!todoList.length" description="没有待处理的申请" />

      <el-table v-else :data="todoList" border>
        <el-table-column prop="id" label="申请编号" width="170" />
        <el-table-column prop="name" label="事项" width="140" />
        <el-table-column prop="applicant" label="申请人" width="110" />
        <el-table-column prop="department" label="院系 / 单位" width="150" />
        <el-table-column prop="submitAt" label="提交时间" width="170" />
        <el-table-column label="紧急" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.urgent" type="danger" size="small" effect="plain">加急</el-tag>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button link type="primary" @click="openHandle(row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-drawer v-model="drawerVisible" title="工单处理" size="560px">
      <template v-if="current">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="申请编号">{{ current.id }}</el-descriptions-item>
          <el-descriptions-item label="事项">{{ current.name }}</el-descriptions-item>
          <el-descriptions-item label="申请人">
            {{ current.applicant }} · {{ current.department }}
          </el-descriptions-item>
          <el-descriptions-item
            v-for="field in current.fields"
            :key="field.label"
            :label="field.label"
          >
            {{ field.value }}
          </el-descriptions-item>
        </el-descriptions>

        <h4 class="opinion-title">办理意见</h4>
        <el-input
          v-model="opinion"
          type="textarea"
          :rows="4"
          placeholder="同意时可不填，驳回、退回补充、转派时必须说明原因"
        />

        <div class="decision">
          <el-button type="success" @click="decide('agree')">同意</el-button>
          <el-button type="danger" @click="decide('reject')">驳回</el-button>
          <el-button @click="decide('return')">退回补充</el-button>
          <el-button @click="decide('transfer')">转派</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.opinion-title {
  margin: 24px 0 10px;
  font-size: 14px;
  font-weight: 500;
}

.decision {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 20px;
}
</style>
