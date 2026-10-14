import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'
import { permission } from './directives/permission'
import './assets/main.css'

const app = createApp(App)

// 顺序有讲究：先装 Pinia，路由守卫里才能用到 store
app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// 注册按钮级权限指令 v-permission
app.directive('permission', permission)

app.mount('#app')
