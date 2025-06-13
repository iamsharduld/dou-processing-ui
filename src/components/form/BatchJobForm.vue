<template>
  <div class="batch-job-form">
    <div class="form-section">
      <label class="form-label">Excel/CSV File Upload</label>
      <div class="file-upload-area" :class="{ 'has-file': modelValue, 'has-error': fileError }">
        <input
          type="file"
          ref="fileInput"
          @change="handleFileSelect"
          accept=".xlsx,.xls,.csv"
          class="file-input"
        />
        
        <div v-if="!modelValue" class="upload-prompt">
          <div class="upload-icon">📁</div>
          <div class="upload-text">
            <p class="upload-title">Choose Excel or CSV file</p>
            <p class="upload-subtitle">Click to browse or drag and drop</p>
          </div>
          <button type="button" @click="triggerFileSelect" class="browse-button">
            Browse Files
          </button>
        </div>
        
        <div v-else class="file-info">
          <div class="file-details">
            <div class="file-icon">📄</div>
            <div class="file-meta">
              <span class="file-name">{{ modelValue.name }}</span>
              <span class="file-size">{{ formatFileSize(modelValue.size) }}</span>
            </div>
          </div>
          <button type="button" @click="$emit('clear-file')" class="remove-button">
            <span class="remove-icon">×</span>
          </button>
        </div>
      </div>
      
      <div v-if="fileError" class="error-message">
        <span class="error-icon">⚠️</span>
        {{ fileError }}
      </div>
      
      <div class="help-text">
        Upload an Excel (.xlsx, .xls) or CSV file with job data. Each row will become a separate job.
      </div>
    </div>

    <!-- File Preview -->
    <div v-if="fileData.length > 0" class="file-preview">
      <div class="preview-header">
        <h5 class="preview-title">File Preview</h5>
        <span class="preview-count">{{ fileData.length }} jobs will be created</span>
      </div>
      <div class="preview-table-container">
        <table class="preview-table">
          <thead>
            <tr>
              <th v-for="(value, key) in fileData[0]" :key="key" class="table-header">
                {{ key }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in fileData.slice(0, 5)" :key="index" class="table-row">
              <td v-for="(value, key) in row" :key="key" class="table-cell">
                {{ formatCellValue(value) }}
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="fileData.length > 5" class="preview-more">
          ... and {{ fileData.length - 5 }} more rows
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button
        @click="$emit('submit')"
        class="submit-button"
        :disabled="!canSubmit"
      >
        <span v-if="loading" class="loading-spinner"></span>
        <span class="button-text">
          {{ loading ? 'Submitting...' : `Submit ${fileData.length} Jobs` }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  modelValue: File | null;
  fileData: Record<string, any>[];
  fileError: string | null;
  loading: boolean;
  canSubmit: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [file: File | null];
  'submit': [];
  'file-change': [file: File | null];
  'clear-file': [];
}>();

const fileInput = ref<HTMLInputElement>();

const triggerFileSelect = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0] || null;
  emit('update:modelValue', file);
  emit('file-change', file);
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatCellValue = (value: any) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str.length > 50 ? str.substring(0, 50) + '...' : str;
};
</script>

<style scoped>
.batch-job-form {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #1a1d29;
}

.file-upload-area {
  border: 2px dashed #e8eaed;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  background: #fafbfc;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.file-upload-area:hover {
  border-color: #dadce0;
  background: #f8f9fa;
}

.file-upload-area.has-file {
  border-style: solid;
  border-color: #00b894;
  background: rgba(0, 184, 148, 0.05);
}

.file-upload-area.has-error {
  border-color: #ea4335;
  background: #fef7f7;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-icon {
  font-size: 48px;
  opacity: 0.6;
}

.upload-text {
  text-align: center;
}

.upload-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1d29;
  margin: 0 0 4px 0;
}

.upload-subtitle {
  font-size: 14px;
  color: #5f6368;
  margin: 0;
}

.browse-button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.browse-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.file-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e8eaed;
}

.file-details {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  font-size: 24px;
}

.file-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1d29;
}

.file-size {
  font-size: 12px;
  color: #5f6368;
}

.remove-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(234, 67, 53, 0.1);
  border: 1px solid rgba(234, 67, 53, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: #ea4335;
}

.remove-button:hover {
  background: rgba(234, 67, 53, 0.15);
  border-color: rgba(234, 67, 53, 0.3);
}

.remove-icon {
  font-size: 18px;
  font-weight: bold;
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

/* File Preview */
.file-preview {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1d29;
  margin: 0;
}

.preview-count {
  font-size: 12px;
  color: #5f6368;
  background: white;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #e8eaed;
}

.preview-table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.table-header {
  background: #f1f5f9;
  color: #374151;
  font-weight: 600;
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.table-row:nth-child(even) {
  background: #f8fafc;
}

.table-cell {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #1a1d29;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-more {
  padding: 12px;
  text-align: center;
  color: #6b7280;
  font-size: 12px;
  font-style: italic;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
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
  min-width: 160px;
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
  .file-upload-area {
    padding: 24px 16px;
  }
  
  .preview-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .preview-count {
    text-align: center;
  }
}
</style>