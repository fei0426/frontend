<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { initUpload, uploadChunk, mergeUpload, uploadSmall, setSimulateBadChunk } from '../api/file'

const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB 一片
const CONCURRENCY = 3 // 同时上传 3 片

// 演示开关：打开后下一个分片必定校验失败，用来演示“重传失败分片”
const simulateBad = ref(false)

/* ---------- 大文件分片上传 ---------- */
const bigFile = ref(null)
const uploading = ref(false)
const fileProgress = ref(0)
const chunkTotal = ref(0)
const chunkDone = ref(0)
const failedChunks = ref([])

const chunkBytes = new Map() // 每个分片已传的字节数
let uploadId = ''
let chunks = []

function pickBig(e) {
  bigFile.value = e.target.files[0] || null
  fileProgress.value = 0
  chunkTotal.value = 0
  chunkDone.value = 0
  failedChunks.value = []
  chunkBytes.clear()
}

function refreshProgress() {
  let sum = 0
  chunkBytes.forEach((v) => (sum += v))
  fileProgress.value = Math.min(100, Math.round((sum / bigFile.value.size) * 100))
}

async function startUpload() {
  if (!bigFile.value) return ElMessage.warning('先选一个大文件')
  const file = bigFile.value
  uploading.value = true
  failedChunks.value = []
  chunkBytes.clear()
  fileProgress.value = 0

  // 1）切片
  chunks = []
  for (let i = 0; i * CHUNK_SIZE < file.size; i++) {
    chunks.push(file.slice(i * CHUNK_SIZE, Math.min((i + 1) * CHUNK_SIZE, file.size)))
  }
  chunkTotal.value = chunks.length
  chunkDone.value = 0

  // 2）初始化：服务端告诉你哪些分片已经有了
  const { uploadId: id, uploadedChunks } = await initUpload({
    fileName: file.name,
    fileSize: file.size,
    chunkSize: CHUNK_SIZE,
    fileMd5: `${file.name}-${file.size}-${file.lastModified}`
  })
  uploadId = id

  const exist = new Set(uploadedChunks || [])
  exist.forEach((i) => chunkBytes.set(i, chunks[i].size))
  chunkDone.value = exist.size
  refreshProgress()
  if (exist.size) ElMessage.info(`服务端已有 ${exist.size} 个分片，自动跳过`)

  // 3）并发上传剩余分片
  setSimulateBadChunk(simulateBad.value)
  const pending = chunks
    .map((blob, index) => ({ blob, index }))
    .filter((x) => !exist.has(x.index))
  await runPool(pending)

  // 4）有失败分片就停下来等重传，不自动合并
  if (failedChunks.value.length) {
    uploading.value = false
    return ElMessage.error(`${failedChunks.value.length} 个分片失败，点“重传失败分片”`)
  }
  await doMerge()
}

async function runPool(tasks) {
  let cursor = 0
  const worker = async () => {
    while (cursor < tasks.length) await sendChunk(tasks[cursor++])
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
}

async function sendChunk({ blob, index }, retry = 2) {
  try {
    await uploadChunk({
      uploadId,
      index,
      blob,
      onProgress: (p) => {
        chunkBytes.set(index, Math.round(blob.size * p))
        refreshProgress()
      }
    })
    chunkBytes.set(index, blob.size)
    chunkDone.value++
    refreshProgress()
  } catch (e) {
    if (retry > 0) return sendChunk({ blob, index }, retry - 1) // 自动重试 2 次
    failedChunks.value.push(index)
    refreshProgress()
  }
}

// 只重传失败的那几片，不重复传已成功的
async function retransmit() {
  setSimulateBadChunk(false) // 重传时关掉模拟损坏，保证这次能成功
  const list = failedChunks.value.slice()
  failedChunks.value = []
  uploading.value = true
  await runPool(list.map((index) => ({ blob: chunks[index], index })))
  if (failedChunks.value.length) {
    uploading.value = false
    return ElMessage.error('仍有分片失败，请再试一次')
  }
  await doMerge()
}

async function doMerge() {
  await mergeUpload({ uploadId, fileName: bigFile.value.name, totalChunks: chunkTotal.value })
  fileProgress.value = 100
  uploading.value = false
  ElMessage.success('分片全部到齐，后端合并成功')
}

/* ---------- 小文件批量上传 ---------- */
const smallFiles = ref([])
const smallTasks = ref([])

function pickSmall(e) {
  smallFiles.value = Array.from(e.target.files)
  smallTasks.value = smallFiles.value.map((f) =>
    reactive({ name: f.name, size: f.size, progress: 0, status: '待上传' })
  )
}

async function startSmall() {
  if (!smallFiles.value.length) return ElMessage.warning('先选文件')
  for (let i = 0; i < smallFiles.value.length; i++) {
    const task = smallTasks.value[i]
    task.status = '上传中'
    await uploadSmall({
      file: smallFiles.value[i],
      onProgress: (p) => (task.progress = Math.round(p * 100))
    })
    task.progress = 100
    task.status = '完成'
  }
  ElMessage.success(`批量上传完成，共 ${smallFiles.value.length} 个文件`)
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
      <input type="file" @change="pickBig" />
      <p v-if="bigFile" style="margin: 8px 0; color: #666">
        {{ bigFile.name }} · {{ (bigFile.size / 1024 / 1024).toFixed(1) }} MB · 分
        {{ chunkTotal || Math.ceil(bigFile.size / CHUNK_SIZE) }} 片
      </p>
      <el-progress :percentage="fileProgress" :stroke-width="18" />
      <p style="color: #999; font-size: 13px">
        已传分片 {{ chunkDone }} / {{ chunkTotal }}，失败 {{ failedChunks.length }} 片
      </p>
      <el-button type="primary" :loading="uploading" :disabled="!bigFile" @click="startUpload">
        开始上传
      </el-button>
      <el-button v-if="failedChunks.length" type="warning" :loading="uploading" @click="retransmit">
        重传失败分片
      </el-button>
      <div style="margin-top: 10px; color: #999; font-size: 13px">
        <el-switch v-model="simulateBad" /> 故障注入：模拟分片校验失败（演示重传逻辑用）
      </div>
    </div>

    <!-- 小文件 -->
    <div class="panel">
      <h3>小文件批量上传</h3>
      <input type="file" multiple @change="pickSmall" />
      <el-button
        type="primary"
        style="margin-top: 8px"
        :disabled="!smallFiles.length"
        @click="startSmall"
      >
        批量上传
      </el-button>
      <el-table :data="smallTasks" style="margin-top: 12px" empty-text="还没有选择文件">
        <el-table-column prop="name" label="文件名" />
        <el-table-column label="进度" width="240">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" />
      </el-table>
    </div>
  </div>
</template>
