import { createRouter, createWebHashHistory } from 'vue-router'

import BasicLayout from '../layout/BasicLayout.vue'
import LoginView from '../views/LoginView.vue'
import ForbiddenView from '../views/ForbiddenView.vue'
import { menuRoutes, extraRoutes } from './menu'

import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/login', name: 'login', component: LoginView },
  {
    path: '/',
    component: BasicLayout,
    redirect: '/profile',
    children: [
      ...menuRoutes,
      ...extraRoutes,
      {
        path: '/403',
        name: 'forbidden',
        component: ForbiddenView,
        meta: { title: '无访问权限' }
      }
    ]
  }
]

const router = createRouter({
  // 用 hash 模式，页面放在 /rbac.html 下也不会出现路径问题
  history: createWebHashHistory(),
  routes
})

/**
 * 全局前置守卫，四件事：
 *   1. 已登录的人不要再进登录页
 *   2. 没登录的一律送去登录页，并记住原本想去的地址
 *   3. 有令牌但还没取过用户信息，先取一次
 *   4. 目标页面要求权限码时，检查当前用户是否具备
 */
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.path === '/login') {
    return auth.isLoggedIn ? '/profile' : true
  }

  if (!auth.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (!auth.loaded) {
    try {
      await auth.fetchUserInfo()
    } catch {
      auth.logout()
      return '/login'
    }
  }

  const need = to.meta?.permission
  if (need && !auth.hasPermission(need)) {
    return '/403'
  }

  return true
})

export default router
