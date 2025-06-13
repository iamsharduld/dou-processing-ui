<template>
  <div class="job-manager">
    <div class="manager-header">
      <div class="header-content">
        <div class="title-section">
          <h3 class="section-title">Job Management</h3>
          <div class="status-indicators">
            <div class="indicator active" v-if="isLive">
              <span class="indicator-dot"></span>
              <span class="indicator-text">Live</span>
            </div>
            <div class="indicator inactive" v-else>
              <span class="indicator-dot"></span>
              <span class="indicator-text">Offline</span>
            </div>
          </div>
        </div>
        
        <div class="controls-section">
          <button @click="showHistoryModal = true" class="history-button">
            <span class="button-icon">📋</span>
            <span>View History</span>
          </button>
          <button 
            v-if="isOwner && userJobs.length > 0" 
            @click="showClearModal = true" 
            class="clear-button"
          >
            <span class="button-icon">🗑️</span>
            <span>Clear Jobs</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Job Submission Form (only for owned pools) -->
    <div v-if="isOwner" class="submission-section">
      <form @submit.prevent="submitJob" class="submission-form">
        <div class="form-section">
          <label for="payload" class="form-label">Submit New Job</label>
          <div class="textarea-container">
            <textarea
              id="payload"
              v-model="payloadText"
              class="payload-textarea"
              :class="{ 'has-error': payloadError }"
              placeholder='{\n  "task": "example_task",\n  "parameters": {\n    "input": "sample_data",\n    "timeout": 300\n  }\n}'
              rows="6"
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
              <button
                type="submit"
                class="submit-button"
                :disabled="submitting || !payloadText.trim() || !isValidJson"
              >
                <span v-if="submitting" class="loading-spinner"></span>
                <span class="button-text">{{ submitting ? 'Submitting...' : 'Submit Job' }}</span>
              </button>
            </div>
          </div>
          <div v-if="payloadError" class="error-message">
            <span class="error-icon">⚠️</span>
            {{ payloadError }}
          </div>
        </div>
      </form>
    </div>

    <!-- Jobs List -->
    <div class="jobs-section">
      <div v-if="loading && !jobs.length" class="loading-state">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading jobs...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <p class="error-message">{{ error }}</p>
        <button @click="loadJobs" class="retry-button">Try Again</button>
      </div>

      <div v-else-if="!userJobs.length" class="empty-state">
        <div class="empty-icon">📝</div>
        <h4 class="empty-title">No jobs submitted</h4>
        <p class="empty-message" v-if="isOwner">Submit your first job to get started.</p>
        <p class="empty-message" v-else>No jobs have been submitted by you in this pool.</p>
      </div>

      <div v-else class="jobs-container">
        <div class="jobs-header">
          <h4 class="jobs-title">Your Jobs ({{ userJobs.length }})</h4>
          <div class="jobs-stats">
            <span class="stat pending" v-if="jobStats.pending">{{ jobStats.pending }} Pending</span>
            <span class="stat in-progress" v-if="jobStats.in_progress">{{ jobStats.in_progress }} Active</span>
            <span class="stat completed" v-if="jobStats.completed">{{ jobStats.completed }} Done</span>
            <span class="stat failed" v-if="jobStats.failed">{{ jobStats.failed }} Failed</span>
          </div>
        </div>

        <div class="jobs-grid">
          <div
            v-for="job in userJobs"
            :key="job.id"
            class="job-card"
            :class="[job.status, { 'recently-updated': isRecentlyUpdated(job) }]"
            @click="viewJobDetails(job)"
          >
            <div class="card-header">
              <div class="job-identity">
                <span class="job-id">{{ job.id.slice(0, 8) }}</span>
                <span class="job-status" :class="job.status">{{ formatStatus(job.status) }}</span>
              </div>
              <div class="job-timing">
                <span class="time-elapsed">{{ getElapsedTime(job.created_at) }}</span>
              </div>
            </div>

            <div v-if="job.status === 'in_progress' && job.progress" class="progress-section">
              <div class="progress-header">
                <span class="progress-label">Progress</span>
                <span class="progress-percentage">{{ job.progress }}%</span>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: `${job.progress}%` }"
                  ></div>
                </div>
              </div>
              <div class="progress-details">
                <span class="eta" v-if="getETA(job)">ETA: {{ getETA(job) }}</span>
                <span class="speed" v-if="getProgressSpeed(job)">{{ getProgressSpeed(job) }}%/min</span>
              </div>
            </div>

            <div class="payload-preview">
              <div class="task-info">
                <span class="task-name">{{ getTaskName(job.payload) }}</span>
                <span class="task-details">{{ getTaskDetails(job.payload) }}</span>
              </div>
            </div>

            <div class="card-footer">
              <div class="timestamps">
                <span class="timestamp">{{ formatRelativeTime(job.updated_at) }}</span>
              </div>
              <div class="card-actions">
                <button class="details-button">
                  <span class="button-icon">👁️</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Job Details Modal -->
    <div v-if="selectedJob" class="modal-overlay" @click="closeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <div class="modal-title-section">
            <h3 class="modal-title">Job Details</h3>
            <span class="job-status" :class="selectedJob.status">{{ formatStatus(selectedJob.status) }}</span>
          </div>
          <button @click="closeModal" class="close-button">&times;</button>
        </div>
        <div class="modal-content">
          <div class="detail-grid">
            <div class="detail-item">
              <label class="detail-label">Job ID</label>
              <span class="detail-value monospace">{{ selectedJob.id }}</span>
            </div>
            <div class="detail-item" v-if="selectedJob.progress">
              <label class="detail-label">Progress</label>
              <div class="progress-detail">
                <div class="progress-bar large">
                  <div class="progress-fill" :style="{ width: `${selectedJob.progress}%` }"></div>
                </div>
                <span class="progress-percentage">{{ selectedJob.progress }}%</span>
              </div>
            </div>
            <div class="detail-item">
              <label class="detail-label">Created</label>
              <span class="detail-value">{{ formatDateTime(selectedJob.created_at) }}</span>
            </div>
            <div class="detail-item">
              <label class="detail-label">Last Updated</label>
              <span class="detail-value">{{ formatDateTime(selectedJob.updated_at) }}</span>
            </div>
          </div>
          <div class="payload-section">
            <label class="detail-label">Complete Payload</label>
            <pre class="payload-full">{{ formatPayload(selectedJob.payload) }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- History Modal -->
    <div v-if="showHistoryModal" class="modal-overlay" @click="closeHistoryModal">
      <div class="modal-container large" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Job History</h3>
          <button @click="closeHistoryModal" class="close-button">&times;</button>
        </div>
        <div class="modal-content">
          <div class="history-filters">
            <select v-model="historyFilter" @change="loadHistoryJobs" class="filter-select">
              <option value="">All Jobs</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <button @click="loadHistoryJobs" class="refresh-button" :disabled="loadingHistory">
              <span class="refresh-icon" :class="{ spinning: loadingHistory }">↻</span>
            </button>
          </div>

          <div v-if="loadingHistory" class="loading-state">
            <div class="loading-spinner"></div>
            <p class="loading-text">Loading history...</p>
          </div>

          <div v-else-if="!historyJobs.length" class="empty-state">
            <div class="empty-icon">📋</div>
            <h4 class="empty-title">No jobs found</h4>
            <p class="empty-message">No jobs match the selected filter.</p>
          </div>

          <div v-else class="history-list">
            <div
              v-for="job in historyJobs"
              :key="job.id"
              class="history-item"
              @click="viewJobDetails(job)"
            >
              <div class="history-header">
                <span class="job-id">{{ job.id.slice(0, 8) }}</span>
                <span class="job-status" :class="job.status">{{ formatStatus(job.status) }}</span>
                <span class="job-date">{{ formatDateTime(job.created_at) }}</span>
              </div>
              <div class="history-content">
                <span class="task-name">{{ getTaskName(job.payload) }}</span>
                <span v-if="job.progress" class="progress-info">{{ job.progress }}% complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Clear Jobs Modal -->
    <div v-if="showClearModal" class="modal-overlay" @click="closeClearModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Clear Jobs</h3>
          <button @click="closeClearModal" class="close-button">&times;</button>
        </div>
        <div class="modal-content">
          <div class="clear-options">
            <div class="clear-warning">
              <div class="warning-icon">⚠️</div>
              <div class="warning-content">
                <h4 class="warning-title">Clear jobs from this pool</h4>
                <p class="warning-message">
                  This action will permanently delete jobs from the pool. This cannot be undone.
                </p>
              </div>
            </div>

            <div class="clear-filters">
              <label class="filter-label">What to clear:</label>
              <div class="filter-options">
                <label class="filter-option">
                  <input 
                    type="radio" 
                    v-model="clearFilter" 
                    value="" 
                    name="clearFilter"
                  />
                  <span class="option-text">All Jobs ({{ userJobs.length }})</span>
                </label>
                <label class="filter-option" v-if="jobStats.pending > 0">
                  <input 
                    type="radio" 
                    v-model="clearFilter" 
                    value="pending" 
                    name="clearFilter"
                  />
                  <span class="option-text">Pending Jobs ({{ jobStats.pending }})</span>
                </label>
                <label class="filter-option" v-if="jobStats.completed > 0">
                  <input 
                    type="radio" 
                    v-model="clearFilter" 
                    value="completed" 
                    name="clearFilter"
                  />
                  <span class="option-text">Completed Jobs ({{ jobStats.completed }})</span>
                </label>
                <label class="filter-option" v-if="jobStats.failed > 0">
                  <input 
                    type="radio" 
                    v-model="clearFilter" 
                    value="failed" 
                    name="clearFilter"
                  />
                  <span class="option-text">Failed Jobs ({{ jobStats.failed }})</span>
                </label>
              </div>
            </div>

            <div v-if="clearError" class="error-message">
              <span class="error-icon">⚠️</span>
              {{ clearError }}
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeClearModal" class="cancel-button">
              Cancel
            </button>
            <button 
              @click="clearJobs" 
              class="clear-confirm-button" 
              :disabled="clearing"
            >
              <span v-if="clearing" class="loading-spinner small"></span>
              <span>{{ clearing ? 'Clearing...' : 'Clear Jobs' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { ApiService } from '../services/api';
import type { Pool, Job, JobStatus } from '../types';

const props = defineProps<{
  pool: Pool;
  userId: string;
}>();

const emit = defineEmits<{
  'job-submitted': [job: Job];
}>();

// Job submission
const payloadText = ref('{\n  "task": "example_task",\n  "parameters": {\n    "input": "sample_data",\n    "timeout": 300\n  }\n}');
const payloadError = ref<string | null>(null);
const submitting = ref(false);

// Jobs data
const jobs = ref<Job[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const isLive = ref(false);
const jobHistory = ref<Map<string, Job[]>>(new Map());

// Modals
const selectedJob = ref<Job | null>(null);
const showHistoryModal = ref(false);
const historyJobs = ref<Job[]>([]);
const historyFilter = ref<JobStatus | ''>('');
const loadingHistory = ref(false);

// Clear jobs modal
const showClearModal = ref(false);
const clearFilter = ref<JobStatus | ''>('');
const clearing = ref(false);
const clearError = ref<string | null>(null);

let refreshTimer: NodeJS.Timeout | null = null;

const isOwner = computed(() => {
  return props.pool.user_id === props.userId;
});

const isValidJson = computed(() => {
  try {
    JSON.parse(payloadText.value);
    return true;
  } catch {
    return false;
  }
});

const userJobs = computed(() => {
  // For now, show all jobs since we don't have user_id in job data
  // In a real implementation, you'd filter by user_id
  return jobs.value.slice(0, 20); // Limit to recent 20 jobs
});

const jobStats = computed(() => {
  const stats = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    failed: 0
  };
  
  userJobs.value.forEach(job => {
    stats[job.status as keyof typeof stats]++;
  });
  
  return stats;
});

const loadJobs = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    const newJobs = await ApiService.getPoolJobs(props.pool.id);
    
    // Store job history for progress tracking
    newJobs.forEach(job => {
      if (!jobHistory.value.has(job.id)) {
        jobHistory.value.set(job.id, []);
      }
      const history = jobHistory.value.get(job.id)!;
      
      const lastEntry = history[history.length - 1];
      if (!lastEntry || lastEntry.progress !== job.progress || lastEntry.status !== job.status) {
        history.push({ ...job, timestamp: new Date().toISOString() } as any);
        
        if (history.length > 50) {
          history.splice(0, history.length - 50);
        }
      }
    });
    
    jobs.value = newJobs;
    isLive.value = true;
  } catch (e) {
    error.value = 'Failed to load jobs. Please try again.';
    isLive.value = false;
    console.error('Error loading jobs:', e);
  } finally {
    loading.value = false;
  }
};

const loadHistoryJobs = async () => {
  try {
    loadingHistory.value = true;
    const status = historyFilter.value as JobStatus | undefined;
    historyJobs.value = await ApiService.getPoolJobs(props.pool.id, status);
  } catch (e) {
    console.error('Error loading history:', e);
  } finally {
    loadingHistory.value = false;
  }
};

const submitJob = async () => {
  if (!validatePayload()) return;
  
  try {
    submitting.value = true;
    
    const payload = JSON.parse(payloadText.value);
    const job = await ApiService.submitJob(props.pool.id, payload, props.userId);
    
    // Clear form
    payloadText.value = '{\n  "task": "example_task",\n  "parameters": {\n    "input": "sample_data",\n    "timeout": 300\n  }\n}';
    
    // Refresh jobs
    await loadJobs();
    
    emit('job-submitted', job);
  } catch (error) {
    console.error('Error submitting job:', error);
    payloadError.value = 'Failed to submit job. Please try again.';
  } finally {
    submitting.value = false;
  }
};

const clearJobs = async () => {
  try {
    clearing.value = true;
    clearError.value = null;
    
    const status = clearFilter.value as JobStatus | undefined;
    await ApiService.clearPoolJobs(props.pool.id, props.userId, status);
    
    // Refresh jobs after clearing
    await loadJobs();
    
    // Close modal
    closeClearModal();
  } catch (error) {
    console.error('Error clearing jobs:', error);
    clearError.value = 'Failed to clear jobs. Please try again.';
  } finally {
    clearing.value = false;
  }
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

const startAutoRefresh = () => {
  if (refreshTimer) clearInterval(refreshTimer);
  
  refreshTimer = setInterval(() => {
    loadJobs();
  }, 3000);
};

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

const isRecentlyUpdated = (job: Job) => {
  const updateTime = new Date(job.updated_at).getTime();
  const now = new Date().getTime();
  return (now - updateTime) < 10000; // Updated within last 10 seconds
};

const getElapsedTime = (startTime: string) => {
  const start = new Date(startTime).getTime();
  const now = new Date().getTime();
  const diffInMinutes = Math.floor((now - start) / (1000 * 60));
  
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ${diffInMinutes % 60}m`;
  return `${Math.floor(diffInMinutes / 1440)}d`;
};

const getProgressSpeed = (job: Job) => {
  const speed = getProgressSpeedValue(job);
  return speed > 0 ? `${speed.toFixed(1)}` : null;
};

const getProgressSpeedValue = (job: Job) => {
  const history = jobHistory.value.get(job.id);
  if (!history || history.length < 2) return 0;
  
  const recent = history.slice(-5);
  if (recent.length < 2) return 0;
  
  const firstEntry = recent[0];
  const lastEntry = recent[recent.length - 1];
  
  const progressDiff = (lastEntry.progress || 0) - (firstEntry.progress || 0);
  const timeDiff = new Date(lastEntry.timestamp || lastEntry.updated_at).getTime() - 
                   new Date(firstEntry.timestamp || firstEntry.updated_at).getTime();
  
  if (timeDiff <= 0 || progressDiff <= 0) return 0;
  
  const minutesDiff = timeDiff / (1000 * 60);
  return progressDiff / minutesDiff;
};

const getETA = (job: Job) => {
  const speed = getProgressSpeedValue(job);
  if (speed <= 0 || !job.progress) return null;
  
  const remainingProgress = 100 - job.progress;
  const minutesRemaining = remainingProgress / speed;
  
  if (minutesRemaining < 60) return `${Math.round(minutesRemaining)}m`;
  if (minutesRemaining < 1440) return `${Math.round(minutesRemaining / 60)}h`;
  return `${Math.round(minutesRemaining / 1440)}d`;
};

const getTaskName = (payload: Record<string, any>) => {
  return payload.task || payload.name || payload.type || 'Unknown Task';
};

const getTaskDetails = (payload: Record<string, any>) => {
  const details = [];
  if (payload.parameters?.input) details.push(`Input: ${String(payload.parameters.input).slice(0, 15)}...`);
  if (payload.timeout) details.push(`${payload.timeout}s`);
  return details.join(' • ') || 'No details';
};

const viewJobDetails = (job: Job) => {
  selectedJob.value = job;
};

const closeModal = () => {
  selectedJob.value = null;
};

const closeHistoryModal = () => {
  showHistoryModal.value = false;
  historyJobs.value = [];
  historyFilter.value = '';
};

const closeClearModal = () => {
  showClearModal.value = false;
  clearFilter.value = '';
  clearError.value = null;
};

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatRelativeTime = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatPayload = (payload: Record<string, any>) => {
  return JSON.stringify(payload, null, 2);
};

// Watch for pool changes
watch(() => props.pool.id, () => {
  jobHistory.value.clear();
  loadJobs();
});

// Watch for history modal
watch(showHistoryModal, (show) => {
  if (show) {
    loadHistoryJobs();
  }
});

onMounted(() => {
  loadJobs();
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style scoped>
.job-manager {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e8eaed;
}

.manager-header {
  margin-bottom: 32px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.title-section {
  flex: 1;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1d29;
  margin: 0 0 12px 0;
}

.status-indicators {
  display: flex;
  gap: 12px;
}

.indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.indicator.active {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.indicator.inactive {
  background: rgba(156, 163, 175, 0.1);
  color: #6b7280;
}

.indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s infinite;
}

.controls-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.history-button, .clear-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  background: white;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 13px;
  font-weight: 600;
}

.clear-button {
  border-color: #fecaca;
  background: rgba(254, 202, 202, 0.1);
  color: #dc2626;
}

.clear-button:hover {
  border-color: #fca5a5;
  background: rgba(254, 202, 202, 0.2);
}

.history-button:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.button-icon {
  font-size: 14px;
}

/* Job Submission */
.submission-section {
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid #f0f0f0;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #1a1d29;
  margin-bottom: 12px;
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

.payload-textarea {
  width: 100%;
  border: none;
  border-radius: 10px 10px 0 0;
  padding: 16px;
  font-size: 14px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  line-height: 1.6;
  resize: vertical;
  background: transparent;
  color: #1a1d29;
  min-height: 120px;
}

.payload-textarea:focus {
  outline: none;
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

.submit-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.submit-button:disabled {
  background: #9aa0a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
  margin: 0;
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

/* Jobs Section */
.jobs-section {
  /* Section styling */
}

.jobs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.jobs-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1d29;
  margin: 0;
}

.jobs-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.stat {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.stat.pending {
  background: #fef3c7;
  color: #92400e;
}

.stat.in-progress {
  background: #dbeafe;
  color: #1e40af;
}

.stat.completed {
  background: #d1fae5;
  color: #065f46;
}

.stat.failed {
  background: #fee2e2;
  color: #991b1b;
}

/* Loading, Error, Empty States */
.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  text-align: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f0f0f0;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.loading-text, .error-message, .empty-message {
  color: #6b7280;
  margin: 0;
  font-size: 14px;
}

.error-icon, .empty-icon {
  font-size: 40px;
  margin-bottom: 16px;
  opacity: 0.8;
}

.empty-title {
  color: #1a1d29;
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.retry-button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 16px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.retry-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Jobs Grid */
.jobs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.job-card {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  background: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.job-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.job-card.pending::before {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.job-card.in_progress::before {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.job-card.completed::before {
  background: linear-gradient(135deg, #10b981, #059669);
}

.job-card.failed::before {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.job-card:hover {
  border-color: #d1d5db;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.job-card.recently-updated {
  border-color: #10b981;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
  animation: glow 2s ease-in-out;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.job-identity {
  display: flex;
  align-items: center;
  gap: 10px;
}

.job-id {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 13px;
  color: #6b7280;
  font-weight: 600;
  background: #f3f4f6;
  padding: 3px 6px;
  border-radius: 4px;
}

.job-status {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
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

.time-elapsed {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

/* Progress Section */
.progress-section {
  margin-bottom: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.progress-percentage {
  font-size: 14px;
  font-weight: 700;
  color: #1a1d29;
}

.progress-bar-container {
  margin-bottom: 8px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar.large {
  height: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 4px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #6b7280;
}

/* Payload Preview */
.payload-preview {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-name {
  font-weight: 600;
  color: #1a1d29;
  font-size: 13px;
}

.task-details {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.4;
}

/* Card Footer */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timestamps {
  font-size: 11px;
  color: #9ca3af;
}

.details-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.details-button:hover {
  background: #e5e7eb;
  transform: scale(1.05);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-container.large {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0 24px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 24px;
}

.modal-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1d29;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #9ca3af;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.close-button:hover {
  background: #f3f4f6;
  color: #6b7280;
}

.modal-content {
  padding: 0 24px 24px 24px;
}

/* Detail Grid */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-weight: 600;
  color: #6b7280;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  color: #1a1d29;
  font-size: 14px;
  font-weight: 500;
}

.monospace {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}

.progress-detail {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Payload Section */
.payload-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 20px;
}

.payload-full {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #1a1d29;
  margin: 0;
  overflow-x: auto;
}

/* History Filters */
.history-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}

.filter-select {
  border: 2px solid #e8eaed;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  background: white;
  cursor: pointer;
  font-weight: 500;
  color: #1a1d29;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.refresh-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: white;
  border: 2px solid #e8eaed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: #5f6368;
}

.refresh-button:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #dadce0;
}

.refresh-icon {
  font-size: 16px;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

/* History List */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.history-item:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.job-date {
  font-size: 12px;
  color: #6b7280;
}

.progress-info {
  font-size: 12px;
  color: #3b82f6;
  font-weight: 600;
}

/* Clear Jobs Modal */
.clear-options {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.clear-warning {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #fef7f7;
  border: 1px solid #fce8e6;
  border-radius: 12px;
}

.warning-icon {
  font-size: 24px;
  color: #ea4335;
  flex-shrink: 0;
}

.warning-content {
  flex: 1;
}

.warning-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1d29;
  margin: 0 0 8px 0;
}

.warning-message {
  color: #5f6368;
  margin: 0;
  line-height: 1.5;
}

.clear-filters {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-label {
  font-size: 14px;
  font-weight: 600;
  color: #1a1d29;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-option:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.filter-option input[type="radio"] {
  margin: 0;
}

.option-text {
  font-size: 14px;
  color: #1a1d29;
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.cancel-button {
  background: #f8f9fa;
  color: #5f6368;
  border: 2px solid #e8eaed;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.cancel-button:hover {
  background: #f1f3f4;
  border-color: #dadce0;
}

.clear-confirm-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #ea4335, #d33b2c);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 120px;
  justify-content: center;
}

.clear-confirm-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(234, 67, 53, 0.4);
}

.clear-confirm-button:disabled {
  background: #9aa0a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Animations */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.2); }
  50% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.4); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .job-manager {
    padding: 20px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .controls-section {
    justify-content: space-between;
    flex-wrap: wrap;
  }
  
  .jobs-grid {
    grid-template-columns: 1fr;
  }
  
  .jobs-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .modal-container {
    margin: 20px;
    max-height: calc(100vh - 40px);
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .history-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .clear-warning {
    flex-direction: column;
    gap: 12px;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>