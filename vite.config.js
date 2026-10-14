import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:10086',
        changeOrigin: true
      }
    }
  },
  // 多页面入口：保留原有 index.html，新增独立的 campus.html 校区数据插件页面
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        campus: fileURLToPath(new URL('./campus.html', import.meta.url))
      }
    }
  }
})
