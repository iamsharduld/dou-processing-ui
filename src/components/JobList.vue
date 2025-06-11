<template>
  <div class="job-list">
    <div class="list-header">
      <div class="header-content">
        <div class="title-section">
          <h3 class="section-title">Jobs in {{ pool.name }}</h3>
          <div class="stats-bar" v-if="stats">
            <div class="stat-chip total">{{ stats.jobs.total }} Total</div>
            <div class="stat-chip pending" v-if="stats.jobs.pending">{{ stats.jobs.pending }} Pending</div>
            <div class="stat-chip in-progress" v-if="stats.jobs.in_progress">{{ stats.jobs.in_progress }} Active</div>
            <div class="stat-chip completed" v-if="stats.jobs.completed">{{ stats.jobs.completed }} Done</div>
            <div class="stat-chip failed" v-if="stats.jobs.failed">{{ stats.jobs.failed }} Failed</div>
          </div>
        </div>
        
        <div class="controls-section">
          <select v-model="selectedStatus" @change="loadJobs" class="status-filter">
            <option value="">All Jobs</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <button @click="loadJobs" class="refresh-button" :disabled="loading">
            <span class="refresh-icon" :class="{ spinning: loading }">↻</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading && !jobs.length" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading jobs...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ error }}</p>
      <button @click="loadJobs" class="retry-button">Try Again</button>
    </div>

    <div v-else-if="!jobs.length" class="empty-state">
      <div class="empty-icon">📋</div>
      <h4 class="empty-title">No jobs found</h4>
      <p class="empty-message" v-if="selectedStatus">No {{ selectedStatus.replace('_', ' ') }} jobs in this pool.</p>
      <p class="empty-message" v-else>No jobs have been submitted to this pool yet.</p>
    </div>

    <div v-else class="jobs-container">
      <div
        v-for="job in jobs"
        :key="job.id"
        class="job-card"
        :class="[job.status]"
        @click="viewJob(job)"
      >
        <div class="card-header">
          <div class="job-identity">
            <span class="job-id">{{ job.id.slice(0, 8) }}...</span>
            <span class="job-status" :class="job.status">{{ formatStatus(job.status) }}</span>
          </div>
          <div class="job-progress" v-if="job.status === 'in_progress' && job.progress">
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${job.progress}%` }"></div>
              </div>
              <span class="progress-text">{{ job.progress }}%</span>
            </div>
          </div>
        </div>

        <div class="card-content">
          <div class="payload-preview">
            <h5 class="payload-label">Payload Preview</h5>
            <pre class="payload-text">{{ formatPayloadPreview(job.payload) }}</pre>
          </div>
        </div>

        <div class="card-footer">
          <div class="job-timestamps">
            <span class="timestamp">Created {{ formatRelativeTime(job.created_at) }}</span>
            <span class="timestamp" v-if="job.updated_at !== job.created_at">
              Updated {{ formatRelativeTime(job.updated_at) }}
            </span>
          </div>
          <div class="card-actions">
            <button class="view-button">View Details</button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { ApiService } from '../services/api';
import type { Pool, Job, JobStatus, PoolStats } from '../types';

const props = defineProps<{
  pool: Pool;
}>();

const jobs = ref<Job[]>([]);
const stats = ref<PoolStats | null>(null);
const selectedStatus = ref<JobStatus | ''>('');
const loading = ref(false);
const error = ref<string | null>(null);
const selectedJob = ref<Job | null>(null);

const loadJobs = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    const status = selectedStatus.value as JobStatus | undefined;
    jobs.value = await ApiService.getPoolJobs(props.pool.id, status);
    
    // Load stats
    stats.value = await ApiService.getPoolStats(props.pool.id);
  } catch (e) {
    error.value = 'Failed to load jobs. Please try again.';
    console.error('Error loading jobs:', e);
  } finally {
    loading.value = false;
  }
};

const viewJob = (job: Job) => {
  selectedJob.value = job;
};

const closeModal = () => {
  selectedJob.value = null;
};

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatPayload = (payload: Record<string, any>) => {
  return JSON.stringify(payload, null, 2);
};

const formatPayloadPreview = (payload: Record<string, any>) => {
  const str = JSON.stringify(payload, null, 2);
  return str.length > 100 ? str.substring(0, 100) + '...' : str;
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

const formatRelativeTime = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

// Watch for pool changes
watch(() => props.pool.id, () => {
  loadJobs();
});

onMounted(() => {
  loadJobs();
  
  // Auto-refresh every 5 seconds
  const interval = setInterval(loadJobs, 5000);
  
  // Cleanup on unmount
  return () => clearInterval(interval);
});
</script>

<style scoped>
.job-list {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e8eaed;
}

.list-header {
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
  margin: 0 0 16px 0;
}

.stats-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-chip {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid transparent;
}

.stat-chip.total {
  background: #f8f9fa;
  color: #1a1d29;
  border-color: #e8eaed;
}

.stat-chip.pending {
  background: #fef3c7;
  color: #92400e;
  border-color: #fde68a;
}

.stat-chip.in-progress {
  background: #dbeafe;
  color: #1e40af;
  border-color: #bfdbfe;
}

.stat-chip.completed {
  background: #d1fae5;
  color: #065f46;
  border-color: #a7f3d0;
}

.stat-chip.failed {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fecaca;
}

.controls-section {
  display: flex;
  gap: 12px;
  align-items: center;
}

.status-filter {
  border: 2px solid #e8eaed;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  font-weight: 500;
  color: #1a1d29;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.status-filter:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.refresh-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: white;
  border: 2px solid #e8eaed;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: #5f6368;
}

.refresh-button:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #dadce0;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 18px;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

/* Loading, Error, Empty States */
.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 0;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.loading-text, .error-message, .empty-message {
  color: #5f6368;
  margin: 0;
  font-size: 16px;
}

.error-icon, .empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.8;
}

.empty-title {
  color: #1a1d29;
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.retry-button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 16px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.retry-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Jobs Container */
.jobs-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.job-card {
  border: 2px solid #e8eaed;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  position: relative;
  overflow: hidden;
}

.job-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: transparent;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
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
  border-color: #dadce0;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.job-identity {
  display: flex;
  align-items: center;
  gap: 12px;
}

.job-id {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 14px;
  color: #5f6368;
  font-weight: 600;
}

.job-status {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
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

.job-progress {
  display: flex;
  align-items: center;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  width: 120px;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar.large {
  width: 200px;
  height: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 4px;
}

.progress-text, .progress-percentage {
  font-size: 12px;
  color: #5f6368;
  font-weight: 600;
}

.card-content {
  margin-bottom: 20px;
}

.payload-preview {
  background: #fafbfc;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
}

.payload-label {
  font-size: 12px;
  font-weight: 600;
  color: #5f6368;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.payload-text {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #1a1d29;
  margin: 0;
  overflow-x: auto;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.job-timestamps {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timestamp {
  font-size: 12px;
  color: #9aa0a6;
  font-weight: 500;
}

.view-button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.view-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
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
  max-width: 700px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32px 32px 0 32px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 32px;
}

.modal-title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a1d29;
}

.close-button {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #9aa0a6;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.close-button:hover {
  background: #f8f9fa;
  color: #5f6368;
}

.modal-content {
  padding: 0 32px 32px 32px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-label {
  font-weight: 600;
  color: #5f6368;
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
  gap: 16px;
}

.payload-section {
  border-top: 1px solid #f0f0f0;
  padding-top: 24px;
}

.payload-section .detail-label {
  margin-bottom: 12px;
}

.payload-full {
  background: #fafbfc;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 20px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #1a1d29;
  margin: 0;
  overflow-x: auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .job-list {
    padding: 24px 20px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
  }
  
  .controls-section {
    justify-content: space-between;
  }
  
  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .card-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .modal-container {
    margin: 20px;
    max-height: calc(100vh - 40px);
  }
  
  .modal-header, .modal-content {
    padding-left: 24px;
    padding-right: 24px;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>