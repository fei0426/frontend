<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { listFiles, downloadRange } from '../api/file'

const DOWNLOAD_CHUNK = 2 * 1024 * 1024 // 每段 2MB

const files = ref([])
const loading = ref(false)
const tasks = ref([])
const parts = new Map() // 每个文件已下载完成的分段 Blob
const controllers = new Map() // 用于暂停当前请求

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function formatTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

// 暂停时 axios 抛的是 CanceledError，要单独识别
function isCanceled(err) {
  return err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError'
}

async function load() {
  loading.value = true
  try {
    files.value = await listFiles()
  } catch (err) {
    ElMessage.error(err.message || '获取文件列表失败')
  } finally {
    loading.value = false
  }
}
load()

function startDownload(file) {
  const existing = tasks.value.find((t) => t.id === file.id)
  if (existing) {
    if (existing.status === '失败') {
      // 失败的任务允许重来，先把旧的本地记录清掉
      tasks.value = tasks.value.filter((t) => t.id !== file.id)
      parts.delete(file.id)
    } else {
      return ElMessage.info(`${file.name} 已在下载任务中`)
    }
  }
  if (!file.size) return ElMessage.warning('该文件大小未知，无法分段下载')

  const task = reactive({
    id: file.id,
    name: file.name,
    size: file.size,
    received: 0,
    progress: 0,
    status: '下载中'
  })
  parts.set(file.id, [])
  tasks.value.push(task)
  runTask(task)
}

async function runTask(task) {
  const controller = new AbortController()
  controllers.set(task.id, controller)
  task.status = '下载中'

  const list = parts.get(task.id) || []
  parts.set(task.id, list)

  try {
    // 按 Range 逐段下载：暂停后 received 不变，继续时从这里接着下
    while (task.received < task.size) {
      const start = task.received
      const end = Math.min(start + DOWNLOAD_CHUNK - 1, task.size - 1)
      const { blob, status } = await downloadRange(task.id, start, end, controller.signal)
      // 带了 Range 却不是 206，说明服务端没按范围返回，拼接会出错
      if (start > 0 && status !== 206) throw new Error('服务端未按 Range 返回，无法续传')
      list.push(blob)
      task.received += blob.size
      task.progress = Math.min(100, Math.round((task.received / task.size) * 100))
    }
    saveBlob(task)
    task.progress = 100
    task.status = '完成'
  } catch (err) {
    if (isCanceled(err)) {
      task.status = '已暂停'
    } else {
      task.status = '失败'
      ElMessage.error(err.message || '下载失败')
    }
  } finally {
    controllers.delete(task.id)
  }
}

function pause(task) {
  controllers.get(task.id)?.abort()
}

function resume(task) {
  if (task.status !== '已暂停') return
  runTask(task)
}

function saveBlob(task) {
  const blob = new Blob(parts.get(task.id) || [])
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = task.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// 批量下载：列表里的文件全部加入任务
function startAll() {
  files.value.forEach(startDownload)
}

// 删除本地任务记录，不影响服务端文件
function removeTask(task) {
  controllers.get(task.id)?.abort()
  controllers.delete(task.id)
  parts.delete(task.id)
  tasks.value = tasks.value.filter((t) => t.id !== task.id)
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h2 class="page-title">文件下载</h2>
        <p class="page-desc">Range 分块下载、暂停后继续、多文件并发。</p>
      </div>
      <div>
        <el-button :loading="loading" @click="load">刷新列表</el-button>
        <el-button type="primary" @click="startAll">批量下载全部</el-button>
      </div>
    </div>

    <div class="panel" style="margin-bottom: 16px">
      <el-table :data="files" v-loading="loading" empty-text="暂无文件">
        <el-table-column prop="name" label="文件名" />
        <el-table-column label="大小" width="120">
          <template #default="{ row }">{{ formatSize(row.size) }}</template>
        </el-table-column>
        <el-table-column label="上传时间" width="200">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="startDownload(row)">下载</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="panel">
      <h3>下载任务</h3>
      <el-table :data="tasks" empty-text="还没有下载任务">
        <el-table-column prop="name" label="文件名" />
        <el-table-column label="进度" width="300">
          <template #default="{ row }">
            <el-progress
              :percentage="row.progress"
              :status="row.status === '完成' ? 'success' : ''"
            />
            <span style="color: #999; font-size: 12px">
              {{ formatSize(row.received) }} / {{ formatSize(row.size) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" />
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button v-if="row.status === '下载中'" size="small" @click="pause(row)">暂停</el-button>
            <el-button
              v-if="row.status === '已暂停'"
              size="small"
              type="primary"
              @click="resume(row)"
            >
              继续
            </el-button>
            <el-button size="small" type="danger" plain @click="removeTask(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
