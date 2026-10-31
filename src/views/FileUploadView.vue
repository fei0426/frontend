<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import SparkMD5 from 'spark-md5'
import { initUpload, uploadChunk, mergeUpload, uploadSmall } from '../api/file'

const CHUNK_SIZE = 5 * 1024 * 1024 // 建议分片大小 5MB，实际切分以 init 返回的 chunkSize 为准
const READ_SIZE = 2 * 1024 * 1024 // 计算 MD5 时每次读取 2MB，避免大文件一次性读入卡死
const CONCURRENCY = 3 // 同时上传 3 片
const MAX_RETRY = 2 // 单个分片失败自动重试 2 次

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

// 用 FileReader 分段读成 ArrayBuffer，交给 spark-md5 累计
function readAsArrayBuffer(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error || new Error('读取文件失败'))
    reader.readAsArrayBuffer(blob)
  })
}

// 整文件真实 MD5（32 位小写十六进制）
async function calcFileMd5(file, onProgress) {
  const spark = new SparkMD5.ArrayBuffer()
  for (let offset = 0; offset < file.size; offset += READ_SIZE) {
    const buf = await readAsArrayBuffer(file.slice(offset, Math.min(offset + READ_SIZE, file.size)))
    spark.append(buf)
    if (onProgress) onProgress(Math.min(1, (offset + buf.byteLength) / file.size))
  }
  return spark.end()
}

// 单个分片真实 MD5
async function calcChunkMd5(blob) {
  return SparkMD5.ArrayBuffer.hash(await readAsArrayBuffer(blob))
}

/* ---------- 大文件分片上传 ---------- */
const bigFile = ref(null)
const hashing = ref(false)
const md5Percent = ref(0)
const fileMd5 = ref('')
const uploading = ref(false)
const fileProgress = ref(0)
const chunkTotal = ref(0)
const chunkDone = ref(0)
const failedChunks = ref([])
const mergeResult = ref(null)

const chunkBytes = new Map() // 每个分片已上传的字节数，进度按真实字节累计
let uploadId = ''
let uploadChunkSize = CHUNK_SIZE
let chunks = [] // 按服务端 chunkSize 切好的分片
let hashToken = 0 // 换文件时让上一次的 MD5 计算失效

function resetBig() {
  fileProgress.value = 0
  chunkTotal.value = 0
  chunkDone.value = 0
  failedChunks.value = []
  chunkBytes.clear()
  mergeResult.value = null
  uploadId = ''
  chunks = []
  fileMd5.value = ''
  md5Percent.value = 0
}

async function pickBig(e) {
  const file = e.target.files[0] || null
  resetBig()
  bigFile.value = file
  if (!file) return

  const token = ++hashToken
  hashing.value = true
  try {
    const md5 = await calcFileMd5(file, (p) => {
      if (token === hashToken) md5Percent.value = Math.round(p * 100)
    })
    if (token !== hashToken) return
    fileMd5.value = md5
    md5Percent.value = 100
  } catch (err) {
    if (token === hashToken) ElMessage.error(err.message || '文件 MD5 计算失败')
  } finally {
    if (token === hashToken) hashing.value = false
  }
}

function refreshProgress() {
  if (!bigFile.value || !bigFile.value.size) return
  let sum = 0
  chunkBytes.forEach((v) => (sum += v))
  fileProgress.value = Math.min(100, Math.round((sum / bigFile.value.size) * 100))
}

