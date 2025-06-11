<template>
  <div class="progress-grid">
    <div class="grid-header">
      <div class="header-content">
        <div class="title-section">
          <h3 class="section-title">Live Progress Monitor</h3>
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
          <div class="refresh-info">
            <span class="refresh-text">Updates every {{ refreshInterval / 1000 }}s</span>
          </div>
          <button @click="toggleAutoRefresh" class="toggle-button" :class="{ active: autoRefresh }">
            <span class="toggle-icon">{{ autoRefresh ? '⏸️' : '▶️' }}</span>
            <span>{{ autoRefresh ? 'Pause' : 'Resume' }}</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading && !jobs.length" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading progress data...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ error }}</p>
      <button @click="loadJobs" class="retry-button">Retry</button>
    </div>

    <div v-else-if="!activeJobs.length" class="empty-state">
      <div class="empty-icon">📊</div>
      <h4 class="empty-title">No active jobs</h4>
      <p class="empty-message">No jobs are currently in progress in this pool.</p>
    </div>

    <div v-else class="progress-container">
      <!-- Summary Stats -->
      <div class="summary-stats">
        <div class="stat-card">
          <div class="stat-value">{{ activeJobs.length }}</div>
          <div class="stat-label">Active Jobs</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ averageProgress.toFixed(1) }}%</div>
          <div class="stat-label">Avg Progress</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ completedToday }}</div>
          <div class="stat-label">Completed Today</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ estimatedTimeRemaining }}</div>
          <div class="stat-label">Est. Time Left</div>
        </div>
      </div>

      <!-- Progress Grid -->
      <div class="jobs-grid">
        <div
          v-for="job in activeJobs"
          :key="job.id"
          class="progress-card"
          :class="[job.status, { 'recently-updated': isRecentlyUpdated(job) }]"
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

          <div class="progress-section">
            <div class="progress-header">
              <span class="progress-label">Progress</span>
              <span class="progress-percentage">{{ job.progress || 0 }}%</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ 
                    width: `${job.progress || 0}%`,
                    animationDuration: `${getAnimationDuration(job)}s`
                  }"
                ></div>
                <div class="progress-glow" :style="{ left: `${job.progress || 0}%` }"></div>
              </div>
            </div>
            <div class="progress-details">
              <span class="eta" v-if="getETA(job)">ETA: {{ getETA(job) }}</span>
              <span class="speed" v-if="getProgressSpeed(job)">{{ getProgressSpeed(job) }}%/min</span>
            </div>
          </div>

          <div class="payload-preview">
            <div class="payload-header">
              <span class="payload-label">Task</span>
            </div>
            <div class="payload-content">
              <span class="task-name">{{ getTaskName(job.payload) }}</span>
              <span class="task-details">{{ getTaskDetails(job.payload) }}</span>
            </div>
          </div>

          <div class="card-footer">
            <div class="last-update">
              <span class="update-text">Updated {{ formatRelativeTime(job.updated_at) }}</span>
            </div>
            <div class="card-actions">
              <button @click="viewJobDetails(job)" class="details-button">
                <span class="button-icon">👁️</span>
              </button>
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
            <h3 class="modal-title">Job Progress Details</h3>
            <span class="job-status" :class="selectedJob.status">{{ formatStatus(selectedJob.status) }}</span>
          </div>
          <button @click="closeModal" class="close-button">&times;</button>
        </div>
        <div class="modal-content">
          <div class="progress-chart">
            <div class="chart-header">
              <h4 class="chart-title">Progress Over Time</h4>
              <div class="chart-stats">
                <span class="current-progress">{{ selectedJob.progress || 0 }}% Complete</span>
              </div>
            </div>
            <div class="large-progress-bar">
              <div class="progress-track">
                <div 
                  class="progress-fill large" 
                  :style="{ width: `${selectedJob.progress || 0}%` }"
                ></div>
              </div>
              <div class="progress-markers">
                <span class="marker" style="left: 25%">25%</span>
                <span class="marker" style="left: 50%">50%</span>
                <span class="marker" style="left: 75%">75%</span>
              </div>
            </div>
          </div>
          
          <div class="job-details-grid">
            <div class="detail-section">
              <h5 class="section-title">Job Information</h5>
              <div class="detail-items">
                <div class="detail-item">
                  <span class="detail-label">Job ID</span>
                  <span class="detail-value monospace">{{ selectedJob.id }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Started</span>
                  <span class="detail-value">{{ formatDateTime(selectedJob.created_at) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Last Update</span>
                  <span class="detail-value">{{ formatDateTime(selectedJob.updated_at) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Duration</span>
                  <span class="detail-value">{{ getElapsedTime(selectedJob.created_at) }}</span>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h5 class="section-title">Performance Metrics</h5>
              <div class="detail-items">
                <div class="detail-item">
                  <span class="detail-label">Progress Speed</span>
                  <span class="detail-value">{{ getProgressSpeed(selectedJob) || 'Calculating...' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Estimated Completion</span>
                  <span class="detail-value">{{ getETA(selectedJob) || 'Calculating...' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="payload-section">
            <h5 class="section-title">Complete Payload</h5>
            <pre class="payload-full">{{ formatPayload(selectedJob.payload) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { ApiService } from '../services/api';
import type { Pool, Job } from '../types';

const props = defineProps<{
  pool: Pool;
}>();

const jobs = ref<Job[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const selectedJob = ref<Job | null>(null);
const autoRefresh = ref(true);
const refreshInterval = ref(2000); // 2 seconds
const isLive = ref(false);
const jobHistory = ref<Map<string, Job[]>>(new Map());

let refreshTimer: NodeJS.Timeout | null = null;

const activeJobs = computed(() => {
  return jobs.value.filter(job => 
    job.status === 'in_progress' || 
    (job.status === 'pending' && job.progress && job.progress > 0)
  );
});

const averageProgress = computed(() => {
  if (!activeJobs.value.length) return 0;
  const total = activeJobs.value.reduce((sum, job) => sum + (job.progress || 0), 0);
  return total / activeJobs.value.length;
});

const completedToday = computed(() => {
  const today = new Date().toDateString();
  return jobs.value.filter(job => 
    job.status === 'completed' && 
    new Date(job.updated_at).toDateString() === today
  ).length;
});

const estimatedTimeRemaining = computed(() => {
  const activeJobsWithProgress = activeJobs.value.filter(job => job.progress && job.progress > 0);
  if (!activeJobsWithProgress.length) return 'N/A';
  
  let totalMinutesRemaining = 0;
  let jobsWithETA = 0;
  
  activeJobsWithProgress.forEach(job => {
    const speed = getProgressSpeedValue(job);
    if (speed > 0) {
      const remainingProgress = 100 - (job.progress || 0);
      const minutesRemaining = remainingProgress / speed;
      totalMinutesRemaining += minutesRemaining;
      jobsWithETA++;
    }
  });
  
  if (jobsWithETA === 0) return 'N/A';
  
  const avgMinutes = totalMinutesRemaining / jobsWithETA;
  if (avgMinutes < 60) return `${Math.round(avgMinutes)}m`;
  if (avgMinutes < 1440) return `${Math.round(avgMinutes / 60)}h`;
  return `${Math.round(avgMinutes / 1440)}d`;
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
      
      // Only add if progress has changed or it's a new entry
      const lastEntry = history[history.length - 1];
      if (!lastEntry || lastEntry.progress !== job.progress || lastEntry.status !== job.status) {
        history.push({ ...job, timestamp: new Date().toISOString() } as any);
        
        // Keep only last 50 entries per job
        if (history.length > 50) {
          history.splice(0, history.length - 50);
        }
      }
    });
    
    jobs.value = newJobs;
    isLive.value = true;
  } catch (e) {
    error.value = 'Failed to load job progress. Please try again.';
    isLive.value = false;
    console.error('Error loading jobs:', e);
  } finally {
    loading.value = false;
  }
};

const startAutoRefresh = () => {
  if (refreshTimer) clearInterval(refreshTimer);
  
  refreshTimer = setInterval(() => {
    if (autoRefresh.value) {
      loadJobs();
    }
  }, refreshInterval.value);
};

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value;
  if (autoRefresh.value) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
    isLive.value = false;
  }
};

const isRecentlyUpdated = (job: Job) => {
  const updateTime = new Date(job.updated_at).getTime();
  const now = new Date().getTime();
  return (now - updateTime) < 5000; // Updated within last 5 seconds
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
  return speed > 0 ? `${speed.toFixed(1)}%/min` : null;
};

const getProgressSpeedValue = (job: Job) => {
  const history = jobHistory.value.get(job.id);
  if (!history || history.length < 2) return 0;
  
  const recent = history.slice(-5); // Last 5 updates
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

const getAnimationDuration = (job: Job) => {
  const speed = getProgressSpeedValue(job);
  return speed > 0 ? Math.max(0.5, 2 / speed) : 2;
};

const getTaskName = (payload: Record<string, any>) => {
  return payload.task || payload.name || payload.type || 'Unknown Task';
};

const getTaskDetails = (payload: Record<string, any>) => {
  const details = [];
  if (payload.parameters?.input) details.push(`Input: ${String(payload.parameters.input).slice(0, 20)}...`);
  if (payload.timeout) details.push(`Timeout: ${payload.timeout}s`);
  if (payload.priority) details.push(`Priority: ${payload.priority}`);
  return details.join(' • ') || 'No additional details';
};

const viewJobDetails = (job: Job) => {
  selectedJob.value = job;
};

const closeModal = () => {
  selectedJob.value = null;
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
    minute: '2-digit',
    second: '2-digit'
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

onMounted(() => {
  loadJobs();
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style scoped>
.progress-grid {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e8eaed;
}

.grid-header {
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
  gap: 16px;
}

.refresh-info {
  font-size: 13px;
  color: #6b7280;
}

.toggle-button {
  display: flex;
  align-items: center;
  gap: 8px;
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

.toggle-button.active {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
  color: #059669;
}

.toggle-button:hover {
  border-color: #d1d5db;
  background: #f9fafb;
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
  color: #6b7280;
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

/* Summary Stats */
.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #1a1d29;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Progress Grid */
.jobs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
}

.progress-card {
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  background: white;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.progress-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-card.recently-updated {
  border-color: #10b981;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
  animation: glow 2s ease-in-out;
}

.progress-card.recently-updated::before {
  background: linear-gradient(135deg, #10b981, #059669);
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
  color: #6b7280;
  font-weight: 600;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 6px;
}

.job-status {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.job-status.in_progress {
  background: #dbeafe;
  color: #1e40af;
}

.job-status.pending {
  background: #fef3c7;
  color: #92400e;
}

.time-elapsed {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

/* Progress Section */
.progress-section {
  margin-bottom: 20px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.progress-percentage {
  font-size: 16px;
  font-weight: 700;
  color: #1a1d29;
}

.progress-bar-container {
  position: relative;
  margin-bottom: 12px;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: #f3f4f6;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 6px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

.progress-glow {
  position: absolute;
  top: -2px;
  width: 4px;
  height: 16px;
  background: radial-gradient(circle, #3b82f6, transparent);
  border-radius: 2px;
  transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.8;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
}

/* Payload Preview */
.payload-preview {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.payload-header {
  margin-bottom: 8px;
}

.payload-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.payload-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-name {
  font-weight: 600;
  color: #1a1d29;
  font-size: 14px;
}

.task-details {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

/* Card Footer */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.last-update {
  font-size: 12px;
  color: #9ca3af;
}

.details-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.details-button:hover {
  background: #e5e7eb;
  transform: scale(1.05);
}

.button-icon {
  font-size: 14px;
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
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
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
  color: #9ca3af;
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
  background: #f3f4f6;
  color: #6b7280;
}

.modal-content {
  padding: 0 32px 32px 32px;
}

/* Progress Chart */
.progress-chart {
  margin-bottom: 32px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1d29;
  margin: 0;
}

.current-progress {
  font-size: 18px;
  font-weight: 700;
  color: #3b82f6;
}

.large-progress-bar {
  position: relative;
}

.progress-track {
  width: 100%;
  height: 20px;
  background: #f3f4f6;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill.large {
  height: 100%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 10px;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-markers {
  display: flex;
  justify-content: space-between;
  position: relative;
  font-size: 12px;
  color: #6b7280;
}

.marker {
  position: absolute;
  transform: translateX(-50%);
}

/* Job Details Grid */
.job-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  margin-bottom: 32px;
}

.detail-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.detail-value {
  font-size: 13px;
  color: #1a1d29;
  font-weight: 600;
}

.monospace {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}

/* Payload Section */
.payload-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 24px;
}

.payload-full {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #1a1d29;
  margin: 0;
  overflow-x: auto;
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

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .progress-grid {
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
  
  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .jobs-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-container {
    margin: 20px;
    max-height: calc(100vh - 40px);
  }
  
  .modal-header, .modal-content {
    padding-left: 24px;
    padding-right: 24px;
  }
  
  .job-details-grid {
    grid-template-columns: 1fr;
  }
}
</style>