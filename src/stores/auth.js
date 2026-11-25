import { defineStore } from 'pinia'
import { loginApi, getUserInfoApi } from '../api/auth'

export const useAuthStore = defineStore('rbac-auth', {
  state: () => ({
    token: localStorage.getItem('rbac_token') || '',
    id: '',
    username: '',
    name: '',
    no: '',
    dept: '',
    roles: [],
    permissions: [],
    // 标记用户信息是否已经从后端取过，避免每次跳转都请求一次
    loaded: false
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,

    // 核心方法：判断当前用户有没有某个权限码
    hasPermission: (state) => (code) => {
      if (!code) return true // 没标权限的菜单/按钮，视为公开
      return state.permissions.includes(code)
    }
  },

  actions: {
    async login(form) {
      const data = await loginApi(form)
      this.token = data.token
      localStorage.setItem('rbac_token', data.token)
      await this.fetchUserInfo()
    },

    // 扫码登录 / SSO 登录：拿到令牌后直接建立会话
    async loginWithToken(token) {
      this.token = token
      localStorage.setItem('rbac_token', token)
      await this.fetchUserInfo()
    },

    async ssoLogin({ token }) {
      return this.loginWithToken(token)
    },

    async fetchUserInfo() {
      const data = await getUserInfoApi()
      this.id = data.id
      this.username = data.username
      this.name = data.name
      this.no = data.no || ''
      this.dept = data.dept || ''
      this.roles = data.roles || []
      this.permissions = data.permissions || []
      this.loaded = true
    },

    logout() {
      this.token = ''
      this.id = ''
      this.username = ''
      this.name = ''
      this.no = ''
      this.dept = ''
      this.roles = []
      this.permissions = []
      this.loaded = false
      localStorage.removeItem('rbac_token')
      localStorage.removeItem('rbac_mock_user')
      // 断开并清空上一个账号的聊天连接与消息（动态引入避免循环依赖）
      import('./lostChat')
        .then(({ useLostChatStore }) => useLostChatStore().reset())
        .catch(() => {})
    }
  }
})
