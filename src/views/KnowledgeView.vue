<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Plus, Search, Upload } from '@element-plus/icons-vue'

const STORAGE_KEY = 'studypal_knowledge_docs_v1'

const defaultDocs = [
  {
    id: 1,
    title: '学生宿舍管理规定',
    category: '校园生活',
    status: '已发布',
    version: 'v1.2',
    tags: ['宿舍', '报修', '后勤'],
    content: '宿舍设施损坏可通过校园通提交报修，紧急水电问题请联系宿管值班室。',
    updatedAt: '2026-11-08 09:30'
  },
  {
    id: 2,
    title: '图书馆借阅与续借规则',
    category: '学习资源',
    status: '已发布',
    version: 'v1.1',
    tags: ['图书馆', '借阅', '续借'],
    content: '普通图书借期 30 天，未逾期且未被预约时可在线续借一次。',
    updatedAt: '2026-11-07 16:20'
  },
  {
    id: 3,
    title: '一卡通挂失与补卡流程',
    category: '校园服务',
    status: '审核中',
    version: 'v1.0',
    tags: ['一卡通', '挂失', '补卡'],
    content: '发现卡片遗失后应立即在校园通提交挂失，再到卡务中心办理补卡。',
    updatedAt: '2026-11-08 10:15'
  }
]

function loadDocs() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : defaultDocs
  } catch {
    return defaultDocs
  }
}

const docs = ref(loadDocs())
const keyword = ref('')
const category = ref('')
const status = ref('')
const dialogVisible = ref(false)
const detailVisible = ref(false)
const current = ref(null)
const formRef = ref(null)
const form = reactive({
  id: null,
  title: '',
  category: '校园服务',
  status: '草稿',
  version: 'v1.0',
  tagsText: '',
  content: ''
})

const categories = ['校园服务', '校园生活', '学习资源', '办事指南', '系统帮助']

const filtered = computed(() => {
  const kw = keyword.value.trim()
  return docs.value.filter((doc) => {
    const matchKeyword =
      !kw ||
      doc.title.includes(kw) ||
      doc.content.includes(kw) ||
      doc.tags.some((tag) => tag.includes(kw))
    return (
      matchKeyword &&
      (!category.value || doc.category === category.value) &&
      (!status.value || doc.status === status.value)
    )
  })
})

const stats = computed(() => ({
  total: docs.value.length,
  published: docs.value.filter((item) => item.status === '已发布').length,
  reviewing: docs.value.filter((item) => item.status === '审核中').length,
  draft: docs.value.filter((item) => item.status === '草稿').length
}))

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs.value))
}

function nowText() {
  return new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
}

function resetForm() {
  Object.assign(form, {
    id: null,
    title: '',
    category: '校园服务',
    status: '草稿',
    version: 'v1.0',
    tagsText: '',
    content: ''
  })
  formRef.value?.clearValidate()
}

function openCreate() {
  resetForm()
  dialogVisible.value = true
}

function openEdit(row) {
  Object.assign(form, {
    id: row.id,
    title: row.title,
    category: row.category,
    status: row.status,
    version: row.version,
    tagsText: row.tags.join('，'),
    content: row.content
  })
  dialogVisible.value = true
}

async function submitForm() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  const tags = form.tagsText
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean)
  if (form.id) {
    const index = docs.value.findIndex((item) => item.id === form.id)
    docs.value[index] = {
      ...docs.value[index],
      title: form.title,
      category: form.category,
      status: form.status,
      version: form.version,
      tags,
      content: form.content,
      updatedAt: nowText()
    }
    ElMessage.success('知识条目已更新')
  } else {
    docs.value.unshift({
      id: Date.now(),
      title: form.title,
      category: form.category,
      status: form.status,
      version: form.version,
      tags,
      content: form.content,
      updatedAt: nowText()
    })
    ElMessage.success('知识条目已创建')
  }
  persist()
  dialogVisible.value = false
}

function openDetail(row) {
  current.value = row
  detailVisible.value = true
}

function publish(row) {
  row.status = '已发布'
  row.updatedAt = nowText()
  persist()
  ElMessage.success('知识条目已发布')
}

