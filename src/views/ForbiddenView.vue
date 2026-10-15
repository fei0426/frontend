<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <el-result icon="warning" title="403" sub-title="当前账号没有访问这个页面的权限">
    <template #extra>
      <el-button type="primary" @click="router.push('/profile')">回到个人中心</el-button>
    </template>
  </el-result>
</template>
