<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'

import { serviceCategories, serviceItems } from '../mock/services'

const router = useRouter()
const keyword = ref('')
const category = ref('all')

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
  <div>
    <div class="page-head">
      <div>
        <h2 class="page-title">服务事项</h2>
        <p class="page-desc">选择要办理的事项，填写表单后提交，可在「我的申请」查看进度。</p>
      </div>
    </div>

    <div class="panel">
      <div class="toolbar">
        <el-input
          v-model="keyword"
          :prefix-icon="Search"
          placeholder="搜索事项名称、办理部门"
          clearable
          style="width: 280px"
        />
        <el-radio-group v-model="category">
          <el-radio-button
            v-for="item in serviceCategories"
            :key="item.key"
            :value="item.key"
          >
            {{ item.label }}
          </el-radio-button>
        </el-radio-group>
      </div>

      <el-empty v-if="!list.length" description="没有找到匹配的事项" />

      <div v-else class="cards">
        <div v-for="item in list" :key="item.id" class="card">
          <div class="card-head">
            <span class="card-name">{{ item.name }}</span>
            <el-tag size="small" type="info" effect="plain">{{ item.department }}</el-tag>
          </div>
          <p class="card-summary">{{ item.summary }}</p>
          <dl class="card-meta">
            <div>
              <dt>所需材料</dt>
              <dd>{{ item.materials }}</dd>
            </div>
            <div>
              <dt>办理时限</dt>
              <dd>{{ item.sla }}</dd>
            </div>
          </dl>
          <div class="card-foot">
            <el-button type="primary" size="small" @click="goApply(item)">去办理</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #ffffff;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-name {
  font-size: 15px;
  font-weight: 500;
}

.card-summary {
  flex: 1;
  margin: 10px 0 12px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.card-meta {
  display: grid;
  gap: 6px;
  margin: 0 0 14px;
  font-size: 13px;
}

.card-meta > div {
  display: flex;
  gap: 8px;
}

.card-meta dt {
  flex: 0 0 64px;
  color: #909399;
}

.card-meta dd {
  margin: 0;
  color: #303133;
}

.card-foot {
  display: flex;
  justify-content: flex-end;
}
</style>
