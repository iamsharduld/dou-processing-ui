<template>
  <div class="job-submission-form">
    <div class="form-header">
      <div class="header-content">
        <div class="icon-wrapper">
          <svg class="form-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
        </div>
        <div>
          <h2 class="form-title">Submit New DoU Processing Job</h2>
          <p class="form-subtitle">Configure and submit your data processing job to the queue</p>
        </div>
      </div>
    </div>

    <form @submit.prevent="submitJob" class="form-content">
      <!-- Job Information Section -->
      <div class="form-section">
        <h3 class="section-title">Job Information</h3>
        <div class="form-grid">
          <div class="form-group">
            <label for="jobName" class="form-label required">Job Name</label>
            <input
              id="jobName"
              v-model="formData.name"
              type="text"
              class="form-input"
              :class="{ 'error': errors.name }"
              placeholder="Enter descriptive job name"
              required
            />
            <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
          </div>
          
          <div class="form-group">
            <label for="jobDescription" class="form-label">Description (Optional)</label>
            <textarea
              id="jobDescription"
              v-model="formData.description"
              class="form-textarea"
              placeholder="Brief description of the processing job"
              rows="3"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- File Input Section -->
      <div class="form-section">
        <h3 class="section-title">Input Files</h3>
        <div class="file-inputs">
          <div class="file-input-group">
            <label class="file-label required">Primary Input File</label>
            <div class="file-input-wrapper">
              <input
                type="file"
                ref="file1Input"
                @change="handleFile1Change"
                class="file-input-hidden"
                accept=".dat,.bin,.txt,.json,.xml"
              />
              <div 
                class="file-drop-zone"
                :class="{ 'has-file': formData.inputFile1Path, 'error': errors.inputFile1Path }"
                @click="$refs.file1Input.click()"
                @dragover.prevent
                @drop.prevent="handleFile1Drop"
              >
                <div class="file-drop-content">
                  <svg class="file-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                  <div class="file-text">
                    <span class="file-main-text">
                      {{ formData.inputFile1Path ? getFileName(formData.inputFile1Path) : 'Click to upload or drag file here' }}
                    </span>
                    <span class="file-sub-text">Supported: .dat, .bin, .txt, .json, .xml</span>
                  </div>
                </div>
              </div>
            </div>
            <span v-if="errors.inputFile1Path" class="error-message">{{ errors.inputFile1Path }}</span>
          </div>

          <div class="file-input-group">
            <label class="file-label required">Secondary Input File</label>
            <div class="file-input-wrapper">
              <input
                type="file"
                ref="file2Input"
                @change="handleFile2Change"
                class="file-input-hidden"
                accept=".dat,.bin,.txt,.json,.xml"
              />
              <div 
                class="file-drop-zone"
                :class="{ 'has-file': formData.inputFile2Path, 'error': errors.inputFile2Path }"
                @click="$refs.file2Input.click()"
                @dragover.prevent
                @drop.prevent="handleFile2Drop"
              >
                <div class="file-drop-content">
                  <svg class="file-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                  <div class="file-text">
                    <span class="file-main-text">
                      {{ formData.inputFile2Path ? getFileName(formData.inputFile2Path) : 'Click to upload or drag file here' }}
                    </span>
                    <span class="file-sub-text">Supported: .dat, .bin, .txt, .json, .xml</span>
                  </div>
                </div>
              </div>
            </div>
            <span v-if="errors.inputFile2Path" class="error-message">{{ errors.inputFile2Path }}</span>
          </div>
        </div>
      </div>

      <!-- Processing Parameters Section -->
      <div class="form-section">
        <h3 class="section-title">Processing Parameters</h3>
        <div class="form-grid">
          <div class="form-group">
            <label for="processingMode" class="form-label required">Processing Mode</label>
            <select
              id="processingMode"
              v-model="formData.parameters.processingMode"
              class="form-select"
              required
            >
              <option value="standard">Standard Processing</option>
              <option value="enhanced">Enhanced Processing</option>
              <option value="custom">Custom Configuration</option>
            </select>
          </div>

          <div class="form-group">
            <label for="priority" class="form-label required">Priority Level</label>
            <select
              id="priority"
              v-model="formData.parameters.priority"
              class="form-select"
              required
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical Priority</option>
            </select>
          </div>

          <div class="form-group">
            <label for="outputFormat" class="form-label required">Output Format</label>
            <select
              id="outputFormat"
              v-model="formData.parameters.outputFormat"
              class="form-select"
              required
            >
              <option value="json">JSON Format</option>
              <option value="xml">XML Format</option>
              <option value="csv">CSV Format</option>
              <option value="binary">Binary Format</option>
            </select>
          </div>

          <div class="form-group">
            <label for="maxProcessingTime" class="form-label required">Max Processing Time (minutes)</label>
            <input
              id="maxProcessingTime"
              v-model.number="formData.parameters.maxProcessingTime"
              type="number"
              class="form-input"
              min="1"
              max="1440"
              required
            />
          </div>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="formData.parameters.enableLogging"
              class="checkbox-input"
            />
            <span class="checkbox-custom"></span>
            <span class="checkbox-text">Enable detailed logging</span>
          </label>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="resetForm">
          Reset Form
        </button>
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          <span v-if="submitting" class="loading-spinner"></span>
          {{ submitting ? 'Submitting...' : 'Submit Job' }}
        </button>
      </div>
    </form>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="modal-overlay" @click="closeSuccessModal">
      <div class="modal success-modal" @click.stop>
        <div class="modal-header">
          <div class="success-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h3>Job Submitted Successfully!</h3>
        </div>
        <div class="modal-content">
          <p>Your DoU processing job has been submitted to the queue.</p>
          <div class="job-details">
            <div class="detail-row">
              <span class="detail-label">Job ID:</span>
              <span class="detail-value">{{ submittedJob?.id }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Job Name:</span>
              <span class="detail-value">{{ submittedJob?.name }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Estimated Completion:</span>
              <span class="detail-value">{{ formatEstimatedTime(submittedJob?.estimatedCompletion) }}</span>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" @click="closeSuccessModal">
            Continue
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { DoUApiService } from '../services/api';
import type { JobSubmission, JobParameters } from '../types';

const emit = defineEmits<{
  'job-submitted': [job: JobSubmission];
}>();

const file1Input = ref<HTMLInputElement>();
const file2Input = ref<HTMLInputElement>();
const submitting = ref(false);
const showSuccessModal = ref(false);
const submittedJob = ref<JobSubmission | null>(null);

const formData = reactive<JobSubmission>({
  name: '',
  description: '',
  inputFile1Path: '',
  inputFile2Path: '',
  parameters: {
    processingMode: 'standard',
    priority: 'medium',
    outputFormat: 'json',
    enableLogging: true,
    maxProcessingTime: 60
  },
  status: 'draft' as any
});

const errors = reactive({
  name: '',
  inputFile1Path: '',
  inputFile2Path: ''
});

const validateForm = () => {
  // Reset errors
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = '';
  });

  let isValid = true;

  if (!formData.name.trim()) {
    errors.name = 'Job name is required';
    isValid = false;
  }

  if (!formData.inputFile1Path) {
    errors.inputFile1Path = 'Primary input file is required';
    isValid = false;
  }

  if (!formData.inputFile2Path) {
    errors.inputFile2Path = 'Secondary input file is required';
    isValid = false;
  }

  return isValid;
};

