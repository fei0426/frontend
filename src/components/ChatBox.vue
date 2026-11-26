<script setup>
import { nextTick, ref } from 'vue'
import { ChatDotRound, Promotion, User } from '@element-plus/icons-vue'

import request from '../api/request'

const messages = ref([
  {
    role: 'assistant',
    text: '你好，我是校园通助手。你可以问我办事流程、校园服务、通知要求，以及材料准备问题。',
    citations: []
  }
])
const userInput = ref('')
const loading = ref(false)
const chatBodyRef = ref(null)
const sessionId = ref('')

const suggestions = [
  '宿舍报修多久能处理？',
  '在读证明需要准备哪些材料？',
  '图书馆借阅逾期怎么办？'
]

function citationText(citation) {
  return (
    citation.title ||
    citation.documentTitle ||
    citation.source ||
    citation.content ||
    '知识库引用'
  )
}

async function sendMessage(prefill) {
  const text = (prefill || userInput.value).trim()
  if (!text || loading.value) return

  messages.value.push({ role: 'user', text })
  userInput.value = ''
  loading.value = true
  await scrollToBottom()

  try {
    const res = await request.post('/chat', {
      query: text,
      sessionId: sessionId.value || undefined
    })
    if (!res || res.code !== 1) {
      throw new Error(res?.message || '问答服务返回异常')
    }
    const data = res.data || {}
    sessionId.value = data.sessionNo || sessionId.value
    messages.value.push({
      role: 'assistant',
      text: data.answer || '暂时没有找到回答，请换一种问法再试。',
      citations: data.citations || []
    })
  } catch {
    messages.value.push({
      role: 'assistant',
      text: '服务连接失败，请确认后端服务已经启动后重试。',
      citations: []
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

function handleKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <section class="chat-workbench">
    <header class="chat-head">
      <div class="chat-head-main">
        <span class="assistant-mark"><el-icon><ChatDotRound /></el-icon></span>
        <div>
          <h1>校园通智能问答</h1>
          <p>基于校园知识库回答办事流程与服务问题，并展示参考来源。</p>
        </div>
      </div>
      <span class="assistant-state">
        <i />
        服务在线
      </span>
    </header>

    <div ref="chatBodyRef" class="chat-body">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="chat-message"
        :class="msg.role === 'user' ? 'msg-user' : 'msg-assistant'"
      >
        <span class="msg-avatar">
          <el-icon>
            <User v-if="msg.role === 'user'" />
            <ChatDotRound v-else />
          </el-icon>
        </span>

        <div class="msg-content">
          <span class="msg-role">{{ msg.role === 'user' ? '我' : '校园通助手' }}</span>
          <div class="msg-bubble">
            <p>{{ msg.text }}</p>
            <div v-if="msg.citations?.length" class="citations">
              <span class="citation-label">参考来源</span>
              <el-tag
                v-for="(citation, citationIndex) in msg.citations"
                :key="citationIndex"
                size="small"
                effect="plain"
              >
                {{ citationText(citation) }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="chat-message msg-assistant">
        <span class="msg-avatar"><el-icon><ChatDotRound /></el-icon></span>
        <div class="msg-content">
          <span class="msg-role">校园通助手</span>
          <div class="msg-bubble msg-loading">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>

    <footer class="chat-composer">
      <div v-if="messages.length <= 2" class="suggestion-row">
        <span>可以这样问</span>
        <button
          v-for="suggestion in suggestions"
          :key="suggestion"
          type="button"
          @click="sendMessage(suggestion)"
        >
          {{ suggestion }}
        </button>
      </div>

      <div class="composer-box">
        <textarea
          v-model="userInput"
          rows="2"
          placeholder="输入校园服务问题，按 Enter 发送，Shift + Enter 换行"
          @keydown="handleKeydown"
        />
        <div class="composer-foot">
          <span>回答仅供参考，请以学校正式通知为准</span>
          <el-button
            type="primary"
            :icon="Promotion"
            :disabled="loading || !userInput.trim()"
            @click="sendMessage()"
          >
            {{ loading ? '思考中' : '发送' }}
          </el-button>
        </div>
      </div>
    </footer>
  </section>
</template>

<style scoped>
.chat-workbench {
  display: flex;
  min-height: calc(100vh - 154px);
  max-width: 1120px;
  margin: 0 auto;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-panel);
  background: var(--sp-surface);
}

.chat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--sp-border);
}

.chat-head-main {
  display: flex;
  align-items: center;
  gap: 13px;
}

.assistant-mark {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 11px;
  background: var(--sp-sage);
  color: var(--sp-primary-strong);
  font-size: 20px;
}

.chat-head h1 {
  margin: 0;
  color: var(--sp-ink);
  font-size: 20px;
  font-weight: 650;
}

.chat-head p {
  margin: 5px 0 0;
  color: var(--sp-muted);
  font-size: 12px;
}

.assistant-state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--sp-muted);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.assistant-state i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--sp-primary);
  box-shadow: 0 0 0 3px rgba(31, 107, 87, 0.12);
}

