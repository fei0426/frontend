import axios from 'axios'
import { ElMessage } from 'element-plus'

/**
 * 全局唯一的请求实例。
 * 所有接口都走这里，token 注入、401、403 的处理只需要在这一个文件里维护。
 */
const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截：自动带上登录令牌
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rbac_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截：统一处理登录失效和越权
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status

    if (status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      localStorage.removeItem('rbac_token')
      localStorage.removeItem('rbac_mock_user')
      // 这里不用 router 是为了避免循环依赖，hash 路由直接改地址即可
      window.location.hash = '#/login'
    } else if (status === 403) {
      // 最关键的一条：前端把按钮藏了，用户绕过界面直接调接口时，后端应该返回 403
      ElMessage.error('没有操作权限（后端已拦截）')
    } else {
      ElMessage.error(error.response?.data?.message || error.message || '请求失败')
    }

    return Promise.reject(error)
  }
)

export default request
