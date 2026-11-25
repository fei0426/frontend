import { createApp } from 'vue'
import CampusApp from './CampusApp.vue'
import './campus.css'

// Element Plus 组件由 unplugin-vue-components 按需引入，无需整包注册
createApp(CampusApp).mount('#campus-app')
