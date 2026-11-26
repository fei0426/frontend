import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'

import { useAuthStore } from './auth'
import {
  fetchItemMessagesApi,
  fetchThreadsApi,
  fetchConversationsApi,
  createConversationApi,
  fetchPrivateMessagesApi
} from '../api/lostChat'

// WebSocket 实例和重连定时器放在 store 外部，避免被 Vue 响应式代理包裹
let socket = null
let socketToken = ''
let reconnectTimer = null
let manualClosed = false

const MAX_RECONNECT_ATTEMPTS = 10

/**
 * 失物招领实时聊天状态：
 * - 每条失物信息下的公开消息（按 itemId 隔离）
 * - 我的私聊会话与各会话消息
 * - WebSocket 连接、订阅与自动重连
 *
 * view 取值：threads（有消息的物品列表）/ item（某物品交流）/ private（私聊）
 */
export const useLostChatStore = defineStore('lost-chat', {
  state: () => ({
    visible: false,
    view: 'threads',
    connected: false,
    connecting: false,
    reconnectAttempt: 0,
    threads: [],
    activeItem: null,
    // itemId -> 消息数组
    itemMessages: {},
    conversations: [],
    // conversationId -> 消息数组
    privateMessages: {},
    activeConversationId: null
  }),

  getters: {
    currentItemMessages: (state) => {
      if (!state.activeItem) return []
      return state.itemMessages[state.activeItem.id] || []
    },
    activeConversation: (state) =>
      state.conversations.find(
        (item) => String(item.conversationId) === String(state.activeConversationId)
      ) || null,
    currentPrivateMessages: (state) => {
      if (!state.activeConversationId) return []
      return state.privateMessages[state.activeConversationId] || []
    }
  },

  actions: {
    openPanel() {
      this.visible = true
      this.reconnectAttempt = 0
      this.connect()
      if (this.view === 'threads') {
        this.loadThreads()
      }
    },

    togglePanel() {
      if (this.visible) {
        this.visible = false
      } else {
        this.openPanel()
      }
    },

    closePanel() {
      this.visible = false
    },

    /** 打开某条失物信息的交流。 */
    openItemChat(item) {
      if (!item || !item.id) return
      this.activeItem = { id: item.id, title: item.title || `失物信息 #${item.id}` }
      this.activeConversationId = null
      this.view = 'item'
      this.visible = true
      this.reconnectAttempt = 0
      this.connect()
      this.subscribeItem(item.id)
      this.loadItemMessages(item.id)
    },

    selectThread(thread) {
      this.openItemChat({ id: thread.itemId, title: thread.itemTitle })
    },

    /** 返回到有消息的物品列表。 */
    backToThreads() {
      this.view = 'threads'
      this.activeItem = null
      this.activeConversationId = null
      this.loadThreads()
    },

    /** 逐级返回：私聊 -> 物品交流 -> 物品列表。 */
    back() {
      if (this.view === 'private') {
        this.view = this.activeItem ? 'item' : 'threads'
        if (!this.activeItem) {
          this.loadThreads()
        }
        return
      }
      if (this.view === 'item') {
        this.backToThreads()
      }
    },

    connect() {
      const auth = useAuthStore()
      if (!auth.token) return

      // 账号切换 / 令牌刷新后，旧连接仍代表上一个用户，必须先丢弃
      if (socket && socketToken !== auth.token) {
        const stale = socket
        socket = null
        try {
          stale.close()
        } catch (e) {
          // 忽略关闭异常
        }
        this.connected = false
        this.connecting = false
      }
      if (socket || this.connecting) return

      manualClosed = false
      this.connecting = true
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      const url = `${protocol}://${window.location.host}/api/ws/lostfound-chat?token=${encodeURIComponent(auth.token)}`

      let ws
      try {
        ws = new WebSocket(url)
      } catch (e) {
        this.connecting = false
        this.scheduleReconnect()
        return
      }
      socket = ws
      socketToken = auth.token

      ws.onopen = () => {
        if (socket !== ws) return
        this.connected = true
        this.connecting = false
        this.reconnectAttempt = 0
        if (this.activeItem) {
          this.subscribeItem(this.activeItem.id)
        }
        if (this.view === 'threads') {
          this.loadThreads()
        }
        this.loadConversations()
      }

      ws.onmessage = (event) => {
        if (socket !== ws) return
        this.handleSocketMessage(event)
      }

      ws.onclose = () => {
        // 已被新连接替换时忽略旧连接的回调
        if (socket !== ws) return
        this.connected = false
        this.connecting = false
        socket = null
        socketToken = ''
        if (!manualClosed) {
          this.scheduleReconnect()
        }
      }

      // 具体失败原因由 onclose 统一处理
      ws.onerror = () => {}
    },

    disconnect() {
      manualClosed = true
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      if (socket) {
        socket.close()
        socket = null
      }
      socketToken = ''
      this.connected = false
      this.connecting = false
    },

    /** 退出登录 / 切换账号时清空聊天状态，避免上一个账号的数据和连接残留。 */
    reset() {
      this.disconnect()
      this.visible = false
      this.view = 'threads'
      this.reconnectAttempt = 0
      this.threads = []
      this.activeItem = null
      this.itemMessages = {}
      this.conversations = []
      this.privateMessages = {}
      this.activeConversationId = null
    },

    scheduleReconnect() {
      // 面板关闭后不再后台重连，重新打开时由 openPanel 触发
      if (manualClosed || reconnectTimer || !this.visible) return
      this.reconnectAttempt += 1
      if (this.reconnectAttempt > MAX_RECONNECT_ATTEMPTS) {
        return
      }
      const delay = Math.min(1000 * 2 ** (this.reconnectAttempt - 1), 30000)
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        this.connect()
      }, delay)
    },

    /** 订阅某条失物信息的消息推送。 */
    subscribeItem(itemId) {
      if (!itemId) return
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        // 连接建立后 onopen 会补发订阅
        return
      }
      socket.send(JSON.stringify({ type: 'item.subscribe', itemId }))
    },

    handleSocketMessage(event) {
      let data
      try {
        data = JSON.parse(event.data)
      } catch (e) {
        return
      }

      switch (data.type) {
        case 'ready':
          this.connected = true
          break
        case 'subscribed':
          break
        case 'message':
          this.handleIncomingMessage(data)
          break
        case 'error':
          ElMessage.warning(data.message || '聊天操作失败')
          break
        case 'pong':
        default:
          break
      }
    },

    handleIncomingMessage(data) {
      const message = data.message
      if (!message) return

      if (data.scope === 'item') {
        const itemId = data.itemId || message.itemId
        if (!itemId) return
        if (!this.itemMessages[itemId]) {
          this.itemMessages[itemId] = []
        }
        pushUnique(this.itemMessages[itemId], message)
        this.updateThreadSummary(itemId, message)
        return
      }

      const conversationId = data.conversationId || message.conversationId
      if (!conversationId) return
      if (!this.privateMessages[conversationId]) {
        this.privateMessages[conversationId] = []
      }
      pushUnique(this.privateMessages[conversationId], message)

      const conversation = this.conversations.find(
        (item) => String(item.conversationId) === String(conversationId)
      )
      if (conversation) {
        conversation.lastContent = message.content
        conversation.lastMessageAt = message.createdAt
      } else {
        // 对方先发起的会话，本地列表还没有，重新拉一次
        this.loadConversations()
      }
    },

    updateThreadSummary(itemId, message) {
      const thread = this.threads.find((item) => String(item.itemId) === String(itemId))
      if (thread) {
        thread.lastContent = message.content
        thread.lastMessageAt = message.createdAt
        this.threads = [thread, ...this.threads.filter((item) => item !== thread)]
      } else {
        this.loadThreads()
      }
    },

    async loadThreads() {
      try {
        this.threads = await fetchThreadsApi()
      } catch (e) {
        // 接口异常由 request 拦截器统一提示
      }
    },

    async loadItemMessages(itemId) {
      try {
        const list = await fetchItemMessagesApi(itemId)
        if (!this.itemMessages[itemId]) {
          this.itemMessages[itemId] = []
        }
        mergeMessages(this.itemMessages[itemId], list)
      } catch (e) {
        // 接口异常由 request 拦截器统一提示
      }
    },

    async loadConversations() {
      try {
        this.conversations = await fetchConversationsApi()
      } catch (e) {
        // 接口异常由 request 拦截器统一提示
      }
    },

    async loadPrivateMessages(conversationId) {
      try {
        const list = await fetchPrivateMessagesApi(conversationId)
        if (!this.privateMessages[conversationId]) {
          this.privateMessages[conversationId] = []
        }
        mergeMessages(this.privateMessages[conversationId], list)
      } catch (e) {
        // 接口异常由 request 拦截器统一提示
      }
    },

    selectConversation(conversationId) {
      this.view = 'private'
      this.activeConversationId = conversationId
      this.loadPrivateMessages(conversationId)
    },

    async openPrivateChat(peerUserId, peerName) {
      const auth = useAuthStore()
      if (!peerUserId || String(peerUserId) === String(auth.id)) return
      try {
        const created = await createConversationApi(peerUserId, this.activeItem?.id)
        const exists = this.conversations.find(
          (item) => String(item.conversationId) === String(created.conversationId)
        )
        if (!exists) {
          this.conversations.unshift({
            conversationId: created.conversationId,
            peerUserId: created.peerUserId,
            peerName: created.peerName || peerName,
            lastContent: '',
            lastMessageAt: ''
          })
        }
        this.selectConversation(created.conversationId)
      } catch (e) {
        // 接口异常由 request 拦截器统一提示
      }
    },

    sendMessage(content) {
      const text = (content || '').trim()
      if (!text) return false
      if (!this.connected || !socket) {
        ElMessage.warning('聊天连接已断开，正在尝试重连')
        this.connect()
        return false
      }
      if (text.length > 500) {
        ElMessage.warning('消息内容不能超过 500 字')
        return false
      }

      if (this.view === 'private') {
        if (!this.activeConversationId) {
          ElMessage.warning('请先选择一个私聊会话')
          return false
        }
        socket.send(JSON.stringify({
          type: 'private.send',
          conversationId: this.activeConversationId,
          content: text
        }))
        return true
      }

      if (this.view === 'item' && this.activeItem) {
        socket.send(JSON.stringify({
          type: 'item.send',
          itemId: this.activeItem.id,
          itemTitle: this.activeItem.title,
          content: text
        }))
        return true
      }

      ElMessage.warning('请先选择一条失物信息')
      return false
    }
  }
})

function pushUnique(list, message) {
  if (!message || list.some((item) => item.id === message.id)) return
  list.push(message)
}

/** 合并历史消息并按 id 排序，避免重复 */
function mergeMessages(target, incoming) {
  if (!Array.isArray(incoming) || !incoming.length) return
  const ids = new Set(target.map((item) => item.id))
  incoming.forEach((item) => {
    if (!ids.has(item.id)) {
      target.push(item)
      ids.add(item.id)
    }
  })
  target.sort((a, b) => a.id - b.id)
}
