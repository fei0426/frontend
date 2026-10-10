<script setup>
import { ref, nextTick } from 'vue'

const messages = ref([
  { role: 'assistant', text: '你好！我是校园通助手，有什么可以帮你的？' }
])
const userInput = ref('')
const loading = ref(false)
const chatBodyRef = ref(null)

async function sendMessage() {
  const text = userInput.value.trim()
  if (!text || loading.value) return

  messages.value.push({ role: 'user', text })
  userInput.value = ''
  loading.value = true
  await scrollToBottom()

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: text })
    })
    const data = await res.json()
    messages.value.push({
      role: 'assistant',
      text: data.answer || '(暂无回复)'
    })
  } catch (err) {
    messages.value.push({
      role: 'assistant',
      text: '⚠️ 服务连接失败，请确认后端已启动（端口 10086）'
    })
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}

async function scrollToBottom() {
  await nextTick()
  if (chatBodyRef.value) {
    chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
  }
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <div class="chat-container">
    <div class="chat-body" ref="chatBodyRef">
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="chat-message"
        :class="msg.role === 'user' ? 'msg-user' : 'msg-assistant'"
      >
        <div class="msg-avatar">{{ msg.role === 'user' ? '🙋' : '🤖' }}</div>
        <div class="msg-bubble">{{ msg.text }}</div>
      </div>
      <div v-if="loading" class="chat-message msg-assistant">
        <div class="msg-avatar">🤖</div>
        <div class="msg-bubble msg-loading">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
    <div class="chat-input">
      <textarea
        v-model="userInput"
        @keydown="handleKeydown"
        placeholder="输入你的问题，按 Enter 发送..."
        rows="2"
      ></textarea>
      <button @click="sendMessage" :disabled="loading || !userInput.trim()">
        {{ loading ? '思考中...' : '发送' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  width: 100%;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  height: 70vh;
  background: #f8fafc;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-message {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.msg-user {
  flex-direction: row-reverse;
}

.msg-avatar {
  font-size: 24px;
  flex-shrink: 0;
}

.msg-bubble {
  max-width: 70%;
  padding: 10px 16px;
  border-radius: 14px;
  line-height: 1.6;
  font-size: 14px;
  word-break: break-word;
}

.msg-user .msg-bubble {
  background: #4f46e5;
  color: white;
  border-top-right-radius: 4px;
}

.msg-assistant .msg-bubble {
  background: white;
  color: #1e293b;
  border-top-left-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.msg-loading {
  display: flex;
  gap: 4px;
  align-items: center;
}

.msg-loading span {
  width: 8px;
  height: 8px;
  background: #94a3b8;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.msg-loading span:nth-child(2) { animation-delay: 0.2s; }
.msg-loading span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.chat-input {
  display: flex;
  gap: 10px;
  padding: 12px;
  background: white;
  border-top: 1px solid #e2e8f0;
}

.chat-input textarea {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  resize: none;
  outline: none;
  font-family: inherit;
}

.chat-input textarea:focus {
  border-color: #4f46e5;
}

.chat-input button {
  padding: 10px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.chat-input button:hover:not(:disabled) {
  background: #4338ca;
}

.chat-input button:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}
</style>
