<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  ChatDotRound,
  Clock,
  Delete,
  Location,
  Promotion,
  View
} from '@element-plus/icons-vue'

import {
  addLostComment,
  claimLostItem,
  deleteLostComment,
  getLostItem,
  listLostComments
} from '../api/lostfound'

const route = useRoute()
const router = useRouter()
const item = ref(null)
const loading = ref(false)
const activeImage = ref('')
const comments = ref([])
const commentTotal = ref(0)
const commentPage = ref(1)
const commentSize = 20
const commentText = ref('')
const commentSubmitting = ref(false)

const commentPages = computed(() =>
  Math.max(1, Math.ceil(commentTotal.value / commentSize))
)

onMounted(load)

async function load() {
  loading.value = true
  try {
    item.value = await getLostItem(route.params.id)
    activeImage.value = item.value.images?.[0] || ''
    await loadComments(1)
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}

async function loadComments(page = commentPage.value) {
  try {
    const data = await listLostComments(route.params.id, {
      page,
      size: commentSize
    })
    comments.value = data.list || []
    commentTotal.value = data.total || 0
    commentPage.value = page
  } catch (error) {
    ElMessage.error(error.message)
  }
}

async function submitComment() {
  const content = commentText.value.trim()
  if (!content) {
    ElMessage.warning('请输入评论内容')
    return
  }
  commentSubmitting.value = true
  try {
    const created = await addLostComment(route.params.id, content)
    comments.value.unshift(created)
    commentTotal.value += 1
    item.value.commentCount = commentTotal.value
    commentText.value = ''
    ElMessage.success('评论已发表')
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    commentSubmitting.value = false
  }
}

async function removeComment(comment) {
  try {
    await ElMessageBox.confirm('确定删除这条评论吗？', '删除评论', {
      type: 'warning'
    })
  } catch {
    return
  }
  try {
    await deleteLostComment(comment.id)
    comments.value = comments.value.filter((row) => row.id !== comment.id)
    commentTotal.value = Math.max(0, commentTotal.value - 1)
    item.value.commentCount = commentTotal.value
    if (!comments.value.length && commentPage.value > 1) {
      await loadComments(commentPage.value - 1)
    }
    ElMessage.success('评论已删除')
  } catch (error) {
    ElMessage.error(error.message)
  }
}

async function markFound() {
  try {
    await ElMessageBox.confirm('确认该物品已经找到吗？', '标记状态', {
      type: 'warning'
    })
  } catch {
    return
  }
  try {
    item.value = await claimLostItem(item.value.id)
    ElMessage.success('已标记为找到')
  } catch (error) {
    ElMessage.error(error.message)
  }
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}
</script>

<template>
  <div v-loading="loading" class="detail-page">
    <header class="page-head detail-head">
      <div>
        <el-button :icon="ArrowLeft" link @click="router.push('/lostfound')">
          返回失物招领
        </el-button>
        <h1 class="page-title">{{ item?.title || '物品详情' }}</h1>
        <p v-if="item" class="page-desc">
          {{ item.categoryName }} · 发布于 {{ formatDateTime(item.createTime) }}
        </p>
      </div>
      <el-button
        v-if="item?.mine && item.status === 1"
        type="primary"
        :icon="Promotion"
        @click="markFound"
      >
        标记已找到
      </el-button>
    </header>

    <template v-if="item">
      <section class="detail-grid">
        <div class="detail-media panel">
          <div class="main-image" :class="'category-' + item.categoryCode">
            <img v-if="activeImage" :src="activeImage" :alt="item.title" />
            <span v-else>暂无图片</span>
            <span class="detail-status" :class="{ done: item.status !== 1 }">
              {{ item.statusName }}
            </span>
          </div>

          <div v-if="item.images.length > 1" class="thumbnails">
            <button
              v-for="image in item.images"
              :key="image"
              type="button"
              :class="{ active: image === activeImage }"
              @click="activeImage = image"
            >
              <img :src="image" alt="" />
            </button>
          </div>
        </div>

        <aside class="detail-info panel">
          <div class="detail-meta-list">
            <div>
              <span>物品分类</span>
              <strong>{{ item.categoryName }}</strong>
            </div>
            <div>
              <span><el-icon><Location /></el-icon>地点</span>
              <strong>{{ item.place }}</strong>
            </div>
            <div>
              <span><el-icon><Clock /></el-icon>日期</span>
              <strong>{{ item.happenDate }}</strong>
            </div>
            <div>
              <span><el-icon><View /></el-icon>浏览量</span>
              <strong>{{ item.viewCount }}</strong>
            </div>
          </div>

          <div class="description-block">
            <h2>物品描述</h2>
            <p>{{ item.description || '发布者暂未补充描述。' }}</p>
          </div>

          <div class="contact-block">
            <span>联系方式</span>
            <strong>{{ item.contact || '请通过评论区联系发布者' }}</strong>
          </div>

          <div class="publisher-block">
            <span class="publisher-avatar">{{ item.publisher?.slice(0, 1) }}</span>
            <div>
              <span>发布者</span>
              <strong>{{ item.publisher }}</strong>
            </div>
          </div>
        </aside>
      </section>

      <section class="comments-panel panel">
        <div class="section-head">
          <div>
            <h2 class="panel-title">评论</h2>
            <p class="comment-note">询问物品细节，或帮助失主确认信息。</p>
          </div>
          <span class="comment-total">
            <el-icon><ChatDotRound /></el-icon>{{ commentTotal }}
          </span>
        </div>

        <div class="comment-composer">
          <textarea
            v-model="commentText"
            maxlength="500"
            rows="3"
            placeholder="写下评论，最多 500 字"
          />
          <div class="composer-actions">
            <span>{{ commentText.length }} / 500</span>
            <el-button
              type="primary"
              :loading="commentSubmitting"
              @click="submitComment"
            >
              发表评论
            </el-button>
          </div>
        </div>

        <el-empty v-if="!comments.length" description="还没有评论，来留下第一条信息" />

        <ul v-else class="comment-list">
          <li v-for="comment in comments" :key="comment.id" class="comment-item">
            <span class="comment-avatar">{{ comment.userName?.slice(0, 1) }}</span>
            <div class="comment-content">
              <div class="comment-head">
                <strong>{{ comment.userName }}</strong>
                <span>{{ formatDateTime(comment.createTime) }}</span>
              </div>
              <p>{{ comment.content }}</p>
            </div>
            <el-button
              v-if="comment.mine"
              link
              type="danger"
              :icon="Delete"
              @click="removeComment(comment)"
            >
              删除
            </el-button>
          </li>
        </ul>

        <el-pagination
          v-if="commentTotal > commentSize"
          v-model:current-page="commentPage"
          :page-size="commentSize"
          :total="commentTotal"
          layout="prev, pager, next"
          class="comment-pagination"
          @current-change="loadComments"
        />
      </section>
    </template>
  </div>
</template>

<style scoped>
.detail-page {
  max-width: 1360px;
  margin: 0 auto;
}

.detail-head :deep(.el-button.is-link) {
  margin-bottom: 10px;
  color: var(--sp-muted);
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.75fr);
  gap: 20px;
}

