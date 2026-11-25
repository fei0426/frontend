<script setup>
/**
 * 登录页专用的轻量输入框。
 * 只保留实际用到的能力（文本/密码、最大长度、回车、密码可见切换），
 * 用原生 input 实现，避免为登录页加载整个 Element Plus。
 */
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  maxlength: { type: [String, Number], default: undefined },
  autocomplete: { type: String, default: undefined }
})

const emit = defineEmits(['update:modelValue'])

const reveal = ref(false)
const inputType = computed(() => (props.type === 'password' && reveal.value ? 'text' : props.type))

function onInput(event) {
  emit('update:modelValue', event.target.value)
}
</script>

<template>
  <div class="ni">
    <input
      class="ni-input"
      :type="inputType"
      :value="modelValue"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :autocomplete="autocomplete"
      @input="onInput"
    />
    <button
      v-if="type === 'password'"
      type="button"
      class="ni-eye"
      :aria-label="reveal ? '隐藏密码' : '显示密码'"
      @click="reveal = !reveal"
    >
      {{ reveal ? '隐藏' : '显示' }}
    </button>
  </div>
</template>

<style scoped>
.ni {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.ni-input {
  width: 100%;
  height: 40px;
  box-sizing: border-box;
  padding: 0 12px;
  font-family: inherit;
  font-size: 14px;
  color: #303133;
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.ni-input::placeholder {
  color: #a8abb2;
}

.ni-input:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 1px #409eff inset;
}

.ni:has(.ni-eye) .ni-input {
  padding-right: 58px;
}

.ni-eye {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  padding: 4px 8px;
  font-family: inherit;
  font-size: 12px;
  color: #94a3b8;
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
}

.ni-eye:hover {
  color: #2563eb;
  background: #eff6ff;
}
</style>
