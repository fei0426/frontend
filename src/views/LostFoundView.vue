<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Box,
  Briefcase,
  ChatDotRound,
  Clock,
  Headset,
  Key,
  Location,
  Plus,
  Postcard,
  Refresh,
  Search,
  UploadFilled,
  View
} from '@element-plus/icons-vue'

import {
  claimLostItem,
  createLostItem,
  listLostItems,
  lostCategoryOptions
} from '../api/lostfound'

const router = useRouter()
const activeTab = ref('found')
const keyword = ref('')
const categoryCode = ref(null)
const place = ref('')
const loading = ref(false)
const items = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(12)
const dialogVisible = ref(false)
const submitting = ref(false)
const uploadFiles = ref([])

const categoryIcons = {
  1: Postcard,
  2: Headset,
  3: Box,
  4: Box,
  5: Briefcase,
  6: Key
}

const form = reactive({
  title: '',
  categoryCode: null,
  place: '',
  happenDate: '',
  description: '',
  contact: ''
})

const placeOptions = computed(() =>
  [...new Set(items.value.map((item) => item.place).filter(Boolean))]
)

watch([activeTab, categoryCode, place], () => {
  page.value = 1
  fetchList()
})

onMounted(fetchList)

async function fetchList() {
  loading.value = true
  try {
    const data = await listLostItems({
      type: activeTab.value,
      keyword: keyword.value.trim() || undefined,
      categoryCode: categoryCode.value || undefined,
      place: place.value || undefined,
      page: page.value,
      size: size.value
    })
    items.value = data.list || []
    total.value = data.total || 0
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  fetchList()
}

function resetFilters() {
  keyword.value = ''
  categoryCode.value = null
  place.value = ''
  page.value = 1
  fetchList()
}

function openDetail(item) {
  router.push(`/lostfound/${item.id}`)
}

function openPublish() {
  Object.assign(form, {
    title: '',
    categoryCode: null,
    place: '',
    happenDate: '',
    description: '',
    contact: ''
  })
  uploadFiles.value = []
  dialogVisible.value = true
}

function statusClass(status) {
  return status === 1 ? 'is-seeking' : 'is-done'
}

function formatDate(value) {
  return value || '-'
}

async function submitPublish() {
  if (!form.title.trim() || !form.place.trim()) {
    ElMessage.warning('请填写标题和地点')
    return
  }
  if (!form.categoryCode) {
    ElMessage.warning('请选择物品分类')
    return
  }
  if (!form.happenDate) {
    ElMessage.warning('请选择日期')
    return
  }
  if (uploadFiles.value.length > 3) {
    ElMessage.warning('最多上传 3 张图片')
    return
  }

  const data = new FormData()
  data.append('itemType', activeTab.value)
  data.append('title', form.title.trim())
  data.append('categoryCode', form.categoryCode)
  data.append('place', form.place.trim())
  data.append('happenDate', form.happenDate)
  data.append('description', form.description || '')
  data.append('contact', form.contact || '')
  uploadFiles.value.forEach((file) => {
    if (file.raw) data.append('images', file.raw)
  })

  submitting.value = true
  try {
    const detail = await createLostItem(data)
    dialogVisible.value = false
    ElMessage.success('发布成功')
    router.push(`/lostfound/${detail.id}`)
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    submitting.value = false
  }
}

async function handleClaim(item) {
  try {
    await ElMessageBox.confirm('确认该物品已经找到吗？', '标记状态', {
      type: 'warning'
    })
  } catch {
    return
  }
  try {
    const updated = await claimLostItem(item.id)
    const index = items.value.findIndex((row) => row.id === item.id)
    if (index >= 0) items.value[index] = updated
    ElMessage.success('已标记为找到')
  } catch (error) {
    ElMessage.error(error.message)
  }
}
</script>

<template>
  <div class="lostfound">
    <header class="page-head">
      <div>
        <h1 class="page-title">失物招领</h1>
        <p class="page-desc">
          发布和查找校园遗失物品，所有信息保存在数据库中，可跨账号查看。
        </p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openPublish">
        发布信息
      </el-button>
    </header>

    <section class="lf-body">
      <el-tabs v-model="activeTab" class="lf-tabs">
        <el-tab-pane label="失物招领" name="found" />
        <el-tab-pane label="寻物启事" name="lost" />
      </el-tabs>

      <div class="lf-filters">
        <el-input
          v-model="keyword"
          :prefix-icon="Search"
          placeholder="搜索物品名称、描述、地点"
          clearable
          class="lf-search"
          @keyup.enter="search"
        />

        <div class="lf-filters-right">
          <el-select
            v-model="categoryCode"
            placeholder="全部类型"
            clearable
            class="lf-select"
          >
            <el-option
              v-for="category in lostCategoryOptions"
              :key="category.code"
              :label="category.label"
              :value="category.code"
            />
          </el-select>

          <el-select v-model="place" placeholder="全部地点" clearable class="lf-select">
            <el-option v-for="name in placeOptions" :key="name" :label="name" :value="name" />
          </el-select>

          <el-button :icon="Search" type="primary" @click="search">搜索</el-button>
          <el-button :icon="Refresh" @click="resetFilters">重置</el-button>
        </div>
      </div>

      <div v-loading="loading">
        <el-empty v-if="!loading && !items.length" description="暂时没有相关信息" />

        <div v-else class="lf-grid">
          <article
            v-for="item in items"
            :key="item.id"
            class="lf-card"
            @click="openDetail(item)"
          >
            <div class="lf-cover" :class="'category-' + item.categoryCode">
              <img v-if="item.images?.length" :src="item.images[0]" :alt="item.title" />
              <el-icon v-else class="lf-cover-icon">
                <component :is="categoryIcons[item.categoryCode] || Box" />
              </el-icon>

              <span class="lf-status" :class="statusClass(item.status)">
                {{ item.statusName }}
              </span>

              <span class="lf-views">
                <el-icon><View /></el-icon>{{ item.viewCount }}
              </span>
            </div>

            <div class="lf-card-body">
              <h3 class="lf-card-title">{{ item.title }}</h3>
              <span class="lf-category">{{ item.categoryName }}</span>

              <div class="lf-meta">
                <span class="lf-meta-row">
                  <el-icon><Location /></el-icon>{{ item.place }}
                </span>
                <span class="lf-meta-row">
                  <el-icon><Clock /></el-icon>{{ formatDate(item.happenDate) }}
                </span>
              </div>

              <p class="lf-desc">{{ item.description || '暂无补充描述' }}</p>

              <div class="lf-card-foot">
                <span>发布者：{{ item.publisher }}</span>
                <span class="lf-foot-right">
                  <el-button
                    v-if="item.mine && item.status === 1"
                    link
                    type="primary"
                    size="small"
                    @click.stop="handleClaim(item)"
                  >
                    标记已找到
                  </el-button>
                  <span class="lf-comments">
                    <el-icon><ChatDotRound /></el-icon>{{ item.commentCount }}
                  </span>
                </span>
              </div>
            </div>
          </article>
        </div>
      </div>

      <el-pagination
        v-if="total > size"
        v-model:current-page="page"
        :page-size="size"
        :total="total"
        layout="prev, pager, next, total"
        class="lf-pagination"
        @current-change="fetchList"
      />
    </section>

    <el-dialog
      v-model="dialogVisible"
      title="发布失物招领"
      width="620px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-position="top">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" maxlength="128" show-word-limit />
        </el-form-item>
        <div class="publish-grid">
          <el-form-item label="分类" required>
            <el-select v-model="form.categoryCode" placeholder="请选择分类">
              <el-option
                v-for="category in lostCategoryOptions"
                :key="category.code"
                :label="category.label"
                :value="category.code"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="日期" required>
            <el-date-picker
              v-model="form.happenDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="选择日期"
            />
          </el-form-item>
        </div>
        <el-form-item label="地点" required>
          <el-input v-model="form.place" maxlength="128" />
        </el-form-item>
        <el-form-item label="详细描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="联系方式">
          <el-input v-model="form.contact" maxlength="64" />
        </el-form-item>
        <el-form-item label="图片">
          <el-upload
            v-model:file-list="uploadFiles"
            list-type="picture-card"
            :auto-upload="false"
            :limit="3"
            accept="image/jpeg,image/png,image/webp"
          >
            <el-icon><UploadFilled /></el-icon>
          </el-upload>
          <div class="lf-muted">最多 3 张，单张不超过 5MB，支持 JPG / PNG / WebP。</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitPublish">
          发布
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.lostfound {
  max-width: 1480px;
  margin: 0 auto;
}

.lf-body {
  padding: 18px 22px 24px;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-panel);
  background: var(--sp-surface);
}

