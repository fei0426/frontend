/**
 * 极轻量的全局提示（toast）。
 *
 * 登录页首屏不再依赖 Element Plus，因此不再引入 ElMessage：
 * 自己用原生 DOM 渲染一个提示条，零第三方依赖，不占用首屏 JS。
 * 对外暴露的方法名与 ElMessage 保持一致（success / error / warning / info），
 * 调用方可以无感替换。
 */
const COLORS = {
  success: '#16a34a',
  error: '#dc2626',
  warning: '#d97706',
  info: '#2563eb'
}

function show(type, message) {
  if (typeof document === 'undefined') return
  const text = String(message ?? '')
  if (!text) return

  const box = document.createElement('div')
  box.textContent = text
  box.style.cssText = [
    'position:fixed',
    'top:20px',
    'left:50%',
    'transform:translate(-50%,-12px)',
    'z-index:9999',
    'max-width:80vw',
    'padding:10px 18px',
    'border-radius:10px',
    'font-size:14px',
    'line-height:20px',
    'color:#fff',
    `background:${COLORS[type] || COLORS.info}`,
    'box-shadow:0 10px 30px rgba(15,23,42,.18)',
    'opacity:0',
    'transition:opacity .2s ease,transform .2s ease',
    'pointer-events:none'
  ].join(';')
  document.body.appendChild(box)

  requestAnimationFrame(() => {
    box.style.opacity = '1'
    box.style.transform = 'translate(-50%,0)'
  })

  setTimeout(() => {
    box.style.opacity = '0'
    box.style.transform = 'translate(-50%,-12px)'
    setTimeout(() => box.remove(), 220)
  }, 2200)
}

export const toast = {
  success: (message) => show('success', message),
  error: (message) => show('error', message),
  warning: (message) => show('warning', message),
  info: (message) => show('info', message)
}
