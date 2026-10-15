<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const activeTab = ref('search')
const keyword = ref('')

// 模拟数据，接口就绪后替换为 GET /api/library/books 和 GET /api/library/loans
const books = [
  { isbn: '9787115428028', title: '数据结构与算法分析', author: 'Mark Allen Weiss', location: '工学馆 3 排 A 架', available: true, total: 5, left: 2 },
  { isbn: '9787111213826', title: '深入理解计算机系统', author: 'Randal E. Bryant', location: '工学馆 4 排 B 架', available: true, total: 4, left: 1 },
  { isbn: '9787506365437', title: '活着', author: '余华', location: '文学馆 1 排 C 架', available: false, total: 6, left: 0 },
  { isbn: '9787115546081', title: '图解 HTTP', author: '上野宣', location: '工学馆 5 排 A 架', available: true, total: 3, left: 3 }
]

const loans = ref([
  { id: 'L20260923', title: '深入理解计算机系统', borrowAt: '2026-09-23', dueAt: '2026-10-23', renewable: true, overdue: false },
  { id: 'L20260910', title: '数据结构与算法分析', borrowAt: '2026-09-10', dueAt: '2026-10-10', renewable: false, overdue: true }
])

const history = [
  { id: 'L20260601', title: '计算机网络：自顶向下方法', borrowAt: '2026-06-01', returnAt: '2026-06-25' },
  { id: 'L20260412', title: '算法导论', borrowAt: '2026-04-12', returnAt: '2026-05-08' }
]

const result = computed(() => {
  const kw = keyword.value.trim()
  if (!kw) return books
  return books.filter(
    (b) => b.title.includes(kw) || b.author.includes(kw) || b.isbn.includes(kw)
  )
})

// 到期前 3 天提醒，对应需求 FR-LIB-03
const dueSoon = computed(() =>
  loans.value.filter((l) => !l.overdue && daysLeft(l.dueAt) <= 7)
)

function daysLeft(dueAt) {
  const diff = new Date(dueAt).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

function handleRenew(row) {
  ElMessage.success(`《${row.title}》已续借 30 天`)
  row.dueAt = '2026-11-22'
  row.renewable = false
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h2 class="page-title">图书馆</h2>
        <p class="page-desc">检索馆藏、查看借阅状态与到期时间，可在线续借。</p>
      </div>
    </div>

    <el-alert
      v-if="dueSoon.length"
      class="due-alert"
      type="warning"
      :closable="false"
      show-icon
      :title="`有 ${dueSoon.length} 本图书即将到期，请及时归还或续借`"
    />

    <div class="panel">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="馆藏检索" name="search">
          <div class="toolbar">
            <el-input
              v-model="keyword"
              :prefix-icon="Search"
              placeholder="搜索书名、作者或 ISBN"
              clearable
              style="width: 320px"
            />
          </div>

          <el-empty v-if="!result.length" description="没有找到匹配的图书" />

          <el-table v-else :data="result" border>
            <el-table-column prop="title" label="书名" min-width="200" />
            <el-table-column prop="author" label="作者" width="180" />
            <el-table-column prop="location" label="馆藏位置" width="160" />
            <el-table-column label="可借状态" width="150">
              <template #default="{ row }">
                <el-tag :type="row.available ? 'success' : 'info'" size="small" effect="plain">
                  {{ row.available ? `可借 ${row.left} / ${row.total}` : '已全部借出' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="当前借阅" name="loans">
          <el-table :data="loans" border>
            <el-table-column prop="title" label="书名" min-width="200" />
            <el-table-column prop="borrowAt" label="借出日期" width="130" />
            <el-table-column label="应还日期" width="180">
              <template #default="{ row }">
                {{ row.dueAt }}
                <el-tag v-if="row.overdue" type="danger" size="small" effect="plain">已逾期</el-tag>
                <el-tag
                  v-else-if="daysLeft(row.dueAt) <= 7"
                  type="warning"
                  size="small"
                  effect="plain"
                >
                  {{ daysLeft(row.dueAt) }} 天后到期
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="110">
              <template #default="{ row }">
                <el-button
                  v-if="row.renewable"
                  link
                  type="primary"
                  @click="handleRenew(row)"
                >
                  续借
                </el-button>
                <span v-else class="muted">不可续借</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="借阅历史" name="history">
          <el-table :data="history" border>
            <el-table-column prop="id" label="借阅编号" width="160" />
            <el-table-column prop="title" label="书名" min-width="200" />
            <el-table-column prop="borrowAt" label="借出日期" width="130" />
            <el-table-column prop="returnAt" label="归还日期" width="130" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style scoped>
.due-alert {
  margin-bottom: 16px;
}
</style>
