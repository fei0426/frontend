import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:10086',
        changeOrigin: true
      },
      // 后端上传文件返回 /uploads/... 相对路径，开发环境同样代理到后端，
      // 否则浏览器会向 Vite 的 5173 端口请求并得到 404。
      '/uploads': {
        target: 'http://localhost:10086',
        changeOrigin: true
        changeOrigin: true,
        // 失物招领实时聊天走 WebSocket：/api/ws/lostfound-chat
        ws: true
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
