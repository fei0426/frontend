<script setup>
import ChatBox from '../components/ChatBox.vue'
</script>

<template>
  <div>
    <h2 class="page-title">智能问答</h2>
    <p class="page-desc">
      进入这一页需要 qa:chat:use 权限。这里直接复用了现有的问答组件，没有重复造轮子。
    </p>
    <ChatBox />
  </div>
</template>