.lf-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}

.lf-filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding: 14px;
  border: 1px solid var(--sp-border);
  border-radius: 10px;
  background: var(--sp-surface-soft);
}

.lf-search {
  width: 340px;
}

.lf-filters-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.lf-select {
  width: 150px;
}

.lf-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.lf-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--sp-border);
  border-radius: 12px;
  background: var(--sp-surface);
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background-color 160ms ease;
}

.lf-card:hover {
  border-color: var(--sp-primary);
  background: #fbfcfa;
}

.lf-cover {
  position: relative;
  display: flex;
  aspect-ratio: 4 / 3;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--sp-border);
  background: var(--sp-sage);
}

.lf-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lf-cover.category-1 { background: #dfe6ef; }
.lf-cover.category-2 { background: #e7e1ed; }
.lf-cover.category-3 { background: #eee4ce; }
.lf-cover.category-4 { background: #dce9e5; }
.lf-cover.category-5 { background: #dce7e1; }
.lf-cover.category-6 { background: #eee4ce; }

.lf-cover-icon {
  color: rgba(37, 69, 57, 0.55);
  font-size: 44px;
}

.lf-status {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 650;
}

.lf-status.is-seeking {
  background: #f7ead4;
  color: #8f5d24;
}

.lf-status.is-done {
  background: #dceee3;
  color: #2d6b52;
}

.lf-views {
  position: absolute;
  left: 13px;
  bottom: 12px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--sp-text);
  font-size: 11px;
  font-weight: 600;
}

.lf-card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 9px;
  padding: 16px 17px 17px;
}

.lf-card-title {
  margin: 0;
  color: var(--sp-ink);
  font-size: 16px;
  font-weight: 650;
}

.lf-category {
  align-self: flex-start;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--sp-sage);
  color: var(--sp-primary-strong);
  font-size: 10px;
  font-weight: 600;
}

.lf-meta {
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: var(--sp-muted);
  font-size: 12px;
}

.lf-meta-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.lf-desc {
  display: -webkit-box;
  min-height: 40px;
  margin: 0;
  overflow: hidden;
  color: var(--sp-muted);
  font-size: 12px;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.lf-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding-top: 13px;
  border-top: 1px solid #edf1ee;
  color: var(--sp-faint);
  font-size: 11px;
}

.lf-foot-right,
.lf-comments {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.lf-pagination {
  justify-content: flex-end;
  margin-top: 22px;
}

.publish-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.publish-grid :deep(.el-select),
.publish-grid :deep(.el-date-editor) {
  width: 100%;
}

.lf-muted {
  color: var(--sp-faint);
  font-size: 11px;
}

@media (max-width: 1280px) {
  .lf-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
