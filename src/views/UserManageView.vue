<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getUserList, getUserRole, assignUserRole } from '../api/user'
import { getAllRoles } from '../api/role'

// ========== 用户列表 ==========
const loading = ref(false)
const list = ref([])
const total = ref(0)
const query = reactive({
  pageNum: 1,
  pageSize: 10,
  keyword: ''
})

async function fetchList() {
  loading.value = true
  try {
    const res = await getUserList(query)
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.pageNum = 1
  fetchList()
}

function handlePageChange(page) {
  query.pageNum = page
  fetchList()
}

function handleSizeChange(size) {
  query.pageSize = size
  query.pageNum = 1
  fetchList()
}

// ========== 分配角色 ==========
const assignDialogVisible = ref(false)
const currentUser = ref(null)
const selectedRoleCode = ref(null)
const roleOptions = ref([])

// 打开分配角色弹窗
async function handleAssignRole(row) {
  currentUser.value = row
  // 加载所有角色
  if (roleOptions.value.length === 0) {
    roleOptions.value = await getAllRoles()
  }
  // 查询当前用户的角色
  const userRole = await getUserRole(row.userId)
  selectedRoleCode.value = userRole.roleCode
  assignDialogVisible.value = true
}

// 保存角色分配
async function saveAssignRole() {
  if (!selectedRoleCode.value) {
    ElMessage.warning('请选择角色')
    return
  }
  try {
    await assignUserRole(currentUser.value.userId, selectedRoleCode.value)
    ElMessage.success('分配成功')
    assignDialogVisible.value = false
    fetchList()
  } catch (e) {
    // 错误已在拦截器里提示
  }
}

// 状态标签
function statusTag(status) {
  if (status === 'ACTIVE') return 'success'
  if (status === 'LOCKED') return 'warning'
  return 'danger'
}

function statusText(status) {
  if (status === 'ACTIVE') return '正常'
  if (status === 'LOCKED') return '锁定'
  return '停用'
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="user-manage">
    <h2 class="page-title">用户管理</h2>
    <p class="page-desc">
      管理系统用户，可以给用户分配角色，一个用户对应一个角色。
    </p>

    <!-- 搜索栏 -->
    <el-form :inline="true" class="search-form">
      <el-form-item label="关键词">
        <el-input
          v-model="query.keyword"
          placeholder="账号/姓名/学号"
          clearable
          @keyup.enter="handleSearch"
          style="width: 220px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格 -->
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="userId" label="ID" width="80" />
      <el-table-column prop="userNo" label="学号/工号" width="120" />
      <el-table-column prop="name" label="姓名" width="100" />
      <el-table-column prop="deptName" label="部门" width="120" />
      <el-table-column label="角色" width="120">
        <template #default="{ row }">
          <el-tag v-if="row.roles && row.roles.length" type="info" effect="light">
            {{ row.roles.join('、') }}
          </el-tag>
          <span v-else style="color: #c0c4cc">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="mobile" label="手机号" width="130" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)" effect="light">
            {{ statusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            v-permission="'system:role:assign'"
            type="primary"
            link
            @click="handleAssignRole(row)"
          >
            分配角色
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 分配角色弹窗 -->
    <el-dialog
      v-model="assignDialogVisible"
      title="分配角色"
      width="420px"
      :close-on-click-modal="false"
    >
      <div v-if="currentUser" style="margin-bottom: 16px">
        <p style="margin: 0 0 8px; color: #606266">
          用户：<b>{{ currentUser.name }}</b>（{{ currentUser.userNo }}）
        </p>
        <p style="margin: 0; color: #909399; font-size: 13px">
          当前角色：{{ currentUser.roles && currentUser.roles.length ? currentUser.roles.join('、') : '未分配' }}
        </p>
      </div>
      <el-form label-width="80px">
        <el-form-item label="选择角色">
          <el-select
            v-model="selectedRoleCode"
            placeholder="请选择角色"
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="role in roleOptions"
              :key="role.id"
              :label="role.roleName"
              :value="role.roleCode"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAssignRole">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.user-manage {
  padding: 20px;
}

.page-title {
  margin: 0 0 8px;
  font-size: 20px;
}

.page-desc {
  margin: 0 0 20px;
  color: #909399;
  font-size: 14px;
}

.search-form {
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  text-align: right;
}
</style>
