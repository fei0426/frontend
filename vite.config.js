import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

/**
 * 把 index.html（登录页入口）引用的 CSS 内联进 HTML。
 *
 * 登录页首屏显示的是 index.html 里内联的骨架，如果主样式表还要单独发一个请求，
 * FCP 就会被推迟一个 RTT。把这份关键 CSS 内联后，首屏不再有阻塞渲染的样式请求。
 */
function inlineEntryCss() {
  return {
    name: 'inline-entry-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const htmlAsset = bundle['index.html']
      if (!htmlAsset) return
      htmlAsset.source = String(htmlAsset.source).replace(
        /<link rel="stylesheet"[^>]*href="([^"]+\.css)"[^>]*>/g,
        (tag, href) => {
          const file = href.replace(/^\//, '').split('?')[0]
          const cssAsset = bundle[file]
          if (!cssAsset) return tag
          const css = String(cssAsset.source).replace(/<\/style/gi, '<\\/style')
          return `<style>${css}</style>`
        }
      )
    }
  }
}

export default defineConfig({
  plugins: [
    vue(),
    // Element Plus 按需引入：模板里用到的组件/指令自动导入，样式跟着组件走
    Components({ resolvers: [ElementPlusResolver()] }),
    inlineEntryCss()
  ],
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
        changeOrigin: true,
        // 失物招领实时聊天走 WebSocket：/api/ws/lostfound-chat
        ws: true
      }
    }
  },
  // 多页面入口：index.html 主应用 / campus.html 校区数据插件 / sso-callback.html 统一身份认证回调
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        campus: fileURLToPath(new URL('./campus.html', import.meta.url)),
        ssoCallback: fileURLToPath(new URL('./sso-callback.html', import.meta.url)),
      }
    }
  }
})
