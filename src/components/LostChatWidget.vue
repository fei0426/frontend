<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { ArrowLeft, ChatDotRound, Close, Promotion } from '@element-plus/icons-vue'

import { useAuthStore } from '../stores/auth'
import { useLostChatStore } from '../stores/lostChat'

const auth = useAuthStore()
const chat = useLostChatStore()

const draft = ref('')
const bodyRef = ref(null)

const messages = computed(() => {
  if (chat.view === 'item') return chat.currentItemMessages
  if (chat.view === 'private') return chat.currentPrivateMessages
  return []
})

const panelTitle = computed(() => {
  if (chat.view === 'item') return chat.activeItem?.title || '失物信息交流'
  if (chat.view === 'private') return chat.activeConversation?.peerName || '私聊'
  return '失物信息交流'
})

const canSend = computed(() => chat.view !== 'threads')

function isMine(message) {
  return String(message.senderId) === String(auth.id)
}

function initial(name) {
  return name ? name.slice(0, 1) : '?'
}

function shortTime(value) {
  return value ? value.slice(11, 16) : ''
}

async function scrollToBottom() {
  await nextTick()
  if (bodyRef.value) {
    bodyRef.value.scrollTop = bodyRef.value.scrollHeight
  }
}

function send() {
  if (chat.sendMessage(draft.value)) {
    draft.value = ''
  }
}

function startPrivate(message) {
  if (isMine(message)) return
  chat.openPrivateChat(message.senderId, message.senderName)
}

function goBack() {
  if (chat.view === 'item') {
    chat.backToThreads()
  } else {
    chat.back()
  }
}

watch(
  () => chat.visible,
  (visible) => {
    if (visible) scrollToBottom()
  }
)

watch(
  () => [chat.view, chat.activeItem?.id, chat.activeConversationId, messages.value.length],
  () => scrollToBottom()
)
</script>

<template>
  <!-- 右下角悬浮入口：只有消息图标，不显示数字角标 -->
  <button
    v-if="!chat.visible"
    class="lc-fab"
    type="button"
    aria-label="打开失物招领交流"
    @click="chat.openPanel()"
  >
    <el-icon><ChatDotRound /></el-icon>
  </button>

  <!-- 聊天浮窗 -->
  <section v-else class="lc-panel">
    <header class="lc-header">
      <div class="lc-header-main">
        <el-button
          v-if="chat.view !== 'threads'"
          text
          circle
          :icon="ArrowLeft"
          aria-label="返回"
          @click="goBack"
        />
        <span class="lc-status" :class="chat.connected ? 'is-online' : 'is-offline'" />
        <div class="lc-heading">
          <h3 class="lc-title">{{ panelTitle }}</h3>
          <p class="lc-subtitle">{{ chat.connected ? '已连接' : '连接中…' }}</p>
        </div>
      </div>
      <el-button text circle :icon="Close" aria-label="关闭聊天" @click="chat.closePanel()" />
    </header>

    <!-- 有消息的失物信息列表 -->
    <div v-if="chat.view === 'threads'" class="lc-thread-list">
      <button
        v-for="thread in chat.threads"
        :key="thread.itemId"
        type="button"
        class="lc-thread"
        @click="chat.selectThread(thread)"
      >
        <div class="lc-thread-top">
          <span class="lc-thread-title">{{ thread.itemTitle }}</span>
          <span class="lc-thread-time">{{ shortTime(thread.lastMessageAt) }}</span>
        </div>
        <span class="lc-thread-last">{{ thread.lastContent }}</span>
      </button>
      <p v-if="!chat.threads.length" class="lc-empty">
        还没有交流记录<br />点击失物卡片即可就该物品发起交流
      </p>
    </div>

    <!-- 物品交流 / 私聊 -->
    <template v-else>
      <div v-if="chat.view === 'private'" class="lc-conversations">
        <button
          v-for="item in chat.conversations"
          :key="item.conversationId"
          type="button"
          class="lc-conversation"
          :class="{ 'is-active': String(item.conversationId) === String(chat.activeConversationId) }"
          @click="chat.selectConversation(item.conversationId)"
        >
          <span class="lc-conversation-name">{{ item.peerName }}</span>
          <span class="lc-conversation-last">{{ item.lastContent || '暂无消息' }}</span>
        </button>
        <span v-if="!chat.conversations.length" class="lc-conversation-empty">
          暂无会话，可在物品交流点击对方昵称发起私聊
        </span>
      </div>

      <div ref="bodyRef" class="lc-body">
        <template v-if="messages.length">
          <div
            v-for="message in messages"
            :key="message.id"
            class="lc-message"
            :class="{ 'is-mine': isMine(message) }"
          >
            <span class="lc-avatar">{{ initial(message.senderName) }}</span>
            <div class="lc-message-main">
              <div class="lc-message-meta">
                <button
                  v-if="!isMine(message)"
                  type="button"
                  class="lc-sender"
                  title="发起私聊"
                  @click="startPrivate(message)"
                >
                  {{ message.senderName }}
                </button>
                <span v-else class="lc-sender is-mine">我</span>
                <span class="lc-time">{{ shortTime(message.createdAt) }}</span>
              </div>
              <p class="lc-bubble">{{ message.content }}</p>
            </div>
          </div>
        </template>
        <p v-else class="lc-empty">
          {{ chat.view === 'item' ? '还没有消息，来说第一句吧' : '还没有消息，发个消息打个招呼吧' }}
        </p>
      </div>

      <div class="lc-input">
        <textarea
          v-model="draft"
          rows="2"
          maxlength="500"
          :placeholder="chat.view === 'item' ? '就这条失物信息发言，Enter 发送' : '输入私聊消息，Enter 发送'"
          @keydown.enter.exact.prevent="send"
        ></textarea>
        <el-button type="primary" :icon="Promotion" :disabled="!draft.trim()" @click="send">
          发送
        </el-button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.lc-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 2000;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #ffffff;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.38);
  transition: transform 0.2s, box-shadow 0.2s;
}

