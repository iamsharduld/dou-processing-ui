<template>
  <div class="job-submission">
    <div class="header">
      <h3 class="title">Submit New Job</h3>
      <p class="subtitle">Add a job to {{ pool.name }}</p>
    </div>

    <form @submit.prevent="submitJob" class="form">
      <div class="form-group">
        <label for="payload" class="label">Job Payload (JSON)</label>
        <textarea
          id="payload"
          v-model="payloadText"
          class="textarea"
          :class="{ 'error': payloadError }"
          placeholder='{"task": "example", "data": {"key": "value"}}'
          rows="8"
        ></textarea>
        <div v-if="payloadError" class="error-message">{{ payloadError }}</div>
        <div class="help-text">Enter valid JSON data for the job payload</div>
      </div>

      <div class="form-actions">
        <button
          type="submit"
          class="submit-btn"
          :disabled="loading || !payloadText.trim()"
        >
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? 'Submitting...' : 'Submit Job' }}
        </button>
      </div>
    </form>

    <div v-if="recentJobs.length" class="recent-jobs">
      <h4 class="recent-title">Recently Submitted</h4>
      <div class="job-list">
        <div
          v-for="job in recentJobs"
          :key="job.id"
          class="job-item"
        >
          <div class="job-info">
            <span class="job-id">{{ job.id.slice(0, 8) }}...</span>
            <span class="job-status" :class="job.status">{{ job.status }}</span>
          </div>
          <div class="job-time">{{ formatTime(job.created_at) }}</div>
        </div>
      </div>
    </div>
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

const payloadText = ref('{\n  "task": "example",\n  "data": {\n    "key": "value"\n  }\n}');
const payloadError = ref<string | null>(null);
const loading = ref(false);
const recentJobs = ref<Job[]>([]);

const isValidJson = computed(() => {
  try {
    JSON.parse(payloadText.value);
    return true;
  } catch {
    return false;
  }
});

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
    payloadError.value = 'Invalid JSON format';
    return false;
  }
};

const submitJob = async () => {
  if (!validatePayload()) return;
  
  try {
    loading.value = true;
    
    const payload = JSON.parse(payloadText.value);
    const job = await ApiService.submitJob(props.pool.id, payload, props.userId);
    
    // Add to recent jobs
    recentJobs.value.unshift(job);
    if (recentJobs.value.length > 5) {
      recentJobs.value = recentJobs.value.slice(0, 5);
    }
    
    // Clear form
    payloadText.value = '{\n  "task": "example",\n  "data": {\n    "key": "value"\n  }\n}';
    
    emit('job-submitted', job);
  } catch (error) {
    console.error('Error submitting job:', error);
    payloadError.value = 'Failed to submit job. Please try again.';
  } finally {
    loading.value = false;
  }
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString();
};
</script>

<style scoped>
.job-submission {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.header {
  margin-bottom: 24px;
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.subtitle {
  color: #6b7280;
  margin: 0;
  font-size: 14px;
}

.form-group {
  margin-bottom: 24px;
}

.label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.textarea {
  width: 100%;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1.5;
  resize: vertical;
  transition: border-color 0.2s;
  background: #f9fafb;
}

.textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.textarea.error {
  border-color: #ef4444;
}

.error-message {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

.help-text {
  color: #6b7280;
  font-size: 12px;
  margin-top: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.submit-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.submit-btn:hover:not(:disabled) {
  background: #2563eb;
}

.submit-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.recent-jobs {
  margin-top: 32px;
  border-top: 1px solid #e5e7eb;
  padding-top: 24px;
}

.recent-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
}

.job-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.job-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.job-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.job-id {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  color: #6b7280;
}

.job-status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.job-status.pending {
  background: #fef3c7;
  color: #92400e;
}

.job-status.in_progress {
  background: #dbeafe;
  color: #1e40af;
}

.job-status.completed {
  background: #d1fae5;
  color: #065f46;
}

.job-status.failed {
  background: #fee2e2;
  color: #991b1b;
}

.job-time {
  font-size: 12px;
  color: #6b7280;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>