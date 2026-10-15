<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, UploadFilled } from '@element-plus/icons-vue'

import { findService } from '../mock/services'

const route = useRoute()
const router = useRouter()

const service = computed(() => findService(route.params.id))

const formRef = ref(null)
const form = reactive({})
const uploading = reactive({})

/** 切换事项时重新初始化表单，避免沿用上一条事项的字段值 */
function resetForm() {
  Object.keys(form).forEach((key) => delete form[key])
  Object.keys(uploading).forEach((key) => delete uploading[key])
  service.value?.fields.forEach((field) => {
    form[field.key] = ''
    uploading[field.key] = []
  })
}

watch(() => route.params.id, resetForm, { immediate: true })

const rules = computed(() => {
  const result = {}
  service.value?.fields.forEach((field) => {
    if (field.required) {
      result[field.key] = [
        { required: true, message: `请填写${field.label}`, trigger: 'blur' }
      ]
    }
  })
  return result
})

function onFileChange(field, file, fileList) {
  uploading[field.key] = fileList
}

function onFileRemove(field, file, fileList) {
  uploading[field.key] = fileList
}

function buildPayload() {
  return {
    事项: service.value.name,
    表单: { ...form },
    附件数: Object.values(uploading).reduce((sum, list) => sum + (list?.length || 0), 0)
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    ElMessage.warning('还有必填项没有填写')
    return
  }
  // 接口就绪后改成 POST /api/service/requests
  console.log('提交申请', buildPayload())
  ElMessage.success('申请已提交，可在「我的申请」查看进度')
  router.push('/my-requests')
}

function handleDraft() {
  // 接口就绪后改成保存草稿
  console.log('保存草稿', buildPayload())
  ElMessage.info('草稿已保存')
}
</script>

<template>
  <div v-if="!service">
    <el-empty description="没有找到这个事项">
      <el-button type="primary" @click="router.push('/services')">返回服务事项</el-button>
    </el-empty>
  </div>

  <div v-else>
    <div class="page-head">
      <div>
        <el-button :icon="ArrowLeft" link @click="router.push('/services')">返回</el-button>
        <h2 class="page-title">{{ service.name }}</h2>
        <p class="page-desc">
          办理部门：{{ service.department }} · 办理时限：{{ service.sla }}
        </p>
      </div>
    </div>

    <div class="panel">
      <p class="service-summary">{{ service.summary }}</p>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item
          v-for="field in service.fields"
          :key="field.key"
          :label="field.label"
          :prop="field.key"
        >
          <el-input
            v-if="field.type === 'text'"
            v-model="form[field.key]"
            :placeholder="field.placeholder || `请输入${field.label}`"
            style="max-width: 420px"
          />

          <el-input
            v-else-if="field.type === 'textarea'"
            v-model="form[field.key]"
            type="textarea"
            :rows="4"
            :placeholder="field.placeholder || `请填写${field.label}`"
            style="max-width: 620px"
          />

          <el-select
            v-else-if="field.type === 'select'"
            v-model="form[field.key]"
            :placeholder="`请选择${field.label}`"
            style="max-width: 240px"
          >
            <el-option v-for="opt in field.options" :key="opt" :label="opt" :value="opt" />
          </el-select>

          <el-date-picker
            v-else-if="field.type === 'date'"
            v-model="form[field.key]"
            type="date"
            value-format="YYYY-MM-DD"
            :placeholder="`请选择${field.label}`"
          />

          <div v-else-if="field.type === 'upload'" class="upload-block">
            <el-upload
              :auto-upload="false"
              :limit="3"
              :file-list="uploading[field.key]"
              :on-change="(file, list) => onFileChange(field, file, list)"
              :on-remove="(file, list) => onFileRemove(field, file, list)"
            >
              <el-button :icon="UploadFilled">选择文件</el-button>
              <template #tip>
                <div class="muted">{{ field.tip || '支持 jpg / png / pdf' }}</div>
              </template>
            </el-upload>
          </div>
        </el-form-item>
      </el-form>

      <div class="form-foot">
        <el-button type="primary" @click="handleSubmit">提交申请</el-button>
        <el-button @click="handleDraft">保存草稿</el-button>
        <span class="muted">提交后可在「我的申请」查看进度</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.service-summary {
  margin: 0 0 20px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.upload-block {
  width: 100%;
}

.form-foot {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 8px;
  border-top: 1px solid #f2f3f5;
  margin-top: 8px;
}
</style>
