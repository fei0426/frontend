<script setup>
import { ref, computed } from 'vue'
import campusData from '../campus-data.js'

const selected = ref([])

// 级联选择器配置：字段名与数据结构一致
const cascaderProps = {
  value: 'value',
  label: 'label',
  children: 'children',
  expandTrigger: 'click'
}

// 根据选中的 value 数组还原各级中文名称
const selectedLabels = computed(() => {
  const labels = []
  let list = campusData
  for (const val of selected.value) {
    const node = list.find((n) => n.value === val)
    if (!node) break
    labels.push(node.label)
    list = node.children || []
  }
  return labels
})

const levelNames = ['校区', '学院', '专业']

function reset() {
  selected.value = []
}
</script>

<template>
  <div class="panel">
    <div class="panel-toolbar">
      <span class="panel-title">校区 / 学院 / 专业 三级级联选择</span>
      <el-button size="small" @click="reset">重置</el-button>
    </div>

    <el-cascader
      v-model="selected"
      class="cascader"
      :options="campusData"
      :props="cascaderProps"
      placeholder="请依次选择：校区 → 学院 → 专业"
      clearable
    />

    <div v-if="selectedLabels.length" class="result-card">
      <div v-for="(label, i) in selectedLabels" :key="i" class="result-row">
        <span class="result-level">{{ levelNames[i] }}</span>
        <span class="result-value">{{ label }}</span>
      </div>
    </div>

    <div v-else class="empty-tip">尚未选择，请在上方完成三级选择。</div>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.cascader {
  width: 100%;
  max-width: 420px;
}

.result-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  padding: 8px 16px;
  max-width: 420px;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}

.result-row:last-child {
  border-bottom: none;
}

.result-level {
  flex-shrink: 0;
  width: 48px;
  font-size: 13px;
  color: #64748b;
}

.result-value {
  font-size: 15px;
  color: #1e293b;
  font-weight: 500;
}

.empty-tip {
  font-size: 14px;
  color: #94a3b8;
}
</style>
