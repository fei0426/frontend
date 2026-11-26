import request from './request'

/**
 * 失物招领实时聊天接口（消息发送走 WebSocket，这里只有读与建会话）。
 */

/** 某条失物信息下的公开消息，afterId 用于增量拉取 */
export async function fetchItemMessagesApi(itemId, afterId) {
  const response = await request.get(`/v1/lostfound/chat/items/${itemId}/messages`, {
    params: afterId ? { afterId } : {}
  })
  return response.data || []
}

/** 有消息的失物信息列表 */
export async function fetchThreadsApi() {
  const response = await request.get('/v1/lostfound/chat/threads')
  return response.data || []
}

/** 我的私聊会话列表 */
export async function fetchConversationsApi() {
  const response = await request.get('/v1/lostfound/chat/conversations')
  return response.data || []
}

/** 创建或复用与某位用户的私聊会话 */
export async function createConversationApi(peerUserId, itemId) {
  const response = await request.post('/v1/lostfound/chat/conversations', {
    peerUserId,
    itemId: itemId || 0
  })
  return response.data || {}
}

/** 私聊历史消息 */
export async function fetchPrivateMessagesApi(conversationId, afterId) {
  const response = await request.get(
    `/v1/lostfound/chat/conversations/${conversationId}/messages`,
    { params: afterId ? { afterId } : {} }
  )
  return response.data || []
}