const handleFile1Change = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    formData.inputFile1Path = `/uploads/${target.files[0].name}`;
    errors.inputFile1Path = '';
  }
};

const handleFile2Change = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    formData.inputFile2Path = `/uploads/${target.files[0].name}`;
    errors.inputFile2Path = '';
  }
};

const handleFile1Drop = (event: DragEvent) => {
  const files = event.dataTransfer?.files;
  if (files && files[0]) {
    formData.inputFile1Path = `/uploads/${files[0].name}`;
    errors.inputFile1Path = '';
  }
};

const handleFile2Drop = (event: DragEvent) => {
  const files = event.dataTransfer?.files;
  if (files && files[0]) {
    formData.inputFile2Path = `/uploads/${files[0].name}`;
    errors.inputFile2Path = '';
  }
};

const getFileName = (path: string) => {
  return path.split('/').pop() || path;
};

const submitJob = async () => {
  if (!validateForm()) return;

  try {
    submitting.value = true;
    const job = await DoUApiService.submitJob(formData);
    submittedJob.value = job;
    showSuccessModal.value = true;
    emit('job-submitted', job);
  } catch (error) {
    console.error('Error submitting job:', error);
    // Handle error
  } finally {
    submitting.value = false;
  }
};

const resetForm = () => {
  formData.name = '';
  formData.description = '';
  formData.inputFile1Path = '';
  formData.inputFile2Path = '';
  formData.parameters = {
    processingMode: 'standard',
    priority: 'medium',
    outputFormat: 'json',
    enableLogging: true,
    maxProcessingTime: 60
  };
  
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = '';
  });

  if (file1Input.value) file1Input.value.value = '';
  if (file2Input.value) file2Input.value.value = '';
};

