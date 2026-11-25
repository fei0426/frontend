<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, DocumentChecked, UploadFilled } from '@element-plus/icons-vue'

import { findService } from '../mock/services'

const route = useRoute()
const router = useRouter()

const service = computed(() => findService(route.params.id))
const formRef = ref(null)
const form = reactive({})
const uploading = reactive({})

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
    item: service.value.name,
    form: { ...form },
    attachmentCount: Object.values(uploading).reduce(
      (sum, list) => sum + (list?.length || 0),
      0
    )
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
  console.log('提交申请', buildPayload())
  ElMessage.success('申请已提交，可在“我的申请”中查看进度')
  router.push('/my-requests')
}

function handleDraft() {
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

  <div v-else class="apply-page">
    <header class="page-head">
      <div>
        <el-button :icon="ArrowLeft" link @click="router.push('/services')">
          返回服务大厅
        </el-button>
        <h1 class="page-title">{{ service.name }}</h1>
        <p class="page-desc">
          {{ service.summary }}
        </p>
      </div>
      <el-tag type="info" effect="plain">{{ service.department }}</el-tag>
    </header>

    <div class="apply-layout">
      <aside class="apply-side">
        <section class="panel apply-brief">
          <div class="brief-icon">
            <el-icon><DocumentChecked /></el-icon>
          </div>
          <h2>办理须知</h2>
          <p>{{ service.summary }}</p>

          <dl class="brief-list">
            <div>
              <dt>办理部门</dt>
              <dd>{{ service.department }}</dd>
            </div>
            <div>
              <dt>办理时限</dt>
              <dd>{{ service.sla }}</dd>
            </div>
            <div>
              <dt>所需材料</dt>
              <dd>{{ service.materials }}</dd>
            </div>
          </dl>

          <div class="brief-note">
            提交后可在“我的申请”中跟踪审核与办理进度。
          </div>
        </section>
      </aside>

      <section class="panel form-panel">
        <div class="form-heading">
          <div>
            <h2>填写申请信息</h2>
            <p>带 * 的字段为必填项。请确认联系方式和办理信息准确。</p>
          </div>
          <span class="form-state">申请表单</span>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="apply-form"
        >
          <div class="form-grid">
            <el-form-item
              v-for="field in service.fields"
              :key="field.key"
              :label="field.label"
              :prop="field.key"
              :class="{ 'field-wide': field.type === 'textarea' || field.type === 'upload' }"
            >
              <el-input
                v-if="field.type === 'text'"
                v-model="form[field.key]"
                :placeholder="field.placeholder || `请输入${field.label}`"
              />

              <el-input
                v-else-if="field.type === 'textarea'"
                v-model="form[field.key]"
                type="textarea"
                :rows="5"
                :placeholder="field.placeholder || `请填写${field.label}`"
              />

              <el-select
                v-else-if="field.type === 'select'"
                v-model="form[field.key]"
                :placeholder="`请选择${field.label}`"
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
                  drag
                >
                  <el-icon class="upload-icon"><UploadFilled /></el-icon>
                  <div class="el-upload__text">
                    将文件拖到此处，或 <em>选择文件</em>
                  </div>
                  <template #tip>
                    <div class="muted upload-tip">
                      {{ field.tip || '支持 jpg / png / pdf，最多上传 3 个文件' }}
                    </div>
                  </template>
                </el-upload>
              </div>
            </el-form-item>
          </div>
        </el-form>

        <div class="form-foot">
          <div>
            <el-button type="primary" @click="handleSubmit">提交申请</el-button>
            <el-button @click="handleDraft">保存草稿</el-button>
          </div>
          <span class="muted">提交后可在“我的申请”中查看进度</span>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.apply-page {
  max-width: 1480px;
  margin: 0 auto;
}

.page-head :deep(.el-button.is-link) {
  margin-bottom: 10px;
  color: var(--sp-muted);
}

.apply-layout {
  display: grid;
  grid-template-columns: minmax(260px, 0.36fr) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.apply-side {
  position: sticky;
  top: 20px;
}

.apply-brief {
  padding: 22px;
}

.brief-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 11px;
  background: var(--sp-sage);
  color: var(--sp-primary-strong);
  font-size: 21px;
}

.apply-brief h2 {
  margin: 16px 0 8px;
  color: var(--sp-ink);
  font-size: 18px;
  font-weight: 650;
}

.apply-brief > p {
  margin: 0;
  color: var(--sp-muted);
  font-size: 12px;
  line-height: 1.65;
}

.brief-list {
  display: grid;
  gap: 14px;
  margin: 22px 0;
}

.brief-list div {
  display: grid;
  gap: 4px;
}

.brief-list dt {
  color: var(--sp-faint);
  font-size: 10px;
  font-weight: 650;
}

.brief-list dd {
  margin: 0;
  color: var(--sp-text);
  font-size: 12px;
  line-height: 1.55;
}

.brief-note {
  padding: 12px;
  border-radius: 9px;
  background: var(--sp-surface-soft);
  color: var(--sp-muted);
  font-size: 11px;
  line-height: 1.6;
}

.form-panel {
  padding: 24px;
}

.form-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--sp-border);
}

.form-heading h2 {
  margin: 0 0 6px;
  color: var(--sp-ink);
  font-size: 20px;
  font-weight: 650;
}

.form-heading p {
  margin: 0;
  color: var(--sp-muted);
  font-size: 12px;
}

.form-state {
  padding: 4px 9px;
  border-radius: 999px;
  background: var(--sp-sage);
  color: var(--sp-primary-strong);
  font-size: 10px;
  font-weight: 650;
  white-space: nowrap;
}

.apply-form {
  padding-top: 22px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 22px;
}

.field-wide {
  grid-column: 1 / -1;
}

.apply-form :deep(.el-input),
.apply-form :deep(.el-select),
.apply-form :deep(.el-date-editor) {
  width: 100%;
}

.upload-block {
  width: 100%;
}

.upload-block :deep(.el-upload) {
  width: 100%;
}

.upload-block :deep(.el-upload-dragger) {
  width: 100%;
  padding: 26px 18px;
  border: 1px dashed var(--sp-border-strong);
  border-radius: 10px;
  background: var(--sp-surface-soft);
}

.upload-block :deep(.el-upload-dragger:hover) {
  border-color: var(--sp-primary);
  background: var(--sp-sage);
}

.upload-icon {
  margin-bottom: 8px;
  color: var(--sp-primary);
  font-size: 28px;
}

.upload-tip {
  padding-top: 7px;
  text-align: left;
}

.form-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 8px;
  padding-top: 20px;
  border-top: 1px solid var(--sp-border);
}

@media (max-width: 1180px) {
  .apply-layout {
    grid-template-columns: 1fr;
  }

  .apply-side {
    position: static;
  }
}
</style>
