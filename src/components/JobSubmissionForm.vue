<template>
  <div class="job-submission-form">
    <div class="form-header">
      <div class="header-content">
        <h4 class="form-title">Submit New Jobs</h4>
        <div class="submission-modes">
          <button
            @click="submissionMode = 'single'"
            class="mode-button"
            :class="{ active: submissionMode === 'single' }"
          >
            <span class="mode-icon">📝</span>
            <span>Single Job</span>
          </button>
          <button
            @click="submissionMode = 'batch'"
            class="mode-button"
            :class="{ active: submissionMode === 'batch' }"
          >
            <span class="mode-icon">📊</span>
            <span>Batch Upload</span>
          </button>
        </div>
      </div>
    </div>

    <div class="form-content">
      <!-- Output Path (Common for both modes) -->
      <OutputPathInput
        v-model="outputPath"
        :error="outputPathError"
        @validate="validateOutputPath"
      />

      <!-- Single Job Mode -->
      <SingleJobForm
        v-if="submissionMode === 'single'"
        v-model:payload="payloadText"
        :error="payloadError"
        :loading="loading"
        :can-submit="canSubmitSingle"
        @submit="submitSingleJob"
        @validate="validatePayload"
      />

      <!-- Batch Job Mode -->
      <BatchJobForm
        v-if="submissionMode === 'batch'"
        v-model:file="selectedFile"
        :file-data="fileData"
        :file-error="fileError"
        :loading="loading"
        :can-submit="canSubmitBatch"
        @submit="submitBatchJobs"
        @file-change="handleFileChange"
        @clear-file="clearFile"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ApiService } from '../services/api';
import OutputPathInput from './form/OutputPathInput.vue';
import SingleJobForm from './form/SingleJobForm.vue';
import BatchJobForm from './form/BatchJobForm.vue';
import type { Pool, Job } from '../types';
import * as XLSX from 'xlsx';

const props = defineProps<{
  pool: Pool;
  userId: string;
}>();

const emit = defineEmits<{
  'job-submitted': [job: Job];
  'jobs-submitted': [jobs: Job[]];
}>();

// Form state
const submissionMode = ref<'single' | 'batch'>('single');
const loading = ref(false);

// Output path
const outputPath = ref('');
const outputPathError = ref<string | null>(null);

// Single job form
const payloadText = ref('{\n  "task": "example_task",\n  "parameters": {\n    "input": "sample_data",\n    "timeout": 300\n  }\n}');
const payloadError = ref<string | null>(null);

// Batch job form
const selectedFile = ref<File | null>(null);
const fileData = ref<Record<string, any>[]>([]);
const fileError = ref<string | null>(null);

// Computed properties
const isValidPath = computed(() => {
  const path = outputPath.value.trim();
  if (!path) return false;
  
  const unixPattern = /^(\/|~)/;
  const windowsPattern = /^([A-Za-z]:|\\\\)/;
  
  return unixPattern.test(path) || windowsPattern.test(path);
});

const isValidJson = computed(() => {
  try {
    JSON.parse(payloadText.value);
    return true;
  } catch {
    return false;
  }
});

const canSubmitSingle = computed(() => {
  return outputPath.value.trim() && isValidPath.value && 
         payloadText.value.trim() && isValidJson.value && !loading.value;
});

const canSubmitBatch = computed(() => {
  return outputPath.value.trim() && isValidPath.value && 
         selectedFile.value && !fileError.value && fileData.value.length > 0 && !loading.value;
});

// Validation functions
const validateOutputPath = () => {
  outputPathError.value = null;
  
  if (!outputPath.value.trim()) {
    outputPathError.value = 'Output folder path is required';
    return false;
  }
  
  if (!isValidPath.value) {
    outputPathError.value = 'Please enter a valid folder path';
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

// File handling
const handleFileChange = (file: File | null) => {
  selectedFile.value = file;
  fileError.value = null;
  fileData.value = [];
  
  if (!file) return;
  
  if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
    fileError.value = 'Please select an Excel (.xlsx, .xls) or CSV file';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        fileError.value = 'The file appears to be empty';
        return;
      }
      
      fileData.value = jsonData as Record<string, any>[];
    } catch (error) {
      fileError.value = 'Error reading file. Please check the file format.';
      console.error('File parsing error:', error);
    }
  };
  
  reader.readAsArrayBuffer(file);
};

const clearFile = () => {
  selectedFile.value = null;
  fileData.value = [];
  fileError.value = null;
};

// Submission functions
const submitSingleJob = async () => {
  if (!validateOutputPath() || !validatePayload()) return;
  
  try {
    loading.value = true;
    
    const payload = JSON.parse(payloadText.value);
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

const submitBatchJobs = async () => {
  if (!validateOutputPath() || !fileData.value.length) return;
  
  try {
    loading.value = true;
    const submittedJobs: Job[] = [];
    
    for (const row of fileData.value) {
      const jobPayload = {
        ...row,
        output_path: outputPath.value.trim()
      };
      
      const job = await ApiService.submitJob(props.pool.id, jobPayload, props.userId);
      submittedJobs.push(job);
    }
    
    // Clear form
    outputPath.value = '';
    clearFile();
    
    emit('jobs-submitted', submittedJobs);
  } catch (error) {
    console.error('Error submitting batch jobs:', error);
    fileError.value = 'Failed to submit jobs. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.job-submission-form {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e8eaed;
}

.form-header {
  margin-bottom: 32px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.form-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1d29;
  margin: 0;
}

.submission-modes {
  display: flex;
  gap: 8px;
  background: #f8f9fa;
  padding: 4px;
  border-radius: 10px;
  border: 1px solid #e8eaed;
}

.mode-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #5f6368;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.mode-button.active {
  background: white;
  color: #1a1d29;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.mode-button:hover:not(.active) {
  background: rgba(255, 255, 255, 0.5);
}

.mode-icon {
  font-size: 14px;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

@media (max-width: 768px) {
  .job-submission-form {
    padding: 24px 20px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
  }
  
  .submission-modes {
    justify-content: center;
  }
}
</style>