const closeSuccessModal = () => {
  showSuccessModal.value = false;
  resetForm();
};

const formatEstimatedTime = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
};
</script>

<style scoped>
.job-submission-form {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.form-header {
  background: linear-gradient(135deg, #3253DC 0%, #2A47C4 100%);
  color: white;
  padding: 32px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.form-icon {
  width: 28px;
  height: 28px;
  color: white;
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.form-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.4;
}

.form-content {
  padding: 40px;
}

.form-section {
  margin-bottom: 40px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 24px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #f3f4f6;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.form-label.required::after {
  content: ' *';
  color: #EF3E42;
}

.form-input,
.form-select,
.form-textarea {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  transition: all 0.2s ease;
  background: white;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3253DC;
  box-shadow: 0 0 0 3px rgba(50, 83, 220, 0.1);
}

.form-input.error,
.form-select.error,
.form-textarea.error {
  border-color: #EF3E42;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.file-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.file-input-group {
  display: flex;
  flex-direction: column;
}

.file-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.file-label.required::after {
  content: ' *';
  color: #EF3E42;
}

.file-input-hidden {
  display: none;
}

.file-drop-zone {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f9fafb;
}

.file-drop-zone:hover {
  border-color: #3253DC;
  background: #eff6ff;
}

.file-drop-zone.has-file {
  border-color: #10b981;
  background: #ecfdf5;
  border-style: solid;
}

.file-drop-zone.error {
  border-color: #EF3E42;
  background: #fef2f2;
}

.file-drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.file-icon {
  width: 48px;
  height: 48px;
  color: #6b7280;
}

.file-drop-zone.has-file .file-icon {
  color: #10b981;
}

.file-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-main-text {
  font-size: 16px;
  font-weight: 500;
  color: #374151;
}

.file-sub-text {
  font-size: 12px;
  color: #6b7280;
}

.checkbox-group {
  margin-top: 24px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  position: relative;
  transition: all 0.2s ease;
}

.checkbox-input:checked + .checkbox-custom {
  background: #3253DC;
  border-color: #3253DC;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 6px;
  width: 4px;
  height: 8px;
  border: 2px solid white;
  border-top: none;
  border-left: none;
  transform: rotate(45deg);
}

.error-message {
  color: #EF3E42;
  font-size: 12px;
  margin-top: 4px;
  font-weight: 500;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: #3253DC;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2A47C4;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(50, 83, 220, 0.3);
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.success-modal .modal-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 32px;
  text-align: center;
  border-radius: 16px 16px 0 0;
}

.success-icon {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.success-icon svg {
  width: 32px;
  height: 32px;
}

.modal-header h3 {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.modal-content {
  padding: 32px;
}

.modal-content p {
  color: #6b7280;
  margin: 0 0 24px 0;
  text-align: center;
}

.job-details {
  background: #f9fafb;
  border-radius: 8px;
  padding: 20px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-weight: 500;
  color: #374151;
}

.detail-value {
  color: #6b7280;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
}

.modal-actions {
  padding: 0 32px 32px;
  text-align: center;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .form-content {
    padding: 24px;
  }
  
  .form-header {
    padding: 24px;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .file-inputs {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>