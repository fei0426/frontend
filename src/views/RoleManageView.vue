<script setup>
import { nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Key, Plus, Refresh, Search } from '@element-plus/icons-vue'

import {
  createRole,
  deleteRole,
  getRoleList,
  getRolePermissionIds,
  saveRolePermissions,
  updateRole
} from '../api/role'
import { getPermissionTree } from '../api/permission'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const query = reactive({ pageNum: 1, pageSize: 10, keyword: '' })

const dialogVisible = ref(false)
const dialogMode = ref('create')
const formRef = ref(null)
const form = reactive({
  roleId: '',
  code: '',
  name: '',
  description: '',
  dataScope: 'SELF',
  enabled: true
})

const permissionVisible = ref(false)
const permissionLoading = ref(false)
const permissionTree = ref([])
const permissionTreeRef = ref(null)
const currentRole = ref(null)

const dataScopes = [
  { value: 'ALL', label: '全部数据' },
  { value: 'DEPT_AND_SUB', label: '本部门及下级' },
  { value: 'DEPT', label: '本部门' },
  { value: 'SELF', label: '仅本人' }
]

const rules = {
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    {
      pattern: /^[A-Z][A-Z0-9_]{1,31}$/,
      message: '角色编码需为 2-32 位大写字母、数字或下划线',
      trigger: 'blur'
    }
  ],
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 32, message: '角色名称需为 2-32 字', trigger: 'blur' }
  ],
  dataScope: [{ required: true, message: '请选择数据范围', trigger: 'change' }]
}

function scopeLabel(scope) {
  return dataScopes.find((item) => item.value === scope)?.label || scope || '-'
}

async function fetchList() {
  loading.value = true
  try {
    const data = await getRoleList(query)
    list.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, {
    roleId: '',
    code: '',
    name: '',
    description: '',
    dataScope: 'SELF',
    enabled: true
  })
  formRef.value?.clearValidate()
}

function openCreate() {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
}

function openEdit(row) {
  dialogMode.value = 'edit'
  Object.assign(form, {
    roleId: row.roleId,
    code: row.code,
    name: row.name,
    description: row.description || '',
    dataScope: row.dataScope,
    enabled: row.enabled
  })
  dialogVisible.value = true
}

async function submitForm() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  if (dialogMode.value === 'create') {
    await createRole({
      code: form.code,
      name: form.name,
      dataScope: form.dataScope,
      description: form.description || undefined,
      permissionCodes: []
    })
    ElMessage.success('角色创建成功')
  } else {
    await updateRole(form.roleId, {
      name: form.name,
      dataScope: form.dataScope,
      enabled: form.enabled
    })
    ElMessage.success('角色修改成功')
  }

  dialogVisible.value = false
  fetchList()
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除角色“${row.name}”吗？有关联用户时不能删除。`,
      '删除确认',
      { type: 'warning' }
    )
  } catch {
    return
  }
  await deleteRole(row.roleId)
  ElMessage.success('角色已删除')
  fetchList()
}

async function openPermissions(row) {
  currentRole.value = row
  permissionVisible.value = true
  permissionLoading.value = true
  try {
    const [tree, checkedIds] = await Promise.all([
      getPermissionTree(),
      getRolePermissionIds(row.roleId)
    ])
    permissionTree.value = tree || []
    await nextTick()
    permissionTreeRef.value?.setCheckedKeys(checkedIds || [])
  } finally {
    permissionLoading.value = false
  }
}

async function savePermissions() {
  const checked = permissionTreeRef.value?.getCheckedKeys(false) || []
  const halfChecked = permissionTreeRef.value?.getHalfCheckedKeys() || []
  const permIds = [...new Set([...checked, ...halfChecked])]
  await saveRolePermissions(currentRole.value.roleId, permIds)
  ElMessage.success('角色权限已保存')
  permissionVisible.value = false
  fetchList()
}

function search() {
  query.pageNum = 1
  fetchList()
}

onMounted(fetchList)
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h2 class="page-title">角色管理</h2>
        <p class="page-desc">维护角色、数据范围和角色可访问的菜单按钮权限。</p>
      </div>
      <el-button
        v-permission="'system:role:create'"
        type="primary"
        :icon="Plus"
        @click="openCreate"
      >
        新增角色
      </el-button>
    </div>

    <div class="panel">
      <div class="toolbar">
        <el-input
          v-model="query.keyword"
          :prefix-icon="Search"
          placeholder="搜索角色名称或编码"
          clearable
          style="width: 280px"
          @keyup.enter="search"
        />
        <el-button type="primary" @click="search">查询</el-button>
        <el-button :icon="Refresh" @click="query.keyword = ''; search()">重置</el-button>
      </div>

      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column prop="code" label="角色编码" min-width="140">
          <template #default="{ row }">
            <span class="perm-code">{{ row.code }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="角色名称" width="130" />
        <el-table-column label="数据范围" width="150">
          <template #default="{ row }">{{ scopeLabel(row.dataScope) }}</template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="220" show-overflow-tooltip />
        <el-table-column label="权限数" width="90" align="center">
          <template #default="{ row }">{{ row.permissionCodes?.length || 0 }}</template>
        </el-table-column>
        <el-table-column prop="userCount" label="用户数" width="90" align="center" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" effect="plain">
              {{ row.enabled ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button
              v-permission="'system:role:assign'"
              link
              type="primary"
              :icon="Key"
              @click="openPermissions(row)"
            >
              授权
            </el-button>
            <el-button
              v-permission="'system:role:update'"
              link
              type="primary"
              :icon="Edit"
              @click="openEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-permission="'system:role:delete'"
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

      <div class="pagination">
        <el-pagination
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          background
          @current-change="fetchList"
          @size-change="search"
        />
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增角色' : '编辑角色'"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="角色编码" prop="code">
          <el-input
            v-model="form.code"
            :disabled="dialogMode === 'edit'"
            placeholder="如：COUNSELOR"
          />
        </el-form-item>
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" placeholder="如：辅导员" />
        </el-form-item>
        <el-form-item label="数据范围" prop="dataScope">
          <el-select v-model="form.dataScope" style="width: 100%">
            <el-option
              v-for="scope in dataScopes"
              :key="scope.value"
              :label="scope.label"
              :value="scope.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="dialogMode === 'edit'" label="启用状态">
          <el-switch v-model="form.enabled" active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="角色说明">
          <el-input v-model="form.description" type="textarea" :rows="3" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="permissionVisible"
      :title="`角色授权：${currentRole?.name || ''}`"
      width="640px"
      :close-on-click-modal="false"
    >
      <div v-loading="permissionLoading" class="permission-tree">
        <el-tree
          ref="permissionTreeRef"
          :data="permissionTree"
          node-key="id"
          show-checkbox
          default-expand-all
          :props="{ label: 'name', children: 'children' }"
        >
          <template #default="{ data }">
            <span class="tree-node">
              <span>{{ data.name }}</span>
              <span class="perm-code muted">{{ data.permissionCode }}</span>
            </span>
          </template>
        </el-tree>
      </div>
      <template #footer>
        <el-button @click="permissionVisible = false">取消</el-button>
        <el-button type="primary" @click="savePermissions">保存授权</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.permission-tree {
  min-height: 320px;
  max-height: 520px;
  overflow-y: auto;
  padding: 8px 4px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
