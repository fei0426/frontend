<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  Calendar,
  Document,
  Grid,
  Reading,
  Search,
  Tickets,
  Tools
} from '@element-plus/icons-vue'

import { serviceCategories, serviceItems } from '../mock/services'

const router = useRouter()
const keyword = ref('')
const category = ref('all')

const categoryIcons = {
  life: Tools,
  academic: Reading,
  place: Calendar,
  other: Document
}

const list = computed(() => {
  const kw = keyword.value.trim()
  return serviceItems.filter((item) => {
    const matchCategory = category.value === 'all' || item.category === category.value
    const matchKeyword =
      !kw ||
      item.name.includes(kw) ||
      item.summary.includes(kw) ||
      item.department.includes(kw)
    return matchCategory && matchKeyword
  })
})

function goApply(item) {
  router.push(`/services/${item.id}/apply`)
}
</script>

<template>
  <div class="services-page">
    <header class="page-head">
      <div>
        <h1 class="page-title">服务事项</h1>
        <p class="page-desc">
          按办理场景浏览校园服务。选择事项后填写材料，并在“我的申请”中跟踪处理进度。
        </p>
      </div>
      <el-button :icon="Tickets" @click="router.push('/my-requests')">
        我的申请
      </el-button>
    </header>

    <section class="service-toolbar panel">
      <div class="service-toolbar-head">
        <div>
          <h2>找到要办的事</h2>
          <p>共 {{ serviceItems.length }} 项服务，当前显示 {{ list.length }} 项</p>
        </div>
        <el-input
          v-model="keyword"
          :prefix-icon="Search"
          placeholder="搜索事项名称、办理部门"
          clearable
          class="service-search"
        />
      </div>

      <div class="filter-row" role="group" aria-label="服务分类">
        <button
          v-for="item in serviceCategories"
          :key="item.key"
          type="button"
          class="filter-pill"
          :class="{ active: category === item.key }"
          @click="category = item.key"
        >
          {{ item.label }}
        </button>
      </div>
    </section>

    <el-empty v-if="!list.length" description="没有找到匹配的服务事项">
      <el-button @click="keyword = ''; category = 'all'">清除筛选</el-button>
    </el-empty>

    <section v-else class="service-list" aria-live="polite">
      <article v-for="item in list" :key="item.id" class="service-row">
        <div class="service-icon">
          <el-icon><component :is="categoryIcons[item.category] || Grid" /></el-icon>
        </div>

        <div class="service-copy">
          <div class="service-title-line">
            <h2>{{ item.name }}</h2>
            <el-tag type="info" effect="plain">{{ item.department }}</el-tag>
          </div>
          <p>{{ item.summary }}</p>
          <div class="service-meta">
            <span><strong>所需材料</strong>{{ item.materials }}</span>
            <span><strong>办理时限</strong>{{ item.sla }}</span>
          </div>
        </div>

        <button type="button" class="service-action" @click="goApply(item)">
          去办理
          <el-icon><ArrowRight /></el-icon>
        </button>
      </article>
    </section>
  </div>
</template>

<style scoped>
.services-page {
  max-width: 1480px;
  margin: 0 auto;
}

.service-toolbar {
  margin-bottom: 20px;
  padding: 20px 22px;
}

.service-toolbar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.service-toolbar-head h2 {
  margin: 0 0 4px;
  color: var(--sp-ink);
  font-size: 17px;
  font-weight: 650;
}

.service-toolbar-head p {
  margin: 0;
  color: var(--sp-muted);
  font-size: 12px;
}

.service-search {
  width: 320px;
}

.filter-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #edf1ee;
}

.filter-pill {
  min-height: 32px;
  padding: 6px 13px;
  border: 1px solid var(--sp-border);
  border-radius: 999px;
  background: var(--sp-surface);
  color: var(--sp-muted);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease;
}

.filter-pill:hover {
  border-color: var(--sp-primary);
  color: var(--sp-primary);
}

.filter-pill.active {
  border-color: var(--sp-primary);
  background: var(--sp-sage);
  color: var(--sp-primary-strong);
}

.service-list {
  display: grid;
  gap: 10px;
}

.service-row {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-panel);
  background: var(--sp-surface);
  transition:
    border-color 160ms ease,
    background-color 160ms ease;
}

.service-row:hover {
  border-color: var(--sp-border-strong);
  background: #fbfcfa;
}

.service-icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 11px;
  background: var(--sp-sage);
  color: var(--sp-primary-strong);
  font-size: 20px;
}

.service-copy {
  min-width: 0;
}

.service-title-line {
  display: flex;
  align-items: center;
  gap: 10px;
}

.service-title-line h2 {
  margin: 0;
  color: var(--sp-ink);
  font-size: 15px;
  font-weight: 650;
}

.service-copy > p {
  max-width: 820px;
  margin: 6px 0 10px;
  color: var(--sp-muted);
  font-size: 12px;
  line-height: 1.6;
}

.service-meta {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  color: var(--sp-muted);
  font-size: 11px;
}

.service-meta strong {
  margin-right: 7px;
  color: var(--sp-text);
  font-weight: 620;
}

.service-action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 34px;
  padding: 7px 13px;
  border: 1px solid var(--sp-border-strong);
  border-radius: var(--sp-radius-control);
  background: var(--sp-surface);
  color: var(--sp-primary-strong);
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background-color 160ms ease;
}

.service-action:hover {
  border-color: var(--sp-primary);
  background: var(--sp-sage);
}

@media (max-width: 1280px) {
  .service-row {
    grid-template-columns: 44px minmax(0, 1fr);
  }

  .service-action {
    grid-column: 2;
    justify-self: end;
  }
}
</style>
