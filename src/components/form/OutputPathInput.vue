<template>
  <div class="output-path-input">
    <label for="outputPath" class="form-label">Output Folder Path</label>
    <div class="input-container">
      <input
        id="outputPath"
        :value="modelValue"
        @input="updateValue"
        type="text"
        class="path-input"
        :class="{ 'has-error': error }"
        placeholder="e.g., /home/user/output or C:\Users\username\Documents\output"
        required
      />
      <div class="input-footer">
        <div class="validation-status">
          <span v-if="isValidPath && modelValue.trim()" class="status-indicator valid">
            <span class="status-dot"></span>
            Valid path format
          </span>
          <span v-else-if="modelValue.trim()" class="status-indicator invalid">
            <span class="status-dot"></span>
            Invalid path format
          </span>
          <span v-else class="status-indicator empty">
            <span class="status-dot"></span>
            Enter output folder path
          </span>
        </div>
      </div>
    </div>
    <div v-if="error" class="error-message">
      <span class="error-icon">⚠️</span>
      {{ error }}
    </div>
    <div class="help-text">
      Specify the full path where job output files should be saved
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: string;
  error: string | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'validate': [];
}>();

const isValidPath = computed(() => {
  const path = props.modelValue.trim();
  if (!path) return false;
  
  const unixPattern = /^(\/|~)/;
  const windowsPattern = /^([A-Za-z]:|\\\\)/;
  
  return unixPattern.test(path) || windowsPattern.test(path);
});

const updateValue = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
  emit('validate');
};
</script>

<style scoped>
.output-path-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #1a1d29;
}

.input-container {
  position: relative;
  border: 2px solid #e8eaed;
  border-radius: 12px;
  background: #fafbfc;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.input-container:focus-within {
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.input-container:has(.has-error) {
  border-color: #ea4335;
  background: #fef7f7;
}

.path-input {
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 16px;
  font-size: 14px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  line-height: 1.6;
  background: transparent;
  color: #1a1d29;
}

.path-input:focus {
  outline: none;
}

.path-input::placeholder {
  color: #9aa0a6;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

.input-footer {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  background: rgba(250, 251, 252, 0.8);
  border-radius: 0 0 10px 10px;
}

.validation-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-indicator.valid {
  color: #00b894;
}

.status-indicator.valid .status-dot {
  background: #00b894;
}

.status-indicator.invalid {
  color: #ea4335;
}

.status-indicator.invalid .status-dot {
  background: #ea4335;
}

.status-indicator.empty {
  color: #9aa0a6;
}

.status-indicator.empty .status-dot {
  background: #9aa0a6;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ea4335;
  font-size: 14px;
  padding: 12px 16px;
  background: #fef7f7;
  border-radius: 8px;
  border: 1px solid #fce8e6;
}

.error-icon {
  font-size: 16px;
}

.help-text {
  color: #5f6368;
  font-size: 13px;
  line-height: 1.4;
}
</style>