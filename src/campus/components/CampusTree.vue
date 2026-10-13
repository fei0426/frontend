<script setup>
import { ref } from 'vue'
import campusData from '../campus-data.js'

const treeRef = ref(null)
const currentPath = ref([])

// el-tree 默认使用 data 的 label / children 字段，无需额外配置
function handleNodeClick(data, node) {
  const path = []
  let cur = node
  while (cur && cur.data && cur.data.label) {
    path.unshift(cur.data.label)
    cur = cur.parent
  }
  currentPath.value = path
}

function resetHighlight() {
  currentPath.value = []
  treeRef.value?.setCurrentKey(null)
}
</script>

<template>
  <div class="panel">
    <div class="panel-toolbar">
      <span class="panel-title">校区体系树形图</span>
      <el-button size="small" @click="resetHighlight">清除选择</el-button>
    </div>

    <div class="tree-wrap">
      <el-tree
        ref="treeRef"
        :data="campusData"
        node-key="value"
        default-expand-all
        highlight-current
        :expand-on-click-node="false"
        @node-click="handleNodeClick"
      />
    </div>

    <div v-if="currentPath.length" class="result">
      <span class="result-label">当前节点：</span>
      <el-tag v-for="(item, i) in currentPath" :key="i" class="path-tag" :type="i === 0 ? 'success' : 'primary'">
        {{ item }}
      </el-tag>
    </div>
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

.tree-wrap {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  background: #ffffff;
  max-height: 460px;
  overflow: auto;
}

.result {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.result-label {
  font-size: 14px;
  color: #64748b;
}

.path-tag {
  font-size: 13px;
}
</style>
