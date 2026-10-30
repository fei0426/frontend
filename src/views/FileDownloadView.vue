<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { listFiles, downloadRange } from '../api/file'

const DOWNLOAD_CHUNK = 1024 * 1024 // 每次取 1MB

const files = ref([])
const tasks = ref([])
const parts = new Map() // 每个文件已下载的字节块
const controllers = new Map() // 用于暂停

async function load() {
  files.value = await listFiles()
}
load()

function startDownload(file) {
  if (
    tasks.value.some((t) => t.id === file.id && (t.status === '下载中' || t.status === '完成'))
  ) {
    return
  }
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
  try {
    // 循环按 Range 取数据：暂停后 received 不变，继续时从这里接着下
    while (task.received < task.size) {
      const end = Math.min(task.received + DOWNLOAD_CHUNK - 1, task.size - 1)
      const buf = await downloadRange(task.id, task.received, end, controller.signal)
      parts.get(task.id).push(buf)
      task.received += buf.byteLength
      task.progress = Math.round((task.received / task.size) * 100)
    }
    saveBlob(task)
    task.status = '完成'
  } catch (e) {
    if (e.name === 'AbortError') {
      task.status = '已暂停'
    } else {
      task.status = '失败'
      ElMessage.error(e.message)
    }
  }
}

function pause(task) {
  controllers.get(task.id)?.abort()
}

function resume(task) {
  runTask(task)
}

function saveBlob(task) {
  const blob = new Blob(parts.get(task.id))
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = task.name
  a.click()
  URL.revokeObjectURL(url)
}

// 同时开 3 个任务，验证高并发下载
function startAll() {
  tasks.value = []
  parts.clear()
  files.value.forEach(startDownload)
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h2 class="page-title">文件下载</h2>
        <p class="page-desc">Range 分块下载、暂停后继续、多文件并发。</p>
      </div>
      <el-button type="primary" @click="startAll">并发下载全部</el-button>
    </div>

    <div class="panel" style="margin-bottom: 16px">
      <el-table :data="files" empty-text="暂无文件">
        <el-table-column prop="name" label="文件名" />
        <el-table-column label="大小" width="120">
          <template #default="{ row }">{{ (row.size / 1024 / 1024).toFixed(1) }} MB</template>
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
        <el-table-column label="进度" width="260">
          <template #default="{ row }">
            <el-progress
              :percentage="row.progress"
              :status="row.status === '完成' ? 'success' : ''"
            />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" />
        <el-table-column label="操作" width="180">
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
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
