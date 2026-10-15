import { useAuthStore } from '../stores/auth'

/**
 * 按钮级权限指令，用法：
 *   <el-button v-permission="'service:repair:approve'">审批</el-button>
 *
 * 没有权限时直接把元素从 DOM 里移除。
 * 注意：这只能挡住"看得见"的入口，挡不住直接调接口的人，
 * 真正的访问控制必须由后端完成。
 */
export const permission = {
  mounted(el, binding) {
    const code = binding.value
    if (!code) return

    const auth = useAuthStore()
    if (!auth.hasPermission(code)) {
      el.parentNode && el.parentNode.removeChild(el)
    }
  }
}
