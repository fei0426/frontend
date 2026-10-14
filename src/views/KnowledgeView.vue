<script setup>
const rows = [
  { id: 1, title: '学生宿舍管理规定', status: '已发布' },
  { id: 2, title: '图书馆借阅规则', status: '已发布' },
  { id: 3, title: '校园一卡通使用说明', status: '审核中' }
]
</script>

<template>
  <div>
    <h2 class="page-title">知识库管理</h2>
    <p class="page-desc">
      教师可以进入这一页查看知识条目，但"新增知识"按钮只对管理员显示。
    </p>

    <div class="toolbar">
      <el-button v-permission="'qa:knowledge:edit'" type="primary">新增知识</el-button>
    </div>

    <el-table :data="rows" border>
      <el-table-column prop="id" label="编号" width="90" />
      <el-table-column prop="title" label="知识标题" />
      <el-table-column prop="status" label="状态" width="110" />
    </el-table>
  </div>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}
</style>
