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
  // 多页面入口：index.html 主应用 / campus.html 校区数据插件
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        campus: fileURLToPath(new URL('./campus.html', import.meta.url)),
      }
    }
  }
})
