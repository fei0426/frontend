<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
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
  View
} from '@element-plus/icons-vue'

import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const activeTab = ref('found')
const keyword = ref('')
const category = ref('')
const place = ref('')
const dialogVisible = ref(false)

/**
 * 分类对应的图标和封面底色。
 * 有真实照片时图片优先，没有照片就显示分类图标占位。
 */
const categoryMeta = {
  箱包类: { icon: Briefcase, tone: 'bag' },
  证件卡片: { icon: Postcard, tone: 'card' },
  数码产品: { icon: Headset, tone: 'digital' },
  钥匙: { icon: Key, tone: 'key' },
  其他: { icon: Box, tone: 'other' }
}

const categoryOptions = Object.keys(categoryMeta)

function catMeta(name) {
  return categoryMeta[name] || categoryMeta['其他']
}

// 模拟数据，接口就绪后替换为 GET /api/lostfound/items
const items = ref([
  {
    id: 1, type: 'found', title: '黑色双肩包', category: '箱包类',
    place: '图书馆二楼借阅区', date: '2026-10-11 16:38',
    desc: '物品成色较新，有轻微使用痕迹', publisher: '李同学',
    contact: '138****6621', status: '寻找中', views: 104, comments: 2, mine: true
  },
  {
    id: 2, type: 'found', title: '校园卡一张', category: '证件卡片',
    place: '宿舍区门口', date: '2026-10-11 15:53',
    desc: '物品内有重要个人物品，请失主尽快联系', publisher: '王同学',
    contact: '图书馆前台', status: '寻找中', views: 91, comments: 2, mine: false
  },
  {
    id: 3, type: 'found', title: 'AirPods Pro 耳机', category: '数码产品',
    place: '风味餐厅', date: '2026-10-11 07:21',
    desc: '物品放置在保安室/前台，请携带有效证件认领', publisher: '赵同学',
    contact: '159****8802', status: '寻找中', views: 16, comments: 8, mine: false
  },
  {
    id: 4, type: 'lost', title: '寻找一串钥匙', category: '钥匙',
    place: '教学楼A座305', date: '2026-10-10 18:02',
    desc: '钥匙扣上有蓝色小海豚挂件，拾到请与我联系', publisher: '周同学',
    contact: '137****4410', status: '寻找中', views: 63, comments: 4, mine: true
  },
  {
    id: 5, type: 'lost', title: '丢失蓝色保温杯', category: '其他',
    place: '体育馆看台', date: '2026-10-10 09:15',
    desc: '杯身有卡通贴纸，已在看台附近找回', publisher: '陈同学',
    contact: '186****2231', status: '已找到', views: 28, comments: 1, mine: false
  },
  {
    id: 6, type: 'lost', title: '寻找学生证', category: '证件卡片',
    place: '校医院门口', date: '2026-10-09 14:40',
    desc: '卡面姓名孙同学，拾到请交到学工办', publisher: '孙同学',
    contact: '135****9077', status: '寻找中', views: 45, comments: 3, mine: false
  }
])

const form = reactive({ title: '', category: '', place: '', date: '', desc: '', contact: '' })

function nowText() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

const placeOptions = computed(() => [...new Set(items.value.map((item) => item.place))])

const list = computed(() => {
  const kw = keyword.value.trim()
  return items.value.filter((item) => {
    if (item.type !== activeTab.value) return false
    if (category.value && item.category !== category.value) return false
    if (place.value && item.place !== place.value) return false
    if (!kw) return true
    return item.title.includes(kw) || item.place.includes(kw) || item.desc.includes(kw)
  })
})

function resetFilters() {
  keyword.value = ''
  category.value = ''
  place.value = ''
}

function openPublish() {
  Object.assign(form, { title: '', category: '', place: '', date: nowText(), desc: '', contact: '' })
  dialogVisible.value = true
}

function submitPublish() {
  if (!form.title || !form.place) {
    ElMessage.warning('请填写标题和地点')
    return
  }
  items.value.unshift({
    id: Date.now(),
    type: activeTab.value,
    title: form.title,
    category: form.category || '其他',
    place: form.place,
    date: form.date || nowText(),
    desc: form.desc || '暂无补充描述',
    publisher: auth.name || '我',
    contact: form.contact || '未留联系方式',
    status: '寻找中',
    views: 0,
    comments: 0,
    mine: true
  })
  dialogVisible.value = false
  ElMessage.success('已发布')
}

function handleClaim(item) {
  item.status = '已找到'
  ElMessage.success('已标记为找回完成')
}
</script>

