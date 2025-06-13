<template>
  <div class="job-submission">
    <div class="submission-header">
      <div class="header-content">
        <h3 class="section-title">Submit New Job</h3>
        <p class="section-subtitle">Queue a new job to {{ pool.name }}</p>
      </div>
    </div>

    <form @submit.prevent="submitJob" class="submission-form">
      <div class="form-section">
        <label for="outputPath" class="form-label">Output Folder Path</label>
        <div class="input-container">
          <input
            id="outputPath"
            v-model="outputPath"
            type="text"
            class="path-input"
            :class="{ 'has-error': outputPathError }"
            placeholder="e.g., /home/user/output or C:\Users\username\Documents\output"
            required
          />
          <div class="input-footer">
            <div class="validation-status">
              <span v-if="isValidPath && outputPath.trim()" class="status-indicator valid">
                <span class="status-dot"></span>
                Valid path format
              </span>
              <span v-else-if="outputPath.trim()" class="status-indicator invalid">
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
        <div v-if="outputPathError" class="error-message">
          <span class="error-icon">⚠️</span>
          {{ outputPathError }}
        </div>
        <div class="help-text">
          Specify the full path where job output files should be saved
        </div>
      </div>

      <div class="form-section">
        <label for="payload" class="form-label">Job Payload</label>
        <div class="textarea-container">
          <textarea
            id="payload"
            v-model="payloadText"
            class="payload-textarea"
            :class="{ 'has-error': payloadError }"
            placeholder='{\n  "task": "example_task",\n  "parameters": {\n    "input": "sample_data",\n    "timeout": 300\n  }\n}'
            rows="10"
          ></textarea>
          <div class="textarea-footer">
            <div class="validation-status">
              <span v-if="isValidJson && payloadText.trim()" class="status-indicator valid">
                <span class="status-dot"></span>
                Valid JSON
              </span>
              <span v-else-if="payloadText.trim()" class="status-indicator invalid">
                <span class="status-dot"></span>
                Invalid JSON
              </span>
              <span v-else class="status-indicator empty">
                <span class="status-dot"></span>
                Enter JSON payload
              </span>
            </div>
            <div class="character-count">
              {{ payloadText.length }} characters
            </div>
          </div>
        </div>
        <div v-if="payloadError" class="error-message">
          <span class="error-icon">⚠️</span>
          {{ payloadError }}
        </div>
        <div class="help-text">
          Enter valid JSON data that will be passed to the worker for processing
        </div>
      </div>

      <div class="form-actions">
        <button
          type="submit"
          class="submit-button"
          :disabled="loading || !payloadText.trim() || !isValidJson || !outputPath.trim() || !isValidPath"
        >
          <span v-if="loading" class="loading-spinner"></span>
          <span class="button-text">{{ loading ? 'Submitting...' : 'Submit Job' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ApiService } from '../services/api';
import type { Pool, Job } from '../types';

const props = defineProps<{
  pool: Pool;
  userId: string;
}>();

const emit = defineEmits<{
  'job-submitted': [job: Job];
}>();

const outputPath = ref('');
const outputPathError = ref<string | null>(null);
const payloadText = ref('{\n  "task": "example_task",\n  "parameters": {\n    "input": "sample_data",\n    "timeout": 300\n  }\n}');
const payloadError = ref<string | null>(null);
const loading = ref(false);

const isValidJson = computed(() => {
  try {
    JSON.parse(payloadText.value);
    return true;
  } catch {
    return false;
  }
});

const isValidPath = computed(() => {
  const path = outputPath.value.trim();
  if (!path) return false;
  
  // Basic path validation - check for common path patterns
  // Unix/Linux paths: start with / or ~
  // Windows paths: start with drive letter (C:) or UNC (\\)
  const unixPattern = /^(\/|~)/;
  const windowsPattern = /^([A-Za-z]:|\\\\)/;
  
  return unixPattern.test(path) || windowsPattern.test(path);
});

const validateOutputPath = () => {
  outputPathError.value = null;
  
  if (!outputPath.value.trim()) {
    outputPathError.value = 'Output folder path is required';
    return false;
  }
  
  if (!isValidPath.value) {
    outputPathError.value = 'Please enter a valid folder path (e.g., /home/user/output or C:\\Users\\username\\Documents\\output)';
    return false;
  }
  
  return true;
};

const validatePayload = () => {
  payloadError.value = null;
  
  if (!payloadText.value.trim()) {
    payloadError.value = 'Payload is required';
    return false;
  }
  
  try {
    JSON.parse(payloadText.value);
    return true;
  } catch (e) {
    payloadError.value = 'Invalid JSON format. Please check your syntax.';
    return false;
  }
};

const submitJob = async () => {
  if (!validateOutputPath() || !validatePayload()) return;
  
  try {
    loading.value = true;
    
    const payload = JSON.parse(payloadText.value);
    
    // Add output path to the payload
    const jobPayload = {
      ...payload,
      output_path: outputPath.value.trim()
    };
    
    const job = await ApiService.submitJob(props.pool.id, jobPayload, props.userId);
    
    // Clear form
    outputPath.value = '';
    payloadText.value = '{\n  "task": "example_task",\n  "parameters": {\n    "input": "sample_data",\n    "timeout": 300\n  }\n}';
    
    emit('job-submitted', job);
  } catch (error) {
    console.error('Error submitting job:', error);
    payloadError.value = 'Failed to submit job. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.job-submission {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e8eaed;
  margin-bottom: 32px;
}

.submission-header {
  margin-bottom: 32px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1d29;
  margin: 0 0 4px 0;
}

.section-subtitle {
  color: #5f6368;
  margin: 0;
  font-size: 14px;
}

.form-section {
  margin-bottom: 32px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #1a1d29;
  margin-bottom: 12px;
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

.textarea-container {
  position: relative;
  border: 2px solid #e8eaed;
  border-radius: 12px;
  background: #fafbfc;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.textarea-container:focus-within {
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.textarea-container:has(.has-error) {
  border-color: #ea4335;
  background: #fef7f7;
}

.payload-textarea {
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 16px;
  font-size: 14px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  line-height: 1.6;
  resize: vertical;
  background: transparent;
  color: #1a1d29;
  min-height: 200px;
}

.payload-textarea:focus {
  outline: none;
}

.payload-textarea::placeholder {
  color: #9aa0a6;
}

.textarea-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.character-count {
  font-size: 12px;
  color: #9aa0a6;
  font-weight: 500;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ea4335;
  font-size: 14px;
  margin-top: 8px;
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
  margin-top: 8px;
  line-height: 1.4;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.submit-button {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 140px;
  justify-content: center;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.submit-button:disabled {
  background: #9aa0a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .job-submission {
    padding: 24px 20px;
  }
}
</style>