async function startUpload() {
  if (!bigFile.value) return ElMessage.warning('请先选择文件')
  if (hashing.value) return ElMessage.warning('正在计算文件 MD5，请稍候')
  if (!fileMd5.value) return ElMessage.warning('文件 MD5 尚未就绪')

  const file = bigFile.value
  // 一个分片就能装下的文件走小文件批量接口，字段名同样是 files
  if (file.size <= CHUNK_SIZE) return uploadBigAsSmall(file)

  uploading.value = true
  failedChunks.value = []
  chunkBytes.clear()
  chunkDone.value = 0
  fileProgress.value = 0
  mergeResult.value = null

  try {
    const init = await initUpload({
      fileName: file.name,
      fileSize: file.size,
      fileMd5: fileMd5.value,
      chunkSize: CHUNK_SIZE,
      totalChunks: Math.ceil(file.size / CHUNK_SIZE)
    })
    uploadId = init.uploadId
    uploadChunkSize = init.chunkSize || CHUNK_SIZE

    // 必须按服务端返回的 chunkSize 切分
    chunks = []
    for (let i = 0; i * uploadChunkSize < file.size; i++) {
      chunks.push(file.slice(i * uploadChunkSize, Math.min((i + 1) * uploadChunkSize, file.size)))
    }
    chunkTotal.value = chunks.length

    // 断点续传：服务端已有的分片直接记为已上传，跳过
    const exist = new Set(init.uploadedChunks || [])
    exist.forEach((i) => {
      if (chunks[i]) {
        chunkBytes.set(i, chunks[i].size)
        chunkDone.value++
      }
    })
    refreshProgress()
    if (exist.size) ElMessage.info(`服务端已有 ${exist.size} 个分片，自动跳过`)

    if (init.completed) return doMerge()

    const pending = chunks
      .map((blob, index) => ({ blob, index }))
      .filter((item) => !exist.has(item.index))
    await runPool(pending)

    if (failedChunks.value.length) {
      uploading.value = false
      return ElMessage.error(`${failedChunks.value.length} 个分片上传失败，可点击“重传失败分片”`)
    }
    await doMerge()
  } catch (err) {
    uploading.value = false
    ElMessage.error(err.message || '上传失败')
  }
}

