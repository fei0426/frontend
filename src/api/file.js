import request from './request'

/**
 * 后端接口还没合入时保持 true，前端可独立演示；
 * A/B 的接口就绪后改成 false，页面代码不用动。
 */
export const USE_MOCK = true

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// 演示用：指定第 0 片连续 3 次校验失败（正好耗尽前端自动重试），保证能演示“重传失败分片”
let badChunkIndex = -1
let badChunkAttempts = 0

export function setSimulateBadChunk(v) {
  badChunkIndex = v ? 0 : -1
  badChunkAttempts = 0
}

/* ==================== 大文件分片上传 ==================== */

const mockUploads = new Map()
let mockSeq = 1

// 初始化：拿 uploadId + 服务端已存在的分片列表（断点续传就靠这个）
export function initUpload({ fileName, fileSize, chunkSize, fileMd5 }) {
  if (!USE_MOCK) return request.post('/file/init', { fileName, fileSize, chunkSize, fileMd5 })
  const uploadId = `mock-${mockSeq++}`
  mockUploads.set(uploadId, { chunks: new Set(), fileName, fileSize })
  return Promise.resolve({ uploadId, uploadedChunks: [] })
}

// 上传单个分片
export function uploadChunk({ uploadId, index, blob, onProgress, signal }) {
  if (!USE_MOCK) {
    const fd = new FormData()
    fd.append('uploadId', uploadId)
    fd.append('index', index)
    fd.append('chunk', blob)
    return request.post('/file/chunk', fd, {
      signal,
      onUploadProgress: (e) => onProgress && onProgress(e.loaded / blob.size)
    })
  }
  return new Promise((resolve, reject) => {
    let loaded = 0
    const timer = setInterval(() => {
      loaded += blob.size / 5
      onProgress && onProgress(Math.min(loaded / blob.size, 1))
      if (loaded >= blob.size) {
        clearInterval(timer)
        // 开关打开时，固定让 badChunkIndex 那一片连续失败 3 次，把前端 2 次自动重试也耗光
        if (index === badChunkIndex && badChunkAttempts < 3) {
          badChunkAttempts++
          return reject(new Error('分片校验失败'))
        }
        // 平时保留约 8% 的随机损坏，模拟真实网络环境
        if (Math.random() < 0.08) return reject(new Error('分片校验失败'))
        mockUploads.get(uploadId)?.chunks.add(index)
        resolve({ index })
      }
    }, 150)
  })
}

// 全部分片到齐后通知后端合并
export function mergeUpload({ uploadId, fileName, totalChunks }) {
  if (!USE_MOCK) return request.post('/file/merge', { uploadId, fileName, totalChunks })
  return sleep(400).then(() => {
    // 合并成功后把文件放进模拟文件库，切到下载页就能看到
    const rec = mockUploads.get(uploadId)
    if (rec) mockFiles.unshift({ id: `up-${mockSeq++}`, name: fileName, size: rec.fileSize })
    return { fileUrl: `/files/${fileName}` }
  })
}

/* ==================== 小文件批量上传 ==================== */

export function uploadSmall({ file, onProgress }) {
  if (!USE_MOCK) {
    const fd = new FormData()
    fd.append('file', file)
    return request.post('/file/small', fd, {
      onUploadProgress: (e) => onProgress && onProgress(e.loaded / file.size)
    })
  }
  return new Promise((resolve) => {
    let p = 0
    const timer = setInterval(() => {
      p += 0.2
      onProgress && onProgress(Math.min(p, 1))
      if (p >= 1) {
        clearInterval(timer)
        // 小文件上传完成也进模拟文件库，下载页可见
        mockFiles.unshift({ id: `up-${mockSeq++}`, name: file.name, size: file.size })
        resolve({ ok: true })
      }
    }, 120)
  })
}

/* ==================== 下载 ==================== */

const mockFiles = [
  { id: 'demo-1', name: '校园通使用手册.pdf', size: 6 * 1024 * 1024 },
  { id: 'demo-2', name: '学期课表.xlsx', size: 2 * 1024 * 1024 },
  { id: 'demo-3', name: '宣传视频.mp4', size: 12 * 1024 * 1024 }
]

export function listFiles() {
  return USE_MOCK ? Promise.resolve(mockFiles) : request.get('/file/list')
}

/**
 * 按 Range 下载一段字节。
 * 服务端必须返回 206 Partial Content，否则说明没走 Range。
 */
export function downloadRange(fileId, start, end, signal) {
  if (!USE_MOCK) {
    return fetch(`/api/file/download/${fileId}`, {
      headers: { Range: `bytes=${start}-${end}` },
      signal
    }).then((res) => {
      if (res.status !== 206) throw new Error('服务端未返回 206，Range 下载没生效')
      return res.arrayBuffer()
    })
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(new Uint8Array(end - start + 1)), 200)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('已暂停', 'AbortError'))
    })
  })
}