.detail-media {
  padding: 16px;
}

.main-image {
  position: relative;
  display: flex;
  aspect-ratio: 16 / 10;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 10px;
  background: var(--sp-sage);
  color: var(--sp-muted);
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.main-image.category-1 { background: #dfe6ef; }
.main-image.category-2 { background: #e7e1ed; }
.main-image.category-3,
.main-image.category-6 { background: #eee4ce; }
.main-image.category-4 { background: #dce9e5; }
.main-image.category-5 { background: #dce7e1; }

.detail-status {
  position: absolute;
  top: 14px;
  right: 14px;
  padding: 5px 10px;
  border-radius: 999px;
  background: #f7ead4;
  color: #8f5d24;
  font-size: 11px;
  font-weight: 650;
}

.detail-status.done {
  background: #dceee3;
  color: #2d6b52;
}

.thumbnails {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.thumbnails button {
  width: 76px;
  height: 58px;
  overflow: hidden;
  border: 1px solid var(--sp-border);
  border-radius: 8px;
  background: var(--sp-surface);
  cursor: pointer;
}

.thumbnails button.active {
  border-color: var(--sp-primary);
  box-shadow: 0 0 0 2px rgba(31, 107, 87, 0.12);
}

.thumbnails img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-info {
  padding: 24px;
}

.detail-meta-list {
  display: grid;
  gap: 16px;
}

.detail-meta-list div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.detail-meta-list span,
.contact-block > span,
.publisher-block span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--sp-muted);
  font-size: 11px;
}

.detail-meta-list strong,
.contact-block strong,
.publisher-block strong {
  color: var(--sp-ink);
  font-size: 13px;
  font-weight: 620;
  text-align: right;
}

.description-block {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--sp-border);
}

.description-block h2 {
  margin: 0 0 10px;
  color: var(--sp-ink);
  font-size: 16px;
}

.description-block p {
  margin: 0;
  color: var(--sp-text);
  font-size: 13px;
  line-height: 1.8;
  white-space: pre-wrap;
}

.contact-block {
  display: grid;
  gap: 6px;
  margin-top: 20px;
  padding: 14px;
  border-radius: 9px;
  background: var(--sp-surface-soft);
}

.contact-block strong {
  text-align: left;
}

.publisher-block {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--sp-border);
}

.publisher-avatar,
.comment-avatar {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  place-items: center;
  border-radius: 50%;
  background: var(--sp-sage);
  color: var(--sp-primary-strong);
  font-weight: 700;
}

.publisher-block div {
  display: grid;
  gap: 3px;
}

.comments-panel {
  margin-top: 20px;
  padding: 24px;
}

.comment-note {
  margin: 4px 0 0;
  color: var(--sp-muted);
  font-size: 12px;
}

.comment-total {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--sp-muted);
  font-size: 12px;
}

.comment-composer {
  margin-bottom: 24px;
}

.comment-composer textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--sp-border);
  border-radius: 10px;
  background: var(--sp-surface-soft);
  color: var(--sp-text);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.7;
  outline: none;
  resize: vertical;
}

.comment-composer textarea:focus {
  border-color: var(--sp-primary);
  box-shadow: 0 0 0 3px rgba(31, 107, 87, 0.1);
}

.composer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}

.composer-actions > span {
  color: var(--sp-faint);
  font-size: 10px;
}

.comment-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.comment-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 0;
  border-top: 1px solid #edf1ee;
}

.comment-content {
  min-width: 0;
  flex: 1;
}

.comment-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.comment-head strong {
  color: var(--sp-ink);
  font-size: 12px;
}

.comment-head span {
  color: var(--sp-faint);
  font-size: 10px;
}

.comment-content p {
  margin: 7px 0 0;
  color: var(--sp-text);
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.comment-pagination {
  justify-content: flex-end;
  margin-top: 16px;
}

@media (max-width: 1180px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