// 小文件批量接口只发一次请求，进度用请求整体进度
async function uploadBigAsSmall(file) {
  uploading.value = true
  fileProgress.value = 0
  try {
    const res = await uploadSmall({
      files: [file],
      onProgress: (p) => (fileProgress.value = Math.round(p * 100))
    })
    const item = (res.files && res.files[0]) || {}
    if (!item.success) throw new Error(item.message || '上传失败')
    mergeResult.value = {
      fileName: item.fileName || file.name,
      fileSize: item.fileSize || file.size,
      storageBackend: item.storageBackend,
      storageKey: item.storageKey,
      fileUrl: item.fileUrl
    }
    fileProgress.value = 100
    ElMessage.success('文件不超过一个分片，已通过小文件接口上传成功')
  } catch (err) {
    ElMessage.error(err.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

async function runPool(tasks) {
  let cursor = 0
  const worker = async () => {
    while (cursor < tasks.length) await sendChunk(tasks[cursor++])
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
}

async function sendChunk({ blob, index }, attempt = 0) {
  try {
    const chunkMd5 = await calcChunkMd5(blob)
    chunkBytes.set(index, 0)
    await uploadChunk({
      uploadId,
      index,
      chunkMd5,
      blob,
      onProgress: (p) => {
        chunkBytes.set(index, Math.round(blob.size * p))
        refreshProgress()
      }
    })
    chunkBytes.set(index, blob.size)
    chunkDone.value++
    refreshProgress()
  } catch (err) {
    chunkBytes.set(index, 0)
    refreshProgress()
    // 409 表示服务端判定分片损坏，直接记入失败列表，交给“重传失败分片”
    if (err.response?.status === 409) {
      failedChunks.value.push(index)
      ElMessage.error(err.response?.data?.message || `第 ${index} 片校验失败`)
      return
    }
    if (attempt < MAX_RETRY) return sendChunk({ blob, index }, attempt + 1)
    failedChunks.value.push(index)
  }
}

// 只重传失败的那几片，成功的不再重复上传
async function retransmit() {
  if (!uploadId) return
  const list = failedChunks.value.slice()
  failedChunks.value = []
  uploading.value = true
  await runPool(list.map((index) => ({ blob: chunks[index], index })))
  if (failedChunks.value.length) {
    uploading.value = false
    return ElMessage.error('仍有分片上传失败，请再试一次')
  }
  await doMerge()
}

async function doMerge() {
  try {
    const res = await mergeUpload({ uploadId })
    mergeResult.value = {
      fileName: res.fileName,
      fileSize: res.fileSize,
      storageBackend: res.storageBackend,
      storageKey: res.storageKey,
      fileUrl: res.fileUrl
    }
    fileProgress.value = 100
    ElMessage.success('分片全部到齐，后端合并成功')
  } catch (err) {
    ElMessage.error(err.message || '合并失败')
  } finally {
    uploading.value = false
  }
}

/* ---------- 小文件批量上传 ---------- */
const smallFiles = ref([])
const smallLoading = ref(false)
const smallProgress = ref(0)
const smallResults = ref([])

function pickSmall(e) {
  smallFiles.value = Array.from(e.target.files || [])
  smallResults.value = smallFiles.value.map((f) => ({
    name: f.name,
    size: f.size,
    status: '待上传',
    message: '',
    storageKey: ''
  }))
  smallProgress.value = 0
}

async function startSmall() {
  if (!smallFiles.value.length) return ElMessage.warning('请先选择文件')
  const list = smallFiles.value.slice()

  smallLoading.value = true
  smallProgress.value = 0
  smallResults.value = list.map((f) => ({
    name: f.name,
    size: f.size,
    status: '上传中',
    message: '',
    storageKey: ''
  }))

  try {
    const res = await uploadSmall({
      files: list,
      onProgress: (p) => (smallProgress.value = Math.round(p * 100))
    })
    const items = res.files || []
    smallResults.value = list.map((f, i) => {
      const item = items[i] || {}
      return {
        name: item.fileName || f.name,
        size: item.fileSize ?? f.size,
        status: item.success ? '成功' : '失败',
        message: item.message || '',
        storageKey: item.storageKey || ''
      }
    })
    smallProgress.value = 100
    const failed = res.failureCount || 0
    if (failed) ElMessage.warning(`批量上传完成，${failed} 个文件失败`)
    else ElMessage.success(`批量上传完成，共 ${res.successCount || list.length} 个文件`)
  } catch (err) {
    smallResults.value.forEach((item) => {
      item.status = '失败'
      item.message = err.message || '上传失败'
    })
    ElMessage.error(err.message || '批量上传失败')
  } finally {
    smallLoading.value = false
  }
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h2 class="page-title">文件上传</h2>
        <p class="page-desc">大文件切片上传、坏片重传；小文件批量上传。</p>
      </div>
    </div>

    <!-- 大文件 -->
    <div class="panel" style="margin-bottom: 16px">
      <h3>大文件分片上传</h3>
      <input type="file" :disabled="uploading" @change="pickBig" />
      <p v-if="bigFile" style="margin: 8px 0; color: #666">
        {{ bigFile.name }} · {{ formatSize(bigFile.size) }} · 分
        {{ chunkTotal || Math.ceil(bigFile.size / CHUNK_SIZE) }} 片
      </p>
      <p v-if="bigFile && hashing" style="margin: 8px 0; color: #409eff">
        正在计算 MD5… {{ md5Percent }}%
      </p>
      <p v-else-if="fileMd5" style="margin: 8px 0; color: #999; font-size: 13px">
        MD5：{{ fileMd5 }}
      </p>
      <el-progress :percentage="fileProgress" :stroke-width="18" />
      <p style="color: #999; font-size: 13px">
        已传分片 {{ chunkDone }} / {{ chunkTotal }}，失败 {{ failedChunks.length }} 片
      </p>
      <el-button
        type="primary"
        :loading="uploading"
        :disabled="!bigFile || hashing || !fileMd5"
        @click="startUpload"
      >
        开始上传
      </el-button>
      <el-button v-if="failedChunks.length" type="warning" :loading="uploading" @click="retransmit">
        重传失败分片
      </el-button>

      <div v-if="mergeResult" style="margin-top: 12px; color: #666; font-size: 13px">
        <p style="margin: 4px 0">文件名：{{ mergeResult.fileName }}</p>
        <p style="margin: 4px 0">文件大小：{{ formatSize(mergeResult.fileSize) }}</p>
        <p style="margin: 4px 0">storageKey：{{ mergeResult.storageKey }}</p>
        <p v-if="mergeResult.storageBackend" style="margin: 4px 0">
          存储后端：{{ mergeResult.storageBackend }}
        </p>
        <p v-if="mergeResult.fileUrl" style="margin: 4px 0">访问地址：{{ mergeResult.fileUrl }}</p>
      </div>
    </div>

    <!-- 小文件 -->
    <div class="panel">
      <h3>小文件批量上传</h3>
      <input type="file" multiple :disabled="smallLoading" @change="pickSmall" />
      <el-button
        type="primary"
        style="margin-top: 8px"
        :disabled="!smallFiles.length"
        :loading="smallLoading"
        @click="startSmall"
      >
        批量上传
      </el-button>
      <el-progress
        v-if="smallLoading"
        :percentage="smallProgress"
        style="margin-top: 12px"
        stroke-width="18"
      />
      <el-table :data="smallResults" style="margin-top: 12px" empty-text="还没有选择文件">
        <el-table-column prop="name" label="文件名" />
        <el-table-column label="大小" width="120">
          <template #default="{ row }">{{ formatSize(row.size) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" />
        <el-table-column prop="message" label="说明" />
        <el-table-column prop="storageKey" label="storageKey" width="220" show-overflow-tooltip />
      </el-table>
    </div>
  </div>
</template>