.lc-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.45);
}

.lc-panel {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  width: 360px;
  height: 540px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
}

.lc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.lc-header-main {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.lc-heading {
  min-width: 0;
}

.lc-status {
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border-radius: 50%;
}

.lc-status.is-online {
  background: #10b981;
}

.lc-status.is-offline {
  background: #f59e0b;
}

.lc-title {
  margin: 0;
  max-width: 220px;
  overflow: hidden;
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lc-subtitle {
  margin: 2px 0 0;
  color: #94a3b8;
  font-size: 12px;
}

.lc-thread-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 12px;
  background: #f8fafc;
}

.lc-thread {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  margin-bottom: 8px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
}

.lc-thread:hover {
  border-color: #bfdbfe;
  background: #f0f7ff;
}

.lc-thread-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.lc-thread-title {
  overflow: hidden;
  color: #0f172a;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lc-thread-time {
  flex: 0 0 auto;
  color: #94a3b8;
  font-size: 12px;
}

.lc-thread-last {
  overflow: hidden;
  color: #64748b;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lc-conversations {
  display: flex;
  gap: 8px;
  padding: 10px 14px;
  overflow-x: auto;
  border-bottom: 1px solid #f1f5f9;
}

.lc-conversation {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 120px;
  max-width: 150px;
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
}

.lc-conversation.is-active {
  border-color: #2563eb;
  background: #eff6ff;
}

.lc-conversation-name {
  color: #0f172a;
  font-size: 13px;
  font-weight: 600;
}

.lc-conversation-last {
  overflow: hidden;
  width: 100%;
  color: #94a3b8;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lc-conversation-empty {
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.6;
}

.lc-body {
  flex: 1;
  min-height: 0;
  padding: 14px;
  overflow-y: auto;
  background: #f8fafc;
}

.lc-message {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.lc-message.is-mine {
  flex-direction: row-reverse;
}

.lc-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  border-radius: 50%;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 600;
}

.lc-message.is-mine .lc-avatar {
  background: #2563eb;
  color: #ffffff;
}

.lc-message-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 78%;
}

.lc-message.is-mine .lc-message-main {
  align-items: flex-end;
}

.lc-message-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #94a3b8;
  font-size: 12px;
}

.lc-sender {
  padding: 0;
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 12px;
  cursor: pointer;
}

.lc-sender.is-mine {
  color: #64748b;
  cursor: default;
}

.lc-bubble {
  margin: 0;
  padding: 8px 12px;
  border-radius: 10px;
  background: #ffffff;
  color: #1e293b;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.lc-message.is-mine .lc-bubble {
  background: #2563eb;
  color: #ffffff;
}

.lc-empty {
  margin: 40px 0;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.8;
  text-align: center;
}

.lc-input {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  padding: 10px 12px;
  border-top: 1px solid #f1f5f9;
}

.lc-input textarea {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  resize: none;
  outline: none;
}

.lc-input textarea:focus {
  border-color: #2563eb;
}

@media (max-width: 600px) {
  .lc-panel {
    right: 12px;
    bottom: 12px;
    left: 12px;
    width: auto;
    height: 70vh;
  }

  .lc-fab {
    right: 16px;
    bottom: 16px;
  }
}
</style>
