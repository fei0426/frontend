import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Element Plus 组件由 unplugin-vue-components 按需自动引入。
// 说明：ElMessage / ElMessageBox 的样式已移到 layout/BasicLayout.vue，
// 登录页首屏因此不再下载 Element Plus 的基础样式。

import App from './App.vue'
import router from './router'
import { permission } from './directives/permission'
import './assets/main.css'

const app = createApp(App)

// 顺序有讲究：先装 Pinia，路由守卫里才能用到 store
app.use(createPinia())
app.use(router)

// 注册按钮级权限指令 v-permission
app.directive('permission', permission)

app.mount('#app')