.chat-body {
  display: flex;
  flex: 1;
  min-height: 380px;
  max-height: calc(100vh - 390px);
  flex-direction: column;
  gap: 22px;
  overflow-y: auto;
  padding: 26px 28px;
  background: #fbfcfa;
}

.chat-message {
  display: flex;
  align-items: flex-start;
  gap: 11px;
}

.msg-user {
  flex-direction: row-reverse;
}

.msg-avatar {
  display: grid;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  place-items: center;
  border-radius: 9px;
  background: var(--sp-sage);
  color: var(--sp-primary-strong);
  font-size: 15px;
}

.msg-user .msg-avatar {
  background: var(--sp-surface-tint);
  color: var(--sp-text);
}

.msg-content {
  display: grid;
  max-width: min(76%, 760px);
  gap: 6px;
}

.msg-user .msg-content {
  justify-items: end;
}

.msg-role {
  color: var(--sp-muted);
  font-size: 10px;
  font-weight: 600;
}

.msg-bubble {
  padding: 13px 16px;
  border: 1px solid var(--sp-border);
  border-radius: 4px 12px 12px;
  background: var(--sp-surface);
  color: var(--sp-text);
  font-size: 14px;
  line-height: 1.75;
}

.msg-user .msg-bubble {
  border-color: var(--sp-primary);
  border-radius: 12px 4px 12px 12px;
  background: var(--sp-primary);
  color: #fff;
}

.msg-bubble p {
  margin: 0;
  white-space: pre-wrap;
}

.citations {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
  margin-top: 11px;
  padding-top: 9px;
  border-top: 1px solid var(--sp-border);
}

.citation-label {
  color: var(--sp-muted);
  font-size: 10px;
  font-weight: 650;
}

.msg-loading {
  display: flex;
  align-items: center;
  gap: 5px;
  min-height: 42px;
}

.msg-loading span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--sp-primary);
  animation: chat-bounce 1.2s infinite ease-in-out;
}

.msg-loading span:nth-child(2) {
  animation-delay: 0.15s;
}

.msg-loading span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes chat-bounce {
  0%,
  80%,
  100% {
    transform: scale(0.55);
    opacity: 0.35;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.chat-composer {
  padding: 14px 20px 20px;
  border-top: 1px solid var(--sp-border);
  background: var(--sp-surface);
}

.suggestion-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.suggestion-row > span {
  color: var(--sp-muted);
  font-size: 10px;
  font-weight: 600;
}

.suggestion-row button {
  padding: 6px 10px;
  border: 1px solid var(--sp-border);
  border-radius: 999px;
  background: var(--sp-surface-soft);
  color: var(--sp-text);
  font-size: 11px;
  cursor: pointer;
}

.suggestion-row button:hover {
  border-color: var(--sp-primary);
  color: var(--sp-primary-strong);
}

.composer-box {
  padding: 10px 12px 9px;
  border: 1px solid var(--sp-border-strong);
  border-radius: 12px;
  background: var(--sp-surface);
}

.composer-box:focus-within {
  border-color: var(--sp-primary);
  box-shadow: 0 0 0 3px rgba(31, 107, 87, 0.1);
}

.composer-box textarea {
  width: 100%;
  min-height: 48px;
  padding: 2px;
  border: 0;
  background: transparent;
  color: var(--sp-text);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.6;
  outline: none;
  resize: none;
}

.composer-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px solid #edf1ee;
}

.composer-foot > span {
  color: var(--sp-faint);
  font-size: 10px;
}
</style>
