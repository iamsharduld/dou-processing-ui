<template>
  <div class="job-list">
    <div class="header">
      <div class="title-section">
        <h3 class="title">Jobs in {{ pool.name }}</h3>
        <div class="stats" v-if="stats">
          <div class="stat-badge total">{{ stats.jobs.total }} Total</div>
          <div class="stat-badge pending" v-if="stats.jobs.pending">{{ stats.jobs.pending }} Pending</div>
          <div class="stat-badge in-progress" v-if="stats.jobs.in_progress">{{ stats.jobs.in_progress }} In Progress</div>
          <div class="stat-badge completed" v-if="stats.jobs.completed">{{ stats.jobs.completed }} Completed</div>
          <div class="stat-badge failed" v-if="stats.jobs.failed">{{ stats.jobs.failed }} Failed</div>
        </div>
      </div>
      
      <div class="controls">
        <select v-model="selectedStatus" @change="loadJobs" class="status-filter">
          <option value="">All Jobs</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <button @click="loadJobs" class="refresh-btn" :disabled="loading">
          <span class="refresh-icon" :class="{ spinning: loading }">🔄</span>
          Refresh
        </button>
      </div>
    </div>

    <div v-if="loading && !jobs.length" class="loading">
      <div class="spinner"></div>
      <p>Loading jobs...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadJobs" class="retry-btn">Retry</button>
    </div>

    <div v-else-if="!jobs.length" class="empty-state">
      <div class="empty-icon">📋</div>
      <h4>No jobs found</h4>
      <p v-if="selectedStatus">No {{ selectedStatus }} jobs in this pool.</p>
      <p v-else>No jobs have been submitted to this pool yet.</p>
    </div>

    <div v-else class="jobs-container">
      <div
        v-for="job in jobs"
        :key="job.id"
        class="job-card"
        :class="[job.status]"
      >
        <div class="job-header">
          <div class="job-basic-info">
            <span class="job-id">{{ job.id.slice(0, 8) }}...</span>
            <span class="job-status" :class="job.status">{{ formatStatus(job.status) }}</span>
          </div>
          <div class="job-progress" v-if="job.status === 'in_progress' && job.progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${job.progress}%` }"></div>
            </div>
            <span class="progress-text">{{ job.progress }}%</span>
          </div>
        </div>

        <div class="job-payload">
          <h5 class="payload-title">Payload:</h5>
          <pre class="payload-content">{{ formatPayload(job.payload) }}</pre>
        </div>

        <div class="job-footer">
          <div class="job-dates">
            <span class="date-item">Created: {{ formatDateTime(job.created_at) }}</span>
            <span class="date-item" v-if="job.updated_at !== job.created_at">
              Updated: {{ formatDateTime(job.updated_at) }}
            </span>
          </div>
          <button @click="viewJob(job)" class="view-btn">View Details</button>
        </div>
      </div>
    </div>

    <!-- Job Details Modal -->
    <div v-if="selectedJob" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Job Details</h3>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-content">
          <div class="detail-row">
            <label>Job ID:</label>
            <span class="monospace">{{ selectedJob.id }}</span>
          </div>
          <div class="detail-row">
            <label>Status:</label>
            <span class="job-status" :class="selectedJob.status">{{ formatStatus(selectedJob.status) }}</span>
          </div>
          <div class="detail-row" v-if="selectedJob.progress">
            <label>Progress:</label>
            <span>{{ selectedJob.progress }}%</span>
          </div>
          <div class="detail-row">
            <label>Created:</label>
            <span>{{ formatDateTime(selectedJob.created_at) }}</span>
          </div>
          <div class="detail-row">
            <label>Updated:</label>
            <span>{{ formatDateTime(selectedJob.updated_at) }}</span>
          </div>
          <div class="detail-row payload-row">
            <label>Payload:</label>
            <pre class="payload-detail">{{ formatPayload(selectedJob.payload) }}</pre>
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

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString();
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
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
}

.title-section {
  flex: 1;
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.stat-badge.total {
  background: #f3f4f6;
  color: #374151;
}

.stat-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.stat-badge.in-progress {
  background: #dbeafe;
  color: #1e40af;
}

.stat-badge.completed {
  background: #d1fae5;
  color: #065f46;
}

.stat-badge.failed {
  background: #fee2e2;
  color: #991b1b;
}

.controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.status-filter {
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.status-filter:focus {
  outline: none;
  border-color: #3b82f6;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f3f4f6;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  transition: transform 0.5s;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.error {
  text-align: center;
  padding: 48px 0;
  color: #ef4444;
}

.retry-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 16px;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: #2563eb;
}

.empty-state {
  text-align: center;
  padding: 48px 0;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h4 {
  color: #374151;
  margin: 0 0 8px 0;
}

.empty-state p {
  color: #6b7280;
  margin: 0;
}

.jobs-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.job-card {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s;
  background: white;
}

.job-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.job-card.pending {
  border-left: 4px solid #f59e0b;
}

.job-card.in_progress {
  border-left: 4px solid #3b82f6;
}

.job-card.completed {
  border-left: 4px solid #10b981;
}

.job-card.failed {
  border-left: 4px solid #ef4444;
}

.job-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.job-basic-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.job-id {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
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

.job-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  width: 100px;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.job-payload {
  margin-bottom: 16px;
}

.payload-title {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin: 0 0 8px 0;
}

.payload-content {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.4;
  color: #374151;
  margin: 0;
  overflow-x: auto;
  max-height: 120px;
  overflow-y: auto;
}

.job-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.job-dates {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-item {
  font-size: 12px;
  color: #6b7280;
}

.view-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.view-btn:hover {
  background: #2563eb;
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
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0 24px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 24px;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
}

.modal-content {
  padding: 0 24px 24px 24px;
}

.detail-row {
  display: flex;
  margin-bottom: 16px;
  align-items: flex-start;
}

.detail-row label {
  font-weight: 500;
  color: #374151;
  min-width: 80px;
  margin-right: 16px;
}

.monospace {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
}

.payload-row {
  flex-direction: column;
  align-items: stretch;
}

.payload-row label {
  margin-bottom: 8px;
}

.payload-detail {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.4;
  color: #374151;
  margin: 0;
  overflow-x: auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .controls {
    justify-content: space-between;
  }
  
  .job-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .job-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .modal {
    margin: 20px;
    max-height: calc(100vh - 40px);
  }
}
</style>