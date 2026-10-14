<script setup>
const rows = [
  { username: 'stu', name: '张同学', role: '学生', status: '正常' },
  { username: 'tea', name: '李老师', role: '教师', status: '正常' },
  { username: 'admin', name: '王管理员', role: '管理员', status: '正常' }
]
</script>

<template>
  <div>
    <h2 class="page-title">用户管理</h2>
    <p class="page-desc">
      整个菜单需要 system:user:list 权限，只有管理员能看到；"分配角色"按钮还需要额外一级权限。
    </p>

    <div class="toolbar">
      <el-button v-permission="'system:role:assign'" type="primary">分配角色</el-button>
    </div>

    <el-table :data="rows" border>
      <el-table-column prop="username" label="账号" width="120" />
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="role" label="角色" width="120" />
      <el-table-column prop="status" label="状态" width="110" />
    </el-table>
  </div>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}
</style>
