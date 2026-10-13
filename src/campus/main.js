import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import CampusApp from './CampusApp.vue'
import './campus.css'

createApp(CampusApp).use(ElementPlus).mount('#campus-app')
