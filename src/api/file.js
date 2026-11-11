import axios from 'axios'
import request from './request'

/**
 * 文件服务接口：分片上传、小文件批量上传、文件列表与 Range 分段下载。
 * 全局 request 的响应拦截器已经把 axios 响应解包成后端的 { code, message, data }，
 * 这里统一再取一层 data，页面拿到的就是接口 data 字段本身。
 */

function unwrap(res) {
  if (!res || res.code !== 1) throw new Error((res && res.message) || '请求失败')
  return res.data
}

/* ==================== 大文件分片上传 ==================== */

/**
 * 初始化上传：服务端返回 uploadId、最终采用的 chunkSize 与已存在的分片列表，
 * 断点续传（刷新后重新 init 仍是同一个 uploadId）就靠 uploadedChunks 判断。
 */
export async function initUpload({ fileName, fileSize, fileMd5, chunkSize, totalChunks }) {
  const res = await request.post('/file/init', {
    fileName,
    fileSize,
    fileMd5,
    chunkSize,
    totalChunks
  })
  return unwrap(res)
}

// 上传单个分片：chunkMd5 必须与分片内容一致，服务端据此判断分片是否损坏
export async function uploadChunk({ uploadId, index, chunkMd5, blob, onProgress, signal }) {
  const fd = new FormData()
  fd.append('uploadId', uploadId)
  fd.append('index', index)
  fd.append('chunkMd5', chunkMd5)
  fd.append('file', blob)
  const res = await request.post('/file/chunk', fd, {
    signal,
    timeout: 0,
    onUploadProgress: (e) => {
      if (onProgress) onProgress(e.total ? e.loaded / e.total : Math.min(1, e.loaded / blob.size))
    }
  })
  return unwrap(res)
}

// 分片全部到齐后合并
export async function mergeUpload({ uploadId }) {
  const res = await request.post('/file/merge', { uploadId })
  return unwrap(res)
}

/* ==================== 小文件批量上传 ==================== */

// 多个文件都用同一个字段名 files 追加
export async function uploadSmall({ files, onProgress }) {
  const fd = new FormData()
  files.forEach((file) => fd.append('files', file))
  const total = files.reduce((sum, file) => sum + file.size, 0)
  const res = await request.post('/file/small', fd, {
    timeout: 0,
    onUploadProgress: (e) => {
      if (onProgress) {
        onProgress(e.total ? e.loaded / e.total : total ? Math.min(1, e.loaded / total) : 0)
      }
    }
  })
  return unwrap(res)
}

/* ==================== 下载 ==================== */

/**
 * 下载要读取 Content-Range 响应头，而全局实例的拦截器只返回 response.data，
 * 所以这里单独建一个实例，同样注入登录令牌，但保留完整响应头。
 */
const downloadClient = axios.create({ baseURL: '/api', timeout: 0 })
downloadClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('rbac_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 从 "bytes start-end/total" 里解析出文件总大小
function parseContentRange(value) {
  if (!value) return null
  const match = /\/\s*(\d+)/.exec(value)
  return match ? Number(match[1]) : null
}

// 下载失败时把 blob 错误体还原成后端 message
async function toRangeError(error) {
  if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') return error
  const status = error.response && error.response.status
  let message = error.message
  const body = error.response && error.response.data
  if (body instanceof Blob) {
    try {
      const json = JSON.parse(await body.text())
      if (json && json.message) message = json.message
    } catch {
      // 错误体不是 JSON 就保留原提示
    }
  } else if (body && body.message) {
    message = body.message
  }
  if (status === 416) message = '下载范围越界（Range 不被接受）'
  const err = new Error(message)
  err.status = status
  return err
}

/**
 * 按 Range 下载一段字节，返回 { blob, status, contentRange, total }。
 * 服务端正常返回 206 Partial Content 并带 Content-Range；范围越界会返回 416。
 */
export async function downloadRange(fileId, start, end, signal) {
  const headers = {}
  if (typeof start === 'number' && typeof end === 'number') {
    headers.Range = `bytes=${start}-${end}`
  }
  try {
    const res = await downloadClient.get(`/file/download/${fileId}`, {
      headers,
      responseType: 'blob',
      signal
    })
    return {
      blob: res.data,
      status: res.status,
      contentRange: res.headers['content-range'] || '',
      total: parseContentRange(res.headers['content-range'])
    }
  } catch (error) {
    throw await toRangeError(error)
  }
}

/* ==================== 文件列表 ==================== */

export async function listFiles() {
  const res = await request.get('/file/list')
  return unwrap(res) || []
}
