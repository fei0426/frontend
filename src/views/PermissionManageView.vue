<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Plus, Refresh } from '@element-plus/icons-vue'

import {
  createPermission,
  deletePermission,
  getPermissionDetail,
  getPermissionTree,
  updatePermission
} from '../api/permission'

const loading = ref(false)
const tree = ref([])
const dialogVisible = ref(false)
const dialogMode = ref('create')
const formRef = ref(null)
const form = reactive({
  id: null,
  permCode: '',
  permName: '',
  permType: 1,
  parentId: 0,
  routePath: '',
  icon: '',
  sortNo: 0,
  status: 1
})

const rules = {
  permCode: [{ required: true, message: '请输入权限编码', trigger: 'blur' }],
  permName: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
  permType: [{ required: true, message: '请选择权限类型', trigger: 'change' }]
}

const flatNodes = computed(() => {
  const result = []
  const walk = (nodes, depth = 0) => {
    nodes.forEach((node) => {
      result.push({ ...node, depth })
      if (node.children?.length) walk(node.children, depth + 1)
    })
  }
  walk(tree.value)
  return result
})

function typeText(type) {
  return { MENU: '目录/菜单', FUNCTION: '功能按钮' }[type] || type
}

function typeTag(type) {
  return type === 'FUNCTION' ? 'warning' : 'primary'
}

async function fetchTree() {
  loading.value = true
  try {
    tree.value = await getPermissionTree()
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, {
    id: null,
    permCode: '',
    permName: '',
    permType: 1,
    parentId: 0,
    routePath: '',
    icon: '',
    sortNo: 0,
    status: 1
  })
  formRef.value?.clearValidate()
}

function openCreate(parent = null) {
  resetForm()
  dialogMode.value = 'create'
  if (parent) {
    form.parentId = parent.id
    form.permType = parent.type === 'FUNCTION' ? 3 : 2
    form.permCode = `${parent.permissionCode}:`
  }
  dialogVisible.value = true
}

async function openEdit(row) {
  const detail = await getPermissionDetail(row.id)
  dialogMode.value = 'edit'
  Object.assign(form, {
    id: detail.id,
    permCode: detail.permCode,
    permName: detail.permName,
    permType: detail.permType,
    parentId: detail.parentId || 0,
    routePath: detail.routePath || '',
    icon: detail.icon || '',
    sortNo: detail.sortNo || 0,
    status: detail.status ?? 1
  })
  dialogVisible.value = true
}

async function submitForm() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  const payload = {
    permCode: form.permCode,
    permName: form.permName,
    permType: form.permType,
    parentId: form.parentId || 0,
    routePath: form.routePath || null,
    icon: form.icon || null,
    sortNo: Number(form.sortNo) || 0,
    status: Number(form.status)
  }
  if (dialogMode.value === 'create') {
    await createPermission(payload)
    ElMessage.success('权限创建成功')
  } else {
    await updatePermission({ id: form.id, ...payload })
    ElMessage.success('权限修改成功')
  }
  dialogVisible.value = false
  fetchTree()
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除权限“${row.name}”吗？有子权限时不能删除。`,
      '删除确认',
      { type: 'warning' }
    )
  } catch {
    return
  }
  await deletePermission(row.id)
  ElMessage.success('权限已删除')
  fetchTree()
}

onMounted(fetchTree)
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h2 class="page-title">权限管理</h2>
        <p class="page-desc">按目录、菜单和功能按钮维护系统权限树。</p>
      </div>
      <div class="head-actions">
        <el-button :icon="Refresh" @click="fetchTree">刷新</el-button>
        <el-button
          v-permission="'system:permission:create'"
          type="primary"
          :icon="Plus"
          @click="openCreate()"
        >
          新增根权限
        </el-button>
      </div>
    </div>

    <div class="panel">
      <el-table
        v-loading="loading"
        :data="tree"
        row-key="id"
        border
        default-expand-all
        :tree-props="{ children: 'children' }"
      >
        <el-table-column prop="name" label="权限名称" min-width="240" />
        <el-table-column prop="permissionCode" label="权限编码" min-width="240">
          <template #default="{ row }">
            <span class="perm-code">{{ row.permissionCode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="110">
          <template #default="{ row }">
            <el-tag :type="typeTag(row.type)" effect="plain">{{ typeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="parentCode" label="父级编码" min-width="170">
          <template #default="{ row }">
            <span class="perm-code muted">{{ row.parentCode || '根节点' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button
              v-permission="'system:permission:create'"
              link
              type="primary"
              @click="openCreate(row)"
            >
              新增下级
            </el-button>
            <el-button
              v-permission="'system:permission:update'"
              link
              type="primary"
              :icon="Edit"
              @click="openEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-permission="'system:permission:delete'"
              link
              type="danger"
              :icon="Delete"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增权限' : '编辑权限'"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="权限编码" prop="permCode">
          <el-input v-model="form.permCode" placeholder="如：system:notice:publish" />
        </el-form-item>
        <el-form-item label="权限名称" prop="permName">
          <el-input v-model="form.permName" placeholder="如：发布通知" />
        </el-form-item>
        <el-form-item label="权限类型" prop="permType">
          <el-select v-model="form.permType" style="width: 100%">
            <el-option label="目录" :value="1" />
            <el-option label="菜单" :value="2" />
            <el-option label="功能按钮" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="上级权限">
          <el-select v-model="form.parentId" filterable clearable style="width: 100%">
            <el-option label="根节点" :value="0" />
            <el-option
              v-for="node in flatNodes"
              :key="node.id"
              :label="`${'　'.repeat(node.depth)}${node.name}（${node.permissionCode}）`"
              :value="node.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="路由地址">
          <el-input v-model="form.routePath" placeholder="如：/roles" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.icon" placeholder="如：Setting" />
        </el-form-item>
        <el-form-item label="排序号">
          <el-input-number v-model="form.sortNo" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.head-actions {
  display: flex;
  gap: 8px;
}
</style>