async function remove(row) {
  try {
    await ElMessageBox.confirm(`确定删除“${row.title}”吗？`, '删除确认', {
      type: 'warning'
    })
  } catch {
    return
  }
  docs.value = docs.value.filter((item) => item.id !== row.id)
  persist()
  ElMessage.success('已删除')
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h2 class="page-title">知识库管理</h2>
        <p class="page-desc">维护智能问答使用的校园知识、审核状态和版本内容。</p>
      </div>
      <el-button
        v-permission="'qa:knowledge:add'"
        type="primary"
        :icon="Plus"
        @click="openCreate"
      >
        新增知识
      </el-button>
    </div>

    <div class="knowledge-stats">
      <div class="stat-block"><span>知识总数</span><b>{{ stats.total }}</b></div>
      <div class="stat-block"><span>已发布</span><b class="green">{{ stats.published }}</b></div>
      <div class="stat-block"><span>审核中</span><b class="orange">{{ stats.reviewing }}</b></div>
      <div class="stat-block"><span>草稿</span><b class="gray">{{ stats.draft }}</b></div>
    </div>

    <div class="panel">
      <div class="toolbar">
        <el-input
          v-model="keyword"
          :prefix-icon="Search"
          placeholder="搜索标题、内容或标签"
          clearable
          style="width: 260px"
        />
        <el-select v-model="category" placeholder="全部类别" clearable style="width: 150px">
          <el-option v-for="item in categories" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="status" placeholder="全部状态" clearable style="width: 130px">
          <el-option label="已发布" value="已发布" />
          <el-option label="审核中" value="审核中" />
          <el-option label="草稿" value="草稿" />
        </el-select>
        <span class="muted toolbar-right">共 {{ filtered.length }} 条</span>
      </div>

      <el-empty v-if="!filtered.length" description="没有匹配的知识条目" />

      <el-table v-else :data="filtered" border stripe>
        <el-table-column prop="title" label="知识标题" min-width="240">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">{{ row.title }}</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column label="标签" min-width="190">
          <template #default="{ row }">
            <el-tag v-for="tag in row.tags" :key="tag" size="small" effect="plain" class="tag">
              {{ tag }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.status === '已发布' ? 'success' : row.status === '审核中' ? 'warning' : 'info'"
              effect="plain"
            >
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="170" />
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <el-button
              v-permission="'qa:knowledge:edit'"
              link
              type="primary"
              :icon="Edit"
              @click="openEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="row.status !== '已发布'"
              v-permission="'qa:knowledge:publish'"
              link
              type="success"
              :icon="Upload"
              @click="publish(row)"
            >
              发布
            </el-button>
            <el-button
              v-permission="'qa:knowledge:delete'"
              link
              type="danger"
              :icon="Delete"
              @click="remove(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑知识' : '新增知识'"
      width="680px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        label-width="80px"
        :rules="{
          title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
          content: [{ required: true, message: '请输入知识内容', trigger: 'blur' }]
        }"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" style="width: 220px">
            <el-option v-for="item in categories" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本">
          <el-input v-model="form.version" style="width: 160px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="草稿">草稿</el-radio>
            <el-radio value="审核中">审核中</el-radio>
            <el-radio value="已发布">已发布</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="form.tagsText" placeholder="多个标签用逗号分隔" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="9" maxlength="5000" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="知识详情" size="520px">
      <template v-if="current">
        <h3 class="detail-title">{{ current.title }}</h3>
        <div class="detail-meta">
          {{ current.category }} · {{ current.version }} · {{ current.updatedAt }}
        </div>
        <div class="detail-tags">
          <el-tag v-for="tag in current.tags" :key="tag" effect="plain">{{ tag }}</el-tag>
        </div>
        <p class="detail-content">{{ current.content }}</p>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.knowledge-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}

.stat-block {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 16px 18px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  color: #6b7280;
  font-size: 13px;
}

.stat-block b {
  color: #1f2937;
  font-size: 24px;
}

.stat-block .green { color: #16a34a; }
.stat-block .orange { color: #d97706; }
.stat-block .gray { color: #64748b; }

.tag {
  margin-right: 5px;
}

.detail-title {
  margin: 0 0 8px;
  font-size: 18px;
}

.detail-meta {
  color: #909399;
  font-size: 13px;
}

.detail-tags {
  display: flex;
  gap: 8px;
  margin: 16px 0;
}

.detail-content {
  margin: 0;
  color: #303133;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
}

@media (max-width: 900px) {
  .knowledge-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