<template>
  <div class="lostfound">
    <!-- 顶部标题区 -->
    <section class="lf-hero">
      <div>
        <h2 class="lf-hero-title">失物招领</h2>
        <p class="lf-hero-desc">发布和查找校园遗失物品，帮助失主快速找回</p>
      </div>
      <el-button type="primary" size="large" :icon="Plus" @click="openPublish">
        发布信息
      </el-button>
    </section>

    <!-- 列表区 -->
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
        />

        <div class="lf-filters-right">
          <el-select v-model="category" placeholder="全部类型" clearable class="lf-select">
            <el-option v-for="name in categoryOptions" :key="name" :label="name" :value="name" />
          </el-select>

          <el-select v-model="place" placeholder="全部地点" clearable class="lf-select">
            <el-option v-for="name in placeOptions" :key="name" :label="name" :value="name" />
          </el-select>

          <el-button :icon="Refresh" @click="resetFilters">重置</el-button>
        </div>
      </div>

      <el-empty v-if="!list.length" description="暂时没有相关信息" />

      <div v-else class="lf-grid">
        <article v-for="item in list" :key="item.id" class="lf-card">
          <div class="lf-cover" :class="'tone-' + catMeta(item.category).tone">
            <img v-if="item.image" :src="item.image" :alt="item.title" />
            <el-icon v-else class="lf-cover-icon">
              <component :is="catMeta(item.category).icon" />
            </el-icon>

            <span
              class="lf-status"
              :class="item.status === '寻找中' ? 'is-seeking' : 'is-done'"
            >
              {{ item.status }}
            </span>

            <span class="lf-views">
              <el-icon><View /></el-icon>{{ item.views }}
            </span>
          </div>

          <div class="lf-card-body">
            <h3 class="lf-card-title">{{ item.title }}</h3>

            <span class="lf-category">{{ item.category }}</span>

            <div class="lf-meta">
              <span class="lf-meta-row">
                <el-icon><Location /></el-icon>{{ item.place }}
              </span>
              <span class="lf-meta-row">
                <el-icon><Clock /></el-icon>{{ item.date }}
              </span>
            </div>

            <p class="lf-desc">{{ item.desc }}</p>

            <div class="lf-card-foot">
              <span>发布者：{{ item.publisher }}</span>
              <span class="lf-foot-right">
                <el-button
                  v-if="item.mine && item.status === '寻找中'"
                  link
                  type="primary"
                  size="small"
                  @click="handleClaim(item)"
                >
                  标记已找到
                </el-button>
                <span class="lf-comments">
                  <el-icon><ChatDotRound /></el-icon>{{ item.comments }}
                </span>
              </span>
            </div>
          </div>
        </article>
      </div>
    </section>

    <el-dialog v-model="dialogVisible" title="发布信息" width="520px">
      <el-form :model="form" label-position="top">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="如：黑色双肩包" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="name in categoryOptions" :key="name" :label="name" :value="name" />
          </el-select>
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="form.place" placeholder="如：图书馆二楼借阅区" />
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker
            v-model="form.date"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm"
            placeholder="选择时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="详细描述">
          <el-input v-model="form.desc" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="联系方式">
          <el-input v-model="form.contact" placeholder="手机号或微信" />
        </el-form-item>
        <el-form-item label="图片">
          <el-upload :auto-upload="false" :limit="3">
            <el-button>选择文件</el-button>
            <template #tip>
              <div class="lf-muted">最多 3 张，支持 jpg / png</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPublish">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/*
  配色取自参考图：深蓝主色 + 浅灰底 + 白色卡片 + 琥珀/绿色状态徽章。
  目前只作用在本页，其他页面保持原样。
*/
.lostfound {
  --lf-primary: #2563eb;
  --lf-primary-dark: #1d4ed8;
  --lf-surface: #ffffff;
  --lf-border: #e5e7eb;
  --lf-text: #0f172a;
  --lf-muted: #64748b;
  --lf-soft: #94a3b8;
}

.lf-muted {
  color: var(--lf-soft);
}

/* ---------- 顶部标题区 ---------- */
.lf-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 22px 24px;
  background: var(--lf-surface);
  border: 1px solid var(--lf-border);
  border-radius: 8px;
}

.lf-hero-title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 600;
  color: var(--lf-text);
}

.lf-hero-desc {
  margin: 0;
  font-size: 13px;
  color: var(--lf-muted);
}

/* ---------- 列表区 ---------- */
.lf-body {
  margin-top: 16px;
  padding: 4px 24px 24px;
  background: var(--lf-surface);
  border: 1px solid var(--lf-border);
  border-radius: 8px;
}

.lf-tabs :deep(.el-tabs__header) {
  margin-bottom: 18px;
}

.lf-tabs :deep(.el-tabs__item) {
  font-size: 15px;
}

/* Tab 只当切换器用，内容在下面的卡片网格里，隐藏空的标签面板 */
.lf-tabs :deep(.el-tabs__content) {
  display: none;
}

.lf-filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.lf-search {
  width: 300px;
}

.lf-filters-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.lf-select {
  width: 150px;
}

/* ---------- 卡片网格 ---------- */
.lf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.lf-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--lf-surface);
  border: 1px solid var(--lf-border);
  border-radius: 8px;
  transition: box-shadow 0.2s, transform 0.2s;
}

.lf-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.lf-cover {
  position: relative;
  aspect-ratio: 16 / 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lf-cover img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lf-cover-icon {
  font-size: 46px;
  color: rgba(255, 255, 255, 0.92);
}

/* 没有照片时按分类给出的占位底色 */
.tone-bag {
  background: linear-gradient(135deg, #94a9c6, #6b8199);
}

.tone-card {
  background: linear-gradient(135deg, #90a9e9, #6d86c9);
}

.tone-digital {
  background: linear-gradient(135deg, #aa9cd9, #8577bd);
}

.tone-key {
  background: linear-gradient(135deg, #dbba7c, #b9954f);
}

.tone-other {
  background: linear-gradient(135deg, #88c0b2, #649b8d);
}

.lf-status {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.lf-status.is-seeking {
  background: #fde9c8;
  color: #b45309;
}

.lf-status.is-done {
  background: #d3f2d8;
  color: #15803d;
}

.lf-views {
  position: absolute;
  left: 12px;
  bottom: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #ffffff;
  font-size: 12px;
  text-shadow: 0 1px 3px rgba(15, 23, 42, 0.45);
}

.lf-card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px 16px;
}

.lf-card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--lf-text);
}

.lf-category {
  align-self: flex-start;
  padding: 2px 8px;
  border-radius: 4px;
  background: #eff6ff;
  color: var(--lf-primary);
  font-size: 12px;
}

.lf-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--lf-muted);
}

.lf-meta-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.lf-desc {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--lf-muted);
  font-size: 13px;
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
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  color: var(--lf-soft);
  font-size: 13px;
}

.lf-foot-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.lf-comments {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
