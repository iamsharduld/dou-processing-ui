<template>
  <div class="job-queue">
    <div class="queue-header">
      <div class="header-content">
        <div class="title-section">
          <h2 class="queue-title">Job Queue Overview</h2>
          <p class="queue-subtitle">Monitor active and pending DoU processing jobs</p>
        </div>
        <div class="queue-actions">
          <button @click="refreshQueue" class="refresh-btn" :disabled="loading">
            <svg class="refresh-icon" :class="{ spinning: loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading && !jobs.length" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading job queue...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h3>Failed to Load Queue</h3>
      <p>{{ error }}</p>
      <button @click="refreshQueue" class="retry-btn">Try Again</button>
    </div>

    <div v-else-if="!jobs.length" class="empty-state">
      <div class="empty-icon">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
      </div>
      <h3>No Jobs in Queue</h3>
      <p>The processing queue is currently empty. Submit a new job to get started.</p>
    </div>

    <div v-else class="queue-content">
      <!-- Queue Statistics -->
      <div class="queue-stats">
        <div class="stat-card processing">
          <div class="stat-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ processingCount }}</div>
            <div class="stat-label">Processing</div>
          </div>
        </div>

        <div class="stat-card queued">
          <div class="stat-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ queuedCount }}</div>
            <div class="stat-label">Queued</div>
          </div>
        </div>

        <div class="stat-card completed">
          <div class="stat-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ completedCount }}</div>
            <div class="stat-label">Completed</div>
          </div>
        </div>

        <div class="stat-card total">
          <div class="stat-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ jobs.length }}</div>
            <div class="stat-label">Total Jobs</div>
          </div>
        </div>
      </div>

      <!-- Job List -->
      <div class="job-list">
        <div
          v-for="job in jobs"
          :key="job.id"
          class="job-card"
          :class="[job.status]"
        >
          <div class="job-header">
            <div class="job-info">
              <h4 class="job-name">{{ job.name }}</h4>
              <div class="job-meta">
                <span class="job-id">ID: {{ job.id }}</span>
                <span class="job-priority" :class="job.priority">{{ formatPriority(job.priority) }}</span>
              </div>
            </div>
            <div class="job-status-badge" :class="job.status">
              {{ formatStatus(job.status) }}
            </div>
          </div>

          <div class="job-progress" v-if="job.status === 'processing' && job.progress !== undefined">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${job.progress}%` }"></div>
            </div>
            <span class="progress-text">{{ job.progress }}% Complete</span>
          </div>

          <div class="job-footer">
            <div class="job-timing">
              <div class="timing-item">
                <span class="timing-label">Submitted:</span>
                <span class="timing-value">{{ formatTime(job.submittedAt) }}</span>
              </div>
              <div class="timing-item" v-if="job.estimatedCompletion">
                <span class="timing-label">Est. Completion:</span>
                <span class="timing-value">{{ formatTime(job.estimatedCompletion) }}</span>
              </div>
            </div>
            <div class="job-actions">
              <button class="action-btn view" @click="viewJobDetails(job)">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                View
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { DoUApiService } from '../services/api';
import type { QueueItem } from '../types';

const jobs = ref<QueueItem[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const processingCount = computed(() => 
  jobs.value.filter(job => job.status === 'processing').length
);

const queuedCount = computed(() => 
  jobs.value.filter(job => job.status === 'queued').length
);

const completedCount = computed(() => 
  jobs.value.filter(job => job.status === 'completed').length
);

const refreshQueue = async () => {
  try {
    loading.value = true;
    error.value = null;
    jobs.value = await DoUApiService.getJobQueue();
  } catch (e) {
    error.value = 'Failed to load job queue. Please try again.';
    console.error('Error loading job queue:', e);
  } finally {
    loading.value = false;
  }
};

const viewJobDetails = (job: QueueItem) => {
  // Implement job details view
  console.log('View job details:', job);
};

const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatPriority = (priority: string) => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

onMounted(() => {
  refreshQueue();
  
  // Auto-refresh every 10 seconds
  const interval = setInterval(refreshQueue, 10000);
  
  // Cleanup on unmount
  return () => clearInterval(interval);
});
</script>

<style scoped>
.job-queue {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.queue-header {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e5e7eb;
  padding: 32px;
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

.queue-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.queue-subtitle {
  color: #6b7280;
  margin: 0;
  font-size: 16px;
  line-height: 1.4;
}

.queue-actions {
  display: flex;
  gap: 12px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #374151;
}

.refresh-btn:hover:not(:disabled) {
  border-color: #3253DC;
  color: #3253DC;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  width: 16px;
  height: 16px;
  transition: transform 0.5s ease;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3253DC;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.error-icon,
.empty-icon {
  width: 64px;
  height: 64px;
  color: #9ca3af;
  margin-bottom: 20px;
}

.error-state h3,
.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.error-state p,
.empty-state p {
  color: #6b7280;
  margin: 0 0 24px 0;
  max-width: 400px;
}

.retry-btn {
  background: #3253DC;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.retry-btn:hover {
  background: #2A47C4;
}

.queue-content {
  padding: 32px;
}

.queue-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-card.processing {
  border-color: #3253DC;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.stat-card.queued {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.stat-card.completed {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}

.stat-card.total {
  border-color: #6b7280;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card.processing .stat-icon {
  background: #3253DC;
  color: white;
}

.stat-card.queued .stat-icon {
  background: #f59e0b;
  color: white;
}

.stat-card.completed .stat-icon {
  background: #10b981;
  color: white;
}

.stat-card.total .stat-icon {
  background: #6b7280;
  color: white;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.job-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.job-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.2s ease;
}

.job-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.job-card.processing {
  border-left: 4px solid #3253DC;
}

.job-card.queued {
  border-left: 4px solid #f59e0b;
}

.job-card.completed {
  border-left: 4px solid #10b981;
}

.job-card.failed {
  border-left: 4px solid #EF3E42;
}

.job-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.job-info {
  flex: 1;
}

.job-name {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.job-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.job-id {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
}

.job-priority {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.job-priority.low {
  background: #f3f4f6;
  color: #6b7280;
}

.job-priority.medium {
  background: #fef3c7;
  color: #92400e;
}

.job-priority.high {
  background: #fee2e2;
  color: #991b1b;
}

.job-priority.critical {
  background: #EF3E42;
  color: white;
}

.job-status-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.job-status-badge.processing {
  background: #3253DC;
  color: white;
}

.job-status-badge.queued {
  background: #f59e0b;
  color: white;
}

.job-status-badge.completed {
  background: #10b981;
  color: white;
}

.job-status-badge.failed {
  background: #EF3E42;
  color: white;
}

.job-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3253DC 0%, #2A47C4 100%);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-text {
  font-size: 12px;
  font-weight: 600;
  color: #3253DC;
  min-width: 80px;
  text-align: right;
}

.job-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.job-timing {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timing-item {
  display: flex;
  gap: 8px;
  font-size: 12px;
}

.timing-label {
  color: #6b7280;
  font-weight: 500;
}

.timing-value {
  color: #374151;
}

.job-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.view {
  background: #f3f4f6;
  color: #374151;
}

.action-btn.view:hover {
  background: #e5e7eb;
}

.action-btn svg {
  width: 14px;
  height: 14px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .queue-content {
    padding: 20px;
  }
  
  .queue-header {
    padding: 20px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .queue-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .job-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .job-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
}
</